import { LOCAL_HISTORY_KEY, LOCAL_HISTORY_LIMIT } from '../constants';
import type { LocalMinutesRecord, Minutes } from '../types/minutes';

export interface SaveRecordResult {
  ok: boolean;
  record?: LocalMinutesRecord;
  error?: string;
}

function isTodoList(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (todo) =>
        typeof todo === 'object' &&
        todo !== null &&
        typeof (todo as { task?: unknown }).task === 'string' &&
        typeof (todo as { owner?: unknown }).owner === 'string' &&
        typeof (todo as { dueDate?: unknown }).dueDate === 'string',
    )
  );
}

function isMinutes(value: unknown): value is Minutes {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const minutes = value as Record<string, unknown>;
  return (
    typeof minutes.title === 'string' &&
    typeof minutes.summary === 'string' &&
    Array.isArray(minutes.decisions) &&
    minutes.decisions.every((decision) => typeof decision === 'string') &&
    isTodoList(minutes.todos)
  );
}

function isRecord(value: unknown): value is LocalMinutesRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && typeof record.savedAt === 'string' && isMinutes(record.minutes);
}

/** 本地数据可能被手动改坏，读取时做结构校验，坏数据直接忽略而不是让页面崩溃。 */
export function listRecords(): LocalMinutesRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isRecord)
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
      .slice(0, LOCAL_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function createRecordId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneMinutes(minutes: Minutes): Minutes {
  return JSON.parse(JSON.stringify(minutes)) as Minutes;
}

function writeRecords(records: LocalMinutesRecord[]): void {
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(records));
}

/**
 * 保存或更新一条本地记录。
 * existingId 存在时覆盖原记录（例如编辑后再次保存），否则新建；最多保留 10 条。
 */
export function saveRecord(minutes: Minutes, existingId: string | null = null): SaveRecordResult {
  const records = listRecords();
  const id = existingId && records.some((record) => record.id === existingId) ? existingId : createRecordId();
  const record: LocalMinutesRecord = {
    id,
    savedAt: new Date().toISOString(),
    minutes: cloneMinutes(minutes),
  };

  let nextRecords = [record, ...records.filter((item) => item.id !== id)].slice(0, LOCAL_HISTORY_LIMIT);

  try {
    writeRecords(nextRecords);
    return { ok: true, record };
  } catch {
    // 常见原因是 localStorage 配额不足：丢掉最旧一条再试一次。
    nextRecords = nextRecords.slice(0, Math.max(1, nextRecords.length - 1));
    try {
      writeRecords(nextRecords);
      return { ok: true, record, error: '本地存储空间不足，已自动清理最旧的记录' };
    } catch {
      return { ok: false, error: '本地存储不可用，纪要未能保存' };
    }
  }
}

export function removeRecord(id: string): void {
  try {
    writeRecords(listRecords().filter((record) => record.id !== id));
  } catch {
    // 删除失败不阻断页面，下一次读取会重新加载列表。
  }
}

export function clearRecords(): void {
  try {
    localStorage.removeItem(LOCAL_HISTORY_KEY);
  } catch {
    // 同上：存储不可用时静默失败，不影响当前编辑内容。
  }
}
