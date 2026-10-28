import { BaseSourceAdapter } from "./base";
import { AnkorstoreAdapter } from "./ankorstore";
import { ScraperLogger } from "../core/logger";

/**
 * Реестр адаптеров поставщиков
 * Автоматически подбирает подходящий адаптер по переданному URL или имени источника
 */
export class AdapterRegistry {
  private adapters: BaseSourceAdapter[] = [];
  private logger: ScraperLogger;

  constructor(logger: ScraperLogger) {
    this.logger = logger;
    this.registerAdapters();
  }

  /**
   * Регистрация всех доступных адаптеров в системе
   */
  private registerAdapters(): void {
    this.adapters.push(new AnkorstoreAdapter(this.logger));
    // В будущем сюда легко добавляются новые адаптеры:
    // this.adapters.push(new FaireAdapter(this.logger));
    // this.adapters.push(new BigBuyAdapter(this.logger));
  }

  /**
   * Находит подходящий адаптер для переданного URL или явно указанного имени источника
   */
  public getAdapter(url: string, explicitSource?: string): BaseSourceAdapter {
    // 1. Поиск по явному имени источника
    if (explicitSource) {
      const foundByName = this.adapters.find((a) => a.name.toLowerCase() === explicitSource.toLowerCase());
      if (foundByName) {
        this.logger.debug("INIT", `Выбран адаптер по имени источника: ${foundByName.name}`);
        return foundByName;
      }
    }

    // 2. Поиск по URL (проверка canHandle)
    for (const adapter of this.adapters) {
      if (adapter.canHandle(url)) {
        this.logger.info("INIT", `Автоматически определен адаптер поставщика: "${adapter.name}" для URL: ${url}`);
        return adapter;
      }
    }

    const availableNames = this.adapters.map((a) => a.name).join(", ");
    throw new Error(
      `Не найден подходящий адаптер для URL: "${url}". Доступные источники: [${availableNames}]. При необходимости укажите источник флагом --source <name>.`
    );
  }

  /**
   * Возвращает список всех зарегистрированных адаптеров
   */
  public getRegisteredAdapters(): string[] {
    return this.adapters.map((a) => a.name);
  }
}
