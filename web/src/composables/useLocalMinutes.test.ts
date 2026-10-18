import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearRecords, listRecords, removeRecord, saveRecord } from './useLocalMinutes';
import { LOCAL_HISTORY_KEY, LOCAL_HISTORY_LIMIT } from '../constants';
import type { Minutes } from '../types/minutes';

function makeMinutes(index: number): Minutes {
  return {
    title: `周会 ${index}`,
    summary: `摘要 ${index}`,
    decisions: [],
    todos: [],
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useLocalMinutes', () => {
  it('保存后可读取，最新记录排在最前', () => {
    saveRecord(makeMinutes(1));
    saveRecord(makeMinutes(2));

    const records = listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]?.minutes.title).toBe('周会 2');
    expect(records[1]?.minutes.title).toBe('周会 1');
  });

  it('最多保留 10 条记录', () => {
    for (let index = 1; index <= 12; index += 1) {
      saveRecord(makeMinutes(index));
    }

    const records = listRecords();
    expect(records).toHaveLength(LOCAL_HISTORY_LIMIT);
    expect(records[0]?.minutes.title).toBe('周会 12');
  });

  it('传入已有 id 时更新同一条记录', () => {
    const first = saveRecord(makeMinutes(1));
    saveRecord(makeMinutes(2), first.record?.id ?? null);

    const records = listRecords();
    expect(records).toHaveLength(1);
    expect(records[0]?.id).toBe(first.record?.id);
    expect(records[0]?.minutes.title).toBe('周会 2');
  });

  it('可以删除单条记录与清空全部记录', () => {
    const first = saveRecord(makeMinutes(1));
    saveRecord(makeMinutes(2));

    removeRecord(first.record?.id ?? '');
    expect(listRecords()).toHaveLength(1);

    clearRecords();
    expect(listRecords()).toHaveLength(0);
  });

  it('本地数据损坏时返回空列表', () => {
    localStorage.setItem(LOCAL_HISTORY_KEY, 'not-json');

    expect(listRecords()).toEqual([]);
  });

  it('配额不足时清理最旧记录并重试', () => {
    for (let index = 1; index <= 10; index += 1) {
      saveRecord(makeMinutes(index));
    }

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError');
    });

    const result = saveRecord(makeMinutes(99));

    expect(result.ok).toBe(true);
    expect(result.error).toContain('清理');
    expect(listRecords()).toHaveLength(9);
    expect(listRecords()[0]?.minutes.title).toBe('周会 99');
  });

  it('存储完全不可用时返回失败结果', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const result = saveRecord(makeMinutes(1));

    expect(result.ok).toBe(false);
    expect(result.error).toContain('未能保存');
  });
});
