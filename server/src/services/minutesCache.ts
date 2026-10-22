import { createHash } from 'node:crypto';
import type { Minutes } from '../schemas/minutes';

/**
 * 生成结果的内存缓存：相同原文 + 相同模型在短时间内复用同一份纪要。
 * 不落盘，进程重启即清空；容量与时间都设上限，避免长时间保留用户的派生数据。
 */
const MAX_ENTRIES = 50;
const TTL_MS = 30 * 60 * 1000;
/** 修改提示词或归一化规则后递增，避免旧缓存与新规则混用。 */
const CACHE_VERSION = 1;

interface CacheEntry {
  minutes: Minutes;
  generatedAt: string;
  storedAt: number;
}

export interface CachedMinutes {
  minutes: Minutes;
  generatedAt: string;
}

const cache = new Map<string, CacheEntry>();

/** 换模型后输出风格会变，旧结果不再视为同一份缓存。 */
export function buildMinutesCacheKey(text: string, model: string): string {
  const digest = createHash('sha256').update(text).digest('hex');
  return `v${CACHE_VERSION}:${model}:${digest}`;
}

export function readMinutesCache(key: string): CachedMinutes | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() - entry.storedAt > TTL_MS) {
    cache.delete(key);
    return null;
  }

  // Map 按插入顺序迭代：命中后重新插入，把最近使用的条目移到末尾。
  cache.delete(key);
  cache.set(key, entry);
  return { minutes: entry.minutes, generatedAt: entry.generatedAt };
}

export function writeMinutesCache(key: string, value: CachedMinutes): void {
  cache.delete(key);
  cache.set(key, { ...value, storedAt: Date.now() });

  while (cache.size > MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    cache.delete(oldestKey);
  }
}

/** 测试与进程内重置使用。 */
export function clearMinutesCache(): void {
  cache.clear();
}
