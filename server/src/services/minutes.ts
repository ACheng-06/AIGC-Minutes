import { env } from '../env';
import { generateStructuredMinutes } from './ai';
import { buildMinutesCacheKey, readMinutesCache, writeMinutesCache } from './minutesCache';
import type { Minutes, MinutesMeta } from '../schemas/minutes';

export interface MinutesSource {
  sourceType: 'text' | 'file';
  fileName: string | null;
}

/**
 * 业务编排：调用 AI 生成纪要，并补充来源元信息。
 * 文本提取与接口参数校验分别由 extractText 和路由层负责，这里只关注“生成纪要”本身。
 *
 * 相同原文在缓存有效期内直接复用上次结果，避免重复付费；只有成功结果才写入缓存。
 */
export async function generateMinutes(
  text: string,
  source: MinutesSource,
): Promise<{ minutes: Minutes; meta: MinutesMeta }> {
  const cacheKey = buildMinutesCacheKey(text, env.llm.model);
  const cached = readMinutesCache(cacheKey);

  if (cached) {
    return {
      minutes: cached.minutes,
      meta: {
        sourceType: source.sourceType,
        fileName: source.fileName,
        charCount: text.length,
        generatedAt: cached.generatedAt,
        cached: true,
      },
    };
  }

  const minutes = await generateStructuredMinutes(text);
  const generatedAt = new Date().toISOString();

  writeMinutesCache(cacheKey, { minutes, generatedAt });

  return {
    minutes,
    meta: {
      sourceType: source.sourceType,
      fileName: source.fileName,
      charCount: text.length,
      generatedAt,
      cached: false,
    },
  };
}
