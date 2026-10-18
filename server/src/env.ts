import dotenv from 'dotenv';
import { z } from 'zod';

// 先加载 .env，再读取 process.env。真实密钥只存放在这个文件里，且已被 .gitignore 忽略。
// quiet 关闭 dotenv 的注入提示，避免测试输出被无关日志干扰。
dotenv.config({ quiet: true });

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LLM_BASE_URL: z.string().trim().default(''),
  LLM_API_KEY: z.string().trim().default(''),
  LLM_MODEL: z.string().trim().default(''),
  LLM_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300000).default(60000),
  MAX_TEXT_CHARS: z.coerce.number().int().min(100).max(200000).default(30000),
  MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(50).default(5),
  WEB_DIST: z.string().trim().optional(),
});

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export interface AppEnv {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  llm: AiConfig;
  limits: {
    maxTextChars: number;
    maxFileSizeMb: number;
  };
  webDist?: string;
  aiConfigured: boolean;
}

/**
 * 把环境变量解析成代码里更好用的结构。
 * 缺失 LLM 配置不算启动失败：服务照常运行，只有生成接口返回 503，方便先联调前端。
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('；');
    throw new Error(`环境变量配置有误：${detail}`);
  }

  const value = parsed.data;
  const aiConfigured = Boolean(value.LLM_BASE_URL && value.LLM_API_KEY && value.LLM_MODEL);

  return {
    port: value.PORT,
    nodeEnv: value.NODE_ENV,
    llm: {
      baseUrl: value.LLM_BASE_URL,
      apiKey: value.LLM_API_KEY,
      model: value.LLM_MODEL,
      timeoutMs: value.LLM_TIMEOUT_MS,
    },
    limits: {
      maxTextChars: value.MAX_TEXT_CHARS,
      maxFileSizeMb: value.MAX_FILE_SIZE_MB,
    },
    webDist: value.WEB_DIST || undefined,
    aiConfigured,
  };
}

export const env = loadEnv();
