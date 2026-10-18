import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env';

describe('loadEnv', () => {
  it('三项 LLM 配置齐全时标记为可用', () => {
    const env = loadEnv({
      LLM_BASE_URL: 'https://llm.example.com/v1',
      LLM_API_KEY: 'test-key',
      LLM_MODEL: 'test-model',
    });

    expect(env.aiConfigured).toBe(true);
    expect(env.llm.model).toBe('test-model');
    expect(env.port).toBe(3000);
    expect(env.limits.maxTextChars).toBe(30000);
  });

  it('缺少密钥时允许启动但标记为不可用', () => {
    const env = loadEnv({});

    expect(env.aiConfigured).toBe(false);
  });

  it('端口非法时抛出带说明的错误', () => {
    expect(() => loadEnv({ PORT: '70000' })).toThrowError(/环境变量配置有误/);
  });
});
