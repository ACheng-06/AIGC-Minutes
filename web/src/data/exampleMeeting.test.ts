import { describe, expect, it } from 'vitest';
import { MAX_TEXT_CHARS } from '../constants';
import {
  buildDemoResult,
  createDemoMinutes,
  DEMO_MEETING_TEXT,
  isDemoMeetingText,
} from './exampleMeeting';

describe('示例会议原文', () => {
  it('长度在输入上限内，并覆盖决策、待办与模糊信息', () => {
    expect(DEMO_MEETING_TEXT.length).toBeGreaterThan(200);
    expect(DEMO_MEETING_TEXT.length).toBeLessThan(MAX_TEXT_CHARS);
    expect(DEMO_MEETING_TEXT).toContain('决定');
    expect(DEMO_MEETING_TEXT).toContain('待办');
    // “下周一”用来演示模糊日期被归一为“未明确”，不能改成具体日期。
    expect(DEMO_MEETING_TEXT).toContain('下周一');
  });
});

describe('内置示例纪要', () => {
  it('内容与示例原文对应，并保留未明确的负责人与日期', () => {
    const minutes = createDemoMinutes();

    expect(minutes.title).toBe('产品周会纪要');
    expect(minutes.summary.length).toBeGreaterThan(100);
    expect(minutes.decisions.length).toBeGreaterThanOrEqual(2);
    expect(minutes.todos).toHaveLength(5);
    expect(minutes.todos[minutes.todos.length - 1]).toEqual({
      task: '补充一份发布后的回滚预案',
      owner: '',
      dueDate: '',
    });
  });

  it('每次返回新对象，用户编辑不会污染内置数据', () => {
    const first = createDemoMinutes();
    first.title = '被修改过的标题';

    expect(createDemoMinutes().title).toBe('产品周会纪要');
  });

  it('构造的结果元信息与真实生成保持一致', () => {
    const result = buildDemoResult();

    expect(result.meta).toMatchObject({
      sourceType: 'text',
      fileName: null,
      charCount: DEMO_MEETING_TEXT.length,
      cached: false,
    });
    expect(Number.isNaN(Date.parse(result.meta.generatedAt))).toBe(false);
  });

  it('只把完整示例视为演示输入，改动任意字符后不再匹配', () => {
    expect(isDemoMeetingText(DEMO_MEETING_TEXT)).toBe(true);
    expect(isDemoMeetingText(`  ${DEMO_MEETING_TEXT}\n`)).toBe(true);
    expect(isDemoMeetingText(`${DEMO_MEETING_TEXT}补充一句`)).toBe(false);
    expect(isDemoMeetingText('我自己的会议记录')).toBe(false);
  });
});
