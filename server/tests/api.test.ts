import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Response as SuperAgentResponse } from 'superagent';
import mammoth from 'mammoth';
import { createApp } from '../src/app';
import { AppError } from '../src/lib/errors';
import { generateStructuredMinutes } from '../src/services/ai';
import type { Minutes } from '../src/schemas/minutes';

// 接口测试不访问真实模型：把 AI 模块整体替换成 mock，其余路由与校验逻辑保持真实。
vi.mock('../src/services/ai', () => ({
  generateStructuredMinutes: vi.fn(),
}));

const mockedGenerate = vi.mocked(generateStructuredMinutes);
const app = createApp();

/** supertest 默认不把 docx 当二进制解析，这里显式收集响应流。 */
function binaryParser(
  response: SuperAgentResponse,
  done: (error: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];
  response.on('data', (chunk: Buffer) => chunks.push(chunk));
  response.on('end', () => done(null, Buffer.concat(chunks)));
  response.on('error', (error: Error) => done(error, Buffer.alloc(0)));
}

const aiMinutes: Minutes = {
  title: '产品周会',
  summary: '会议讨论了 MVP 上线计划。',
  decisions: ['确认 11 月上线 MVP'],
  todos: [{ task: '完成导出联调', owner: '张三', dueDate: '2026-10-23' }],
};

beforeEach(() => {
  mockedGenerate.mockReset();
});

describe('GET /api/health', () => {
  it('返回服务状态与 AI 配置标记', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(typeof response.body.data.aiConfigured).toBe('boolean');
  });
});

describe('POST /api/minutes/generate', () => {
  it('JSON 文本请求返回结构化纪要', async () => {
    mockedGenerate.mockResolvedValue(aiMinutes);

    const response = await request(app)
      .post('/api/minutes/generate')
      .send({ text: '会议内容' });

    expect(response.status).toBe(200);
    expect(response.body.data.minutes).toEqual(aiMinutes);
    expect(response.body.data.meta).toMatchObject({
      sourceType: 'text',
      fileName: null,
      charCount: 4,
    });
  });

  it('空白文本返回 422 EMPTY_CONTENT', async () => {
    const response = await request(app)
      .post('/api/minutes/generate')
      .send({ text: '    ' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('EMPTY_CONTENT');
  });

  it('缺少 text 字段返回 400 VALIDATION_ERROR', async () => {
    const response = await request(app).post('/api/minutes/generate').send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details[0].path).toBe('text');
  });

  it('不支持的 Content-Type 返回 415', async () => {
    const response = await request(app)
      .post('/api/minutes/generate')
      .set('Content-Type', 'text/plain')
      .send('会议内容');

    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('multipart 上传 TXT 成功', async () => {
    mockedGenerate.mockResolvedValue(aiMinutes);

    const response = await request(app)
      .post('/api/minutes/generate')
      .attach('file', Buffer.from('会议内容', 'utf8'), 'meeting.txt');

    expect(response.status).toBe(200);
    expect(response.body.data.meta).toMatchObject({
      sourceType: 'file',
      fileName: 'meeting.txt',
      charCount: 4,
    });
  });

  it('multipart 未携带文件返回 400', async () => {
    const response = await request(app).post('/api/minutes/generate').field('note', 'hello');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('上传不支持的文件类型返回 415', async () => {
    const response = await request(app)
      .post('/api/minutes/generate')
      .attach('file', Buffer.from('pdf-content'), 'meeting.pdf');

    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('上传超过大小限制的文件返回 413', async () => {
    const oversize = Buffer.alloc(5 * 1024 * 1024 + 1, 0x61);

    const response = await request(app)
      .post('/api/minutes/generate')
      .attach('file', oversize, 'big.txt');

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('非法 JSON 请求体返回 400', async () => {
    const response = await request(app)
      .post('/api/minutes/generate')
      .set('Content-Type', 'application/json')
      .send('{not-json');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('请求体过大时返回 413', async () => {
    const response = await request(app)
      .post('/api/minutes/generate')
      .send({ text: 'x'.repeat(1_200_000) });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('AI 未配置时返回 503', async () => {
    mockedGenerate.mockRejectedValue(new AppError('AI_NOT_CONFIGURED', 503, '未配置模型'));

    const response = await request(app)
      .post('/api/minutes/generate')
      .send({ text: '会议内容' });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('AI_NOT_CONFIGURED');
  });

  it('AI 输出异常时返回 502', async () => {
    mockedGenerate.mockRejectedValue(new AppError('AI_INVALID_OUTPUT', 502, '模型输出无法解析'));

    const response = await request(app)
      .post('/api/minutes/generate')
      .send({ text: '会议内容' });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('AI_INVALID_OUTPUT');
  });

  it('未知路由返回 404', async () => {
    const response = await request(app).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/minutes/export', () => {
  const exportMinutes: Minutes = {
    title: '产品周会',
    summary: '会议讨论了 MVP 上线计划。',
    decisions: ['确认 11 月上线 MVP'],
    todos: [{ task: '整理接口文档', owner: '', dueDate: '下周五' }],
  };

  it('返回可被 mammoth 读取的 docx 文件', async () => {
    const response = await request(app)
      .post('/api/minutes/export')
      .send({ minutes: exportMinutes })
      .buffer(true)
      .parse(binaryParser);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('wordprocessingml.document');
    expect(response.headers['content-disposition']).toContain("filename*=UTF-8''");
    expect(Buffer.isBuffer(response.body)).toBe(true);

    const text = (await mammoth.extractRawText({ buffer: response.body as Buffer })).value;
    expect(text).toContain('产品周会');
    expect(text).toContain('会议讨论了 MVP 上线计划');
    expect(text).toContain('整理接口文档');
    // 空负责人与自然语言日期都应显示为“未明确”。
    expect(text).toContain('未明确');
  });

  it('缺少摘要时返回 400', async () => {
    const response = await request(app)
      .post('/api/minutes/export')
      .send({ minutes: { ...exportMinutes, summary: '' } });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('决策超过 20 条时返回 400', async () => {
    const decisions = Array.from({ length: 21 }, (_item, index) => `决策 ${index + 1}`);

    const response = await request(app)
      .post('/api/minutes/export')
      .send({ minutes: { ...exportMinutes, decisions } });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('缺少 minutes 字段时返回 400', async () => {
    const response = await request(app).post('/api/minutes/export').send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details[0].path).toBe('minutes');
  });
});
