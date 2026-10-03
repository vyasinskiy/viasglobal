import { Injectable, Logger } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import { config } from '../../common/config/config';

/**
 * Сервис транскрипции голосовых сообщений (Speech-to-Text)
 * Использует Whisper через Groq API (рекомендуется) или OpenAI API
 */
@Injectable()
export class SpeechToTextService {
  private readonly logger = new Logger(SpeechToTextService.name);
  private groqClient: OpenAI | null = null;
  private openaiClient: OpenAI | null = null;

  constructor() {
    // Инициализация клиента Groq при наличии API ключа (быстрая и экономичная транскрипция)
    if (config.GROQ_API_KEY) {
      this.groqClient = new OpenAI({
        apiKey: config.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      this.logger.log('Groq Whisper STT клиент успешно инициализирован.');
    }

    // Инициализация клиента OpenAI при наличии API ключа
    if (config.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
      this.logger.log('OpenAI Whisper STT клиент успешно инициализирован.');
    }
  }

  /**
   * Проверка доступности сервиса транскрипции
   */
  isConfigured(): boolean {
    return Boolean(this.groqClient || this.openaiClient);
  }

  /**
   * Транскрибирует аудио-буфер в текст
   * @param audioBuffer Буфер аудиофайла голосового сообщения (.ogg)
   * @param filename Имя временного файла
   * @returns Распознанный текст сообщения на русском языке
   */
  async transcribe(audioBuffer: Buffer, filename = 'voice.ogg'): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(
        'Сервис распознавания голоса не настроен. Пожалуйста, укажите GROQ_API_KEY или OPENAI_API_KEY в .env файле.',
      );
    }

    // Подготавливаем файл для передачи в OpenAI-совместимый API
    const file = await toFile(audioBuffer, filename, { type: 'audio/ogg' });

    // Приоритет 1: Groq Whisper (высокая скорость и точность)
    if (this.groqClient) {
      try {
        this.logger.debug('Отправка аудио в Groq Whisper API...');
        const response = await this.groqClient.audio.transcriptions.create({
          file,
          model: 'whisper-large-v3-turbo',
          language: 'ru',
          temperature: 0.0,
        });
        return response.text.trim();
      } catch (error) {
        this.logger.warn(`Ошибка Groq Whisper, попытка переключения на резервный STT: ${String(error)}`);
        if (!this.openaiClient) {
          throw error;
        }
      }
    }

    // Приоритет 2: OpenAI Whisper (резервный вариант)
    if (this.openaiClient) {
      this.logger.debug('Отправка аудио в OpenAI Whisper API...');
      const response = await this.openaiClient.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: 'ru',
        temperature: 0.0,
      });
      return response.text.trim();
    }

    throw new Error('Не удалось выполнить транскрипцию аудиофайла.');
  }
}
