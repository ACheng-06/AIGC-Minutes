import { describe, expect, it } from 'vitest';
import { CanceledError } from './http';
import { generateByText } from './minutes';

describe('取消生成请求', () => {
  it('已取消的 signal 会返回 CanceledError，而不是网络错误', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(generateByText('测试会议原文', controller.signal)).rejects.toBeInstanceOf(
      CanceledError,
    );
  });
});
