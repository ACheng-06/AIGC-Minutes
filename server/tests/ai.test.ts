import { describe, expect, it, vi } from 'vitest';
import { generateStructuredMinutes } from '../src/services/ai';

const config = {
  baseUrl: 'https://llm.example.com/v1',
  apiKey: 'test-key',
  model: 'test-model',
  timeoutMs: 1000,
};

const validMinutes = {
  title: '产品周会',
  summary: '会议讨论了 MVP 上线计划。',
  decisions: ['确认 11 月上线 MVP'],
  todos: [
    { task: '完成导出联调', owner: '张三', dueDate: '2026-10-23' },
    { task: '整理接口文档', owner: '未明确', dueDate: '下周五' },
  ],
};

function completion(content: string, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('generateStructuredMinutes', () => {
  it('解析合法 JSON，并归一化负责人与日期', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(completion(JSON.stringify(validMinutes)));

    const minutes = await generateStructuredMinutes('会议原文', { config, fetchImpl });

    expect(minutes.title).toBe('产品周会');
    expect(minutes.decisions).toEqual(['确认 11 月上线 MVP']);
    expect(minutes.todos[0]).toEqual({ task: '完成导出联调', owner: '张三', dueDate: '2026-10-23' });
    // 占位词与自然语言日期必须归空，不能编造。
    expect(minutes.todos[1]).toEqual({ task: '整理接口文档', owner: '', dueDate: '' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const requestBody = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(requestBody.model).toBe('test-model');
    expect(requestBody.messages).toHaveLength(2);
  });

  it('能从代码围栏和解释文字中提取 JSON', async () => {
    const content = `好的，以下是纪要：\n\`\`\`json\n${JSON.stringify(validMinutes)}\n\`\`\`\n请核对。`;
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(completion(content));

    const minutes = await generateStructuredMinutes('会议原文', { config, fetchImpl });

    expect(minutes.summary).toContain('MVP');
  });

  it('首次输出不合法时向模型发起一次修复', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(completion('抱歉，我无法整理这段内容。'))
      .mockResolvedValueOnce(completion(JSON.stringify(validMinutes)));

    const minutes = await generateStructuredMinutes('会议原文', { config, fetchImpl });

    expect(minutes.title).toBe('产品周会');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const repairBody = JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body));
    expect(repairBody.messages).toHaveLength(4);
    expect(repairBody.messages[3].role).toBe('user');
  });

  it('两次输出都不合法时抛出 AI_INVALID_OUTPUT', async () => {
    // 每次调用都返回新的 Response：Response 的 body 只能读取一次。
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => completion('不是 JSON'));

    const promise = generateStructuredMinutes('会议原文', { config, fetchImpl });

    await expect(promise).rejects.toMatchObject({ code: 'AI_INVALID_OUTPUT', status: 502 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('缺少模型配置时直接返回 503，不发起请求', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const promise = generateStructuredMinutes('会议原文', {
      config: { baseUrl: '', apiKey: '', model: '', timeoutMs: 1000 },
      fetchImpl,
    });

    await expect(promise).rejects.toMatchObject({ code: 'AI_NOT_CONFIGURED', status: 503 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('上游返回非 2xx 时抛出 AI_UPSTREAM_ERROR', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(completion('', 500));
    const promise = generateStructuredMinutes('会议原文', { config, fetchImpl });

    await expect(promise).rejects.toMatchObject({ code: 'AI_UPSTREAM_ERROR', status: 502 });
  });

  it('超时后抛出 AI_TIMEOUT', async () => {
    const hangingFetch = vi.fn<typeof fetch>().mockImplementation((_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    const promise = generateStructuredMinutes('会议原文', {
      config: { ...config, timeoutMs: 30 },
      fetchImpl: hangingFetch,
    });

    await expect(promise).rejects.toMatchObject({ code: 'AI_TIMEOUT', status: 504 });
  });
});
