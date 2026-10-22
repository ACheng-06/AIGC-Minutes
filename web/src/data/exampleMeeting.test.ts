import { describe, expect, it } from 'vitest';
import { MAX_TEXT_CHARS } from '../constants';
import { DEMO_MEETING_TEXT } from './exampleMeeting';

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
