import { describe, expect, it } from 'vitest';
import {
  AiMinutesSchema,
  MinutesSchema,
  normalizeDueDate,
  normalizeOwner,
  toErrorDetails,
  toMinutes,
} from '../src/schemas/minutes';

describe('normalizeDueDate', () => {
  it('接受真实存在的 YYYY-MM-DD', () => {
    expect(normalizeDueDate('2026-10-23')).toBe('2026-10-23');
    expect(normalizeDueDate(' 2028-02-29 ')).toBe('2028-02-29');
  });

  it('拒绝自然语言、错误格式和不存在的日期', () => {
    expect(normalizeDueDate('下周五')).toBe('');
    expect(normalizeDueDate('2026/10/23')).toBe('');
    expect(normalizeDueDate('2026-02-31')).toBe('');
    expect(normalizeDueDate(null)).toBe('');
  });
});

describe('normalizeOwner', () => {
  it('把占位词统一为空字符串', () => {
    expect(normalizeOwner('未明确')).toBe('');
    expect(normalizeOwner('TBD')).toBe('');
    expect(normalizeOwner('  ')).toBe('');
  });

  it('保留真实姓名并截断超长内容', () => {
    expect(normalizeOwner(' 张三 ')).toBe('张三');
    expect(normalizeOwner('张'.repeat(80))).toHaveLength(50);
  });
});

describe('AiMinutesSchema / toMinutes', () => {
  it('缺少可选字段时使用空数组，摘要仍必填', () => {
    const parsed = AiMinutesSchema.parse({ summary: '会议摘要' });

    expect(parsed.decisions).toEqual([]);
    expect(parsed.todos).toEqual([]);
    expect(parsed.title).toBe('');

    expect(AiMinutesSchema.safeParse({}).success).toBe(false);
  });

  it('归一化标题、负责人与日期，并裁剪决策条数', () => {
    const decisions = Array.from({ length: 25 }, (_item, index) => `决策 ${index + 1}`);
    const parsed = AiMinutesSchema.parse({
      title: '',
      summary: ' 会议摘要 ',
      decisions: ['', ' 保留决策 ', ...decisions],
      todos: [{ task: ' 联调 ', owner: '未明确', dueDate: '2026-02-31' }],
    });

    const minutes = toMinutes(parsed);
    expect(minutes.title).toBe('会议纪要');
    expect(minutes.summary).toBe('会议摘要');
    expect(minutes.decisions).toHaveLength(20);
    expect(minutes.todos).toEqual([{ task: '联调', owner: '', dueDate: '' }]);
  });

  it('去掉完全相同的决策与待办，保留首次出现', () => {
    const parsed = AiMinutesSchema.parse({
      summary: '会议摘要',
      decisions: [' 上线 ', '上线', ' 延期 '],
      todos: [
        { task: '联调', owner: '张三', dueDate: '2026-10-23' },
        { task: ' 联调 ', owner: '张三', dueDate: '2026-10-23' },
        { task: '联调', owner: '李四', dueDate: '2026-10-23' },
      ],
    });

    const minutes = toMinutes(parsed);
    expect(minutes.decisions).toEqual(['上线', '延期']);
    expect(minutes.todos).toHaveLength(2);
  });
});

describe('MinutesSchema', () => {
  it('补默认标题并归一化待办字段', () => {
    const minutes = MinutesSchema.parse({
      title: '   ',
      summary: ' 摘要 ',
      decisions: [' 决策 ', ''],
      todos: [{ task: ' 任务 ', owner: '未明确', dueDate: '2026-02-31' }],
    });

    expect(minutes.title).toBe('会议纪要');
    expect(minutes.summary).toBe('摘要');
    expect(minutes.decisions).toEqual(['决策']);
    expect(minutes.todos).toEqual([{ task: '任务', owner: '', dueDate: '' }]);
  });

  it('摘要为空时校验失败，并返回可供前端定位的 details', () => {
    const result = MinutesSchema.safeParse({ summary: '', decisions: [], todos: [] });

    expect(result.success).toBe(false);
    if (!result.success) {
      const details = toErrorDetails(result.error);
      expect(details.some((detail) => detail.path === 'summary')).toBe(true);
    }
  });

  it('决策超过 20 条时校验失败', () => {
    const decisions = Array.from({ length: 21 }, (_item, index) => `决策 ${index + 1}`);
    const result = MinutesSchema.safeParse({ summary: '摘要', decisions, todos: [] });

    expect(result.success).toBe(false);
  });
});
