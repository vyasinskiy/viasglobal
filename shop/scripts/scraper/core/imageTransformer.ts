import sharp from "sharp";

/**
 * Опции анти-поисковой трансформации изображений
 */
export interface AntiSearchTransformOptions {
  /** Угол микроповорота в градусах (по умолчанию 1.9°) */
  rotationAngle?: number;
  /** Процент кропа краев после поворота (по умолчанию 0.035 = 3.5%) */
  cropPercent?: number;
  /** Толщина микрорамки в пикселях (по умолчанию 14px) */
  paddingPx?: number;
  /** Цвет тонированного фона рамки (по умолчанию #f8fafc) */
  backgroundColor?: string;
  /** Мягкий коэффициент гаммы (по умолчанию 1.03) */
  gamma?: number;
  /** Множитель яркости (по умолчанию 1.02) */
  brightness?: number;
  /** Множитель насыщенности (по умолчанию 1.03) */
  saturation?: number;
  /** Интенсивность микрозерна от 0 до 1 (по умолчанию 0.04) */
  grainOpacity?: number;
}

/**
 * Генерирует SVG-маску аналогового микрозерна (film grain noise).
 * Этот шум незаметен для человеческого глаза, но сбивает веса эмбеддингов
 * сверточных нейросетей (Google Lens, Vision Transformers, ResNet/CLIP).
 */
function createNoiseSvg(width: number, height: number, opacity: number): Buffer {
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <filter id="anti-lens-noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="matrix" values="
        0.33 0.33 0.33 0 0
        0.33 0.33 0.33 0 0
        0.33 0.33 0.33 0 0
        0    0    0    ${opacity} 0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#anti-lens-noise)" />
  </svg>`;
  return Buffer.from(svg);
}

/**
 * Трансформирует исходное изображение товара для защиты от поиска по фото (Google Lens / TinEye / Yandex)
 * Включает:
 * 1. Микроповорот (1.9°)
 * 2. Авто-кроп краев (3.5%), сбивающий ключевые точки SIFT/ORB
 * 3. Микрорамка с тонированным фоном (#f8fafc), изменяющая пропорции канваса
 * 4. Микросдвиг гаммы, яркости и баланса белого
 * 5. Наложение незаметного высокочастотного зерна (adversarial grain)
 */
export async function transformImageAntiSearch(
  inputBuffer: Buffer,
  options: AntiSearchTransformOptions = {}
): Promise<Buffer> {
  const {
    rotationAngle = 1.9,
    cropPercent = 0.035,
    paddingPx = 14,
    backgroundColor = "#f8fafc",
    gamma = 1.03,
    brightness = 1.02,
    saturation = 1.03,
    grainOpacity = 0.04,
  } = options;

  // 1. Получаем метаданные исходника
  const initialImage = sharp(inputBuffer);
  const metadata = await initialImage.metadata();
  const rawWidth = metadata.width || 800;
  const rawHeight = metadata.height || 800;

  // 2. Шаг 1: Микроповорот на белом/тонированном фоне
  let pipeline = initialImage.rotate(rotationAngle, { background: backgroundColor });

  // Получаем промежуточные размеры после поворота
  const rotatedBuffer = await pipeline.toBuffer();
  const rotatedMeta = await sharp(rotatedBuffer).metadata();
  const rWidth = rotatedMeta.width || rawWidth;
  const rHeight = rotatedMeta.height || rawHeight;

  // 3. Шаг 2: Кроп краев для удаления артефактов поворота и смещения центровки
  const cropLeft = Math.round(rWidth * cropPercent);
  const cropTop = Math.round(rHeight * cropPercent);
  const cropWidth = Math.max(10, rWidth - cropLeft * 2);
  const cropHeight = Math.max(10, rHeight - cropTop * 2);

  pipeline = sharp(rotatedBuffer).extract({
    left: cropLeft,
    top: cropTop,
    width: cropWidth,
    height: cropHeight,
  });

  // 4. Шаг 3: Добавление микрорамки с тонированным фоном (паспарту)
  pipeline = pipeline.extend({
    top: paddingPx,
    bottom: paddingPx,
    left: paddingPx,
    right: paddingPx,
    background: backgroundColor,
  });

  // 5. Шаг 4: Микросдвиг гаммы, яркости и насыщенности
  pipeline = pipeline
    .modulate({
      brightness,
      saturation,
    })
    .gamma(gamma);

  // 6. Шаг 5: Наложение незаметного зернистого микрошума
  const intermediateBuffer = await pipeline.toBuffer();
  const finalMeta = await sharp(intermediateBuffer).metadata();
  const fWidth = finalMeta.width || cropWidth + paddingPx * 2;
  const fHeight = finalMeta.height || cropHeight + paddingPx * 2;

  const noiseSvgBuffer = createNoiseSvg(fWidth, fHeight, grainOpacity);

  const finalBuffer = await sharp(intermediateBuffer)
    .composite([
      {
        input: noiseSvgBuffer,
        blend: "over",
      },
    ])
    .webp({ quality: 87, effort: 4 })
    .toBuffer();

  return finalBuffer;
}
