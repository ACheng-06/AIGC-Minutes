import { generateStructuredMinutes } from './ai';
import type { Minutes, MinutesMeta } from '../schemas/minutes';

export interface MinutesSource {
  sourceType: 'text' | 'file';
  fileName: string | null;
}

/**
 * 业务编排：调用 AI 生成纪要，并补充来源元信息。
 * 文本提取与接口参数校验分别由 extractText 和路由层负责，这里只关注“生成纪要”本身。
 */
export async function generateMinutes(
  text: string,
  source: MinutesSource,
): Promise<{ minutes: Minutes; meta: MinutesMeta }> {
  const minutes = await generateStructuredMinutes(text);

  return {
    minutes,
    meta: {
      sourceType: source.sourceType,
      fileName: source.fileName,
      charCount: text.length,
      generatedAt: new Date().toISOString(),
    },
  };
}
