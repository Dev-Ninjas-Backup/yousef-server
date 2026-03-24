import { v2 } from '@google-cloud/translate';
import { Injectable, Logger } from '@nestjs/common';
import e from 'express';

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
  };
}

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private translate: any;
  private cache: TranslationCache = {};
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000;

  constructor() {
    this.initializeTranslator();
  }

  private initializeTranslator() {
    try {
      const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
      if (!apiKey) {
        this.logger.error('GOOGLE_TRANSLATE_API_KEY is not set in environment');
        throw new Error('GOOGLE_TRANSLATE_API_KEY is required');
      }

      // Using v2 API with API key
      this.translate = new v2.Translate({
        key: apiKey,
      });

      this.logger.log('Google Translate initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Translate:', error);
      throw error;
    }
  }

  // Translate text to target language
  async translateText(
    text: string | string[],
    targetLanguage: string,
  ): Promise<string | string[]> {
    try {
      if (!text) return text;

      const isArray = Array.isArray(text);
      const textsToTranslate = isArray ? text : [text];

      const uniqueTexts = [...new Set(textsToTranslate)];
      const translatedTexts: { [key: string]: string } = {};

      // Translate each unique text
      for (const t of uniqueTexts) {
        const cacheKey = `${t}_${targetLanguage}`;

        // Check cache first
        if (this.cache[cacheKey] && !this.isCacheExpired(cacheKey)) {
          translatedTexts[t] = this.cache[cacheKey].translation;
          continue;
        }

        try {
          const [translation] = await this.translate.translate(
            t,
            targetLanguage,
          );
          translatedTexts[t] = translation;

          // Store in cache
          this.cache[cacheKey] = {
            translation,
            timestamp: Date.now(),
          };
        } catch (error) {
          this.logger.warn(
            `Failed to translate "${t}" to ${targetLanguage}, returning original`,
          );
          translatedTexts[t] = t;
        }
      }

      // Return in original format
      if (isArray) {
        return textsToTranslate.map((t) => translatedTexts[t]);
      }
      return translatedTexts[text];
    } catch (error) {
      this.logger.error('Translation error:', error);
      return text;
    }
  }

  // Translate an object recursively
  async translateObject(
    obj: any,
    targetLanguage: string,
    fieldsToTranslate?: string[],
  ): Promise<any> {
    if (!obj) return obj;

    if (typeof obj === 'string') {
      return this.translateText(obj, targetLanguage);
    }

    if (typeof obj === 'object') {
      const translated = { ...obj };

      for (const [key, value] of Object.entries(translated)) {
        if (fieldsToTranslate && !fieldsToTranslate.includes(key)) {
          continue;
        }

        if (typeof value === 'string') {
          translated[key] = await this.translateText(value, targetLanguage);
        } else if (typeof value === 'object' && value !== null) {
          translated[key] = await this.translateObject(
            value,
            targetLanguage,
            fieldsToTranslate,
          );
        }
      }

      return translated;
    }

    return obj;
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const [detection] = await this.translate.detect(text);
      return detection.language || process.env.DEFAULT_LANGUAGE || 'en';
    } catch (error: any) {
      this.logger.warn(
        `Failed to detect language for "${text}", using default`,
      );
      return process.env.DEFAULT_LANGUAGE || 'en';
    }
  }

  async batchTranslate(
    texts: string[],
    targetLanguage: string,
  ): Promise<string[]> {
    try {
      return this.translateText(texts, targetLanguage) as Promise<string[]>;
    } catch (error) {
      this.logger.error('Batch translation error:', error);
      return texts;
    }
  }

  clearCache(): void {
    this.cache = {};
    this.logger.log('Translation cache cleared');
  }

  getCacheStats(): { size: number; ttl: number } {
    return {
      size: Object.keys(this.cache).length,
      ttl: this.CACHE_TTL,
    };
  }

  private isCacheExpired(key: string): boolean {
    const entry = this.cache[key];
    if (!entry) return true;
    return Date.now() - entry.timestamp > this.CACHE_TTL;
  }
}
