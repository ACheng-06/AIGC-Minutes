import { z } from 'zod';
import type { ErrorDetail } from '../lib/errors';

export const MAX_TITLE_LENGTH = 100;
export const MAX_SUMMARY_LENGTH = 20000;
export const MAX_DECISIONS = 20;
export const MAX_DECISION_LENGTH = 500;
export const MAX_TODOS = 20;
export const MAX_TODO_TASK_LENGTH = 500;
export const MAX_OWNER_LENGTH = 50;
export const DEFAULT_TITLE = '会议纪要';

export interface TodoItem {
  task: string;
  owner: string;
  dueDate: string;
}

export interface Minutes {
  title: string;
  summary: string;
  decisions: string[];
  todos: TodoItem[];
}

export interface MinutesMeta {
  sourceType: 'text' | 'file';
  fileName: string | null;
  charCount: number;
  generatedAt: string;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PLACEHOLDER_VALUES = new Set(['未明确', '待定', '未知', '无', 'n/a', 'na', 'unknown', 'tbd', '-', '—']);

/**
 * 只接受真实存在的 YYYY-MM-DD。模型常见的“下周五”“10 月底”一律归空，
 * 宁可在界面上显示“未明确”，也不替用户猜测日期。
 */
export function normalizeDueDate(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const candidate = value.trim();
  if (!ISO_DATE_PATTERN.test(candidate)) {
    return '';
  }

  const date = new Date(`${candidate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== candidate) {
    return '';
  }

  return candidate;
}

/** 把“未明确”“待定”等占位词统一为空字符串，前端统一显示“未明确”。 */
export function normalizeOwner(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const candidate = value.trim();
  if (!candidate || PLACEHOLDER_VALUES.has(candidate.toLowerCase())) {
    return '';
  }

  return candidate.slice(0, MAX_OWNER_LENGTH);
}

function toText(value: unknown): string {
  return value == null ? '' : String(value);
}

/**
 * 模型原始输出：对缺字段、null、数字等做宽容处理，交给 toMinutes 归一化。
 * 摘要仍然必须非空，否则触发一次修复重试。
 */
export const AiMinutesSchema = z.object({
  title: z.preprocess(toText, z.string().trim().max(MAX_TITLE_LENGTH)),
  summary: z.preprocess(toText, z.string().trim().min(1).max(MAX_SUMMARY_LENGTH)),
  decisions: z.preprocess(
    (value) => (value == null ? [] : value),
    z.array(z.preprocess(toText, z.string().trim().max(MAX_DECISION_LENGTH))).max(50),
  ),
  todos: z.preprocess(
    (value) => (value == null ? [] : value),
    z
      .array(
        z.object({
          task: z.preprocess(toText, z.string().trim().min(1).max(MAX_TODO_TASK_LENGTH)),
          owner: z.preprocess(toText, z.string()),
          dueDate: z.preprocess(toText, z.string()),
        }),
      )
      .max(50),
  ),
});

/** 把通过校验的模型输出裁剪到 MVP 允许的条数，并归一化负责人与日期。 */
export function toMinutes(ai: z.infer<typeof AiMinutesSchema>): Minutes {
  return {
    title: ai.title.trim() || DEFAULT_TITLE,
    summary: ai.summary.trim(),
    decisions: ai.decisions
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_DECISIONS),
    todos: ai.todos
      .map((todo) => ({
        task: todo.task.trim(),
        owner: normalizeOwner(todo.owner),
        dueDate: normalizeDueDate(todo.dueDate),
      }))
      .filter((todo) => todo.task.length > 0)
      .slice(0, MAX_TODOS),
  };
}

/** 导出接口中单条待办的入参校验。 */
export const TodoInputSchema = z.object({
  task: z.string().trim().min(1, '任务描述不能为空').max(MAX_TODO_TASK_LENGTH),
  owner: z.preprocess(toText, z.string().trim().max(MAX_OWNER_LENGTH).transform((value) => normalizeOwner(value))).default(''),
  dueDate: z.preprocess(toText, z.string().transform((value) => normalizeDueDate(value))).default(''),
});

/**
 * 对外统一的纪要结构（生成响应与导出入参共用）。
 * transform 负责补默认标题、过滤空决策，保证下游拿到的就是干净的 Minutes。
 */
export const MinutesSchema = z
  .object({
    title: z.string().trim().max(MAX_TITLE_LENGTH).optional(),
    summary: z.string().trim().min(1, '摘要不能为空').max(MAX_SUMMARY_LENGTH),
    decisions: z
      .array(z.string().trim().max(MAX_DECISION_LENGTH))
      .max(MAX_DECISIONS, `关键决策最多 ${MAX_DECISIONS} 条`)
      .transform((list) => list.map((item) => item.trim()).filter(Boolean)),
    todos: z
      .array(TodoInputSchema)
      .max(MAX_TODOS, `待办事项最多 ${MAX_TODOS} 条`)
      .transform((list) => list.filter((todo) => todo.task.trim().length > 0)),
  })
  .transform((value): Minutes => ({
    title: value.title?.trim() || DEFAULT_TITLE,
    summary: value.summary.trim(),
    decisions: value.decisions,
    todos: value.todos.map((todo) => ({
      task: todo.task.trim(),
      owner: todo.owner,
      dueDate: todo.dueDate,
    })),
  }));

export const GenerateTextSchema = z.object({
  text: z.string().min(1, '文本不能为空'),
});

export const ExportRequestSchema = z.object({
  minutes: MinutesSchema,
});

export function toErrorDetails(error: z.ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}
