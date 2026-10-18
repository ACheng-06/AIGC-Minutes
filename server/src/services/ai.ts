import { env, type AiConfig } from '../env';
import { AppError } from '../lib/errors';
import { AiMinutesSchema, toMinutes, type Minutes } from '../schemas/minutes';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export interface AiRequestOptions {
  config?: AiConfig;
  fetchImpl?: typeof fetch;
}

type ParseResult =
  | { ok: true; minutes: Minutes }
  | { ok: false; reason: string };

// 提示词要求模型只输出 JSON，并明确“不编造负责人与日期”的硬约束。
// 具体结构校验由 Zod 完成，提示词只是第一道约束。
const SYSTEM_PROMPT = `你是一名严谨的中文会议纪要助手。请把用户提供的会议原始记录整理成结构化纪要，并且只输出一个 JSON 对象，不要输出 Markdown 代码块、解释或任何额外文字。

JSON 结构：
{
  "title": "不超过 40 字的纪要标题",
  "summary": "会议摘要，200-500 字",
  "decisions": ["关键决策，每条一句话"],
  "todos": [{ "task": "任务描述", "owner": "负责人", "dueDate": "YYYY-MM-DD" }]
}

规则：
1. 只使用会议原文中出现的信息，不得推测或编造。
2. 原文没有明确负责人时，owner 必须是空字符串 ""；没有明确截止日期时，dueDate 必须是空字符串 ""。
3. dueDate 只能使用 YYYY-MM-DD 格式；无法确定时留空，不要写“下周”“月底”等模糊说法。
4. decisions 和 todos 各不超过 20 条；没有内容时输出空数组 []。
5. 摘要使用中文，客观概括讨论内容与结论。`;

function ensureConfigured(config: AiConfig): void {
  if (!config.baseUrl || !config.apiKey || !config.model) {
    throw new AppError(
      'AI_NOT_CONFIGURED',
      503,
      '服务端尚未配置模型，请在 server/.env 中设置 LLM_BASE_URL、LLM_API_KEY、LLM_MODEL',
    );
  }
}

/** 去掉代码围栏和前后解释文字，只截取第一个 { 到最后一个 } 之间的 JSON。 */
export function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return candidate.slice(start, end + 1);
}

/** 解析并校验模型输出；失败时返回原因，交给调用方决定是否修复重试。 */
export function parseAiMinutes(raw: string): ParseResult {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) {
    return { ok: false, reason: '没有找到 JSON 对象' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, reason: 'JSON 语法错误' };
  }

  const result = AiMinutesSchema.safeParse(parsed);
  if (!result.success) {
    const reason = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('；');
    return { ok: false, reason };
  }

  return { ok: true, minutes: toMinutes(result.data) };
}

async function chatCompletion(
  messages: ChatMessage[],
  config: AiConfig,
  fetchImpl: typeof fetch,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetchImpl(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AppError('AI_UPSTREAM_ERROR', 502, `模型服务返回错误（HTTP ${response.status}），请稍后重试`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new AppError('AI_UPSTREAM_ERROR', 502, '模型服务返回了空内容，请稍后重试');
    }

    return content;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError('AI_TIMEOUT', 504, '模型响应超时，请重试或精简输入');
    }
    throw new AppError('AI_UPSTREAM_ERROR', 502, '模型服务调用失败，请检查网络与接口配置');
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 调用模型并生成结构化纪要。
 * 第一次输出无法解析或不符合结构时，把原因反馈给模型并只修复一次，避免无限重试放大费用。
 */
export async function generateStructuredMinutes(
  text: string,
  options: AiRequestOptions = {},
): Promise<Minutes> {
  const config = options.config ?? env.llm;
  const fetchImpl = options.fetchImpl ?? fetch;
  ensureConfigured(config);

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `以下是会议原始记录，请整理为结构化纪要。\n<会议原文>\n${text}\n</会议原文>`,
    },
  ];

  const firstRaw = await chatCompletion(messages, config, fetchImpl);
  const first = parseAiMinutes(firstRaw);
  if (first.ok) {
    return first.minutes;
  }

  const repairMessages: ChatMessage[] = [
    ...messages,
    { role: 'assistant', content: firstRaw },
    {
      role: 'user',
      content: `上一条回复不是合法的结构化 JSON（${first.reason}）。请只输出符合要求的 JSON 对象，不要代码围栏或解释文字。`,
    },
  ];

  const secondRaw = await chatCompletion(repairMessages, config, fetchImpl);
  const second = parseAiMinutes(secondRaw);
  if (second.ok) {
    return second.minutes;
  }

  throw new AppError('AI_INVALID_OUTPUT', 502, '模型返回内容无法解析为会议纪要，请重试或精简输入');
}
