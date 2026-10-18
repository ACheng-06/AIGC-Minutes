import { describe, expect, it } from 'vitest';
import { formatMinutesText } from './formatMinutes';
import type { Minutes } from '../types/minutes';

const baseMinutes: Minutes = {
  title: '产品周会',
  summary: '会议讨论了 MVP 上线计划。',
  decisions: ['确认 11 月上线 MVP'],
  todos: [{ task: '完成导出联调', owner: '', dueDate: '' }],
};

describe('formatMinutesText', () => {
  it('包含标题、摘要、决策与待办，并标记未明确信息', () => {
    const text = formatMinutesText(baseMinutes);

    expect(text).toContain('【产品周会】');
    expect(text).toContain('## 会议摘要');
    expect(text).toContain('会议讨论了 MVP 上线计划。');
    expect(text).toContain('1. 确认 11 月上线 MVP');
    expect(text).toContain('- [ ] 完成导出联调 | 负责人：未明确 | 截止：未明确');
  });

  it('空决策与空待办显示（无）', () => {
    const text = formatMinutesText({ ...baseMinutes, decisions: [], todos: [] });

    expect(text.match(/（无）/g)).toHaveLength(2);
  });

  it('标题为空时回退为会议纪要', () => {
    const text = formatMinutesText({ ...baseMinutes, title: '   ' });

    expect(text).toContain('【会议纪要】');
  });
});
