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

export interface GenerateResult {
  minutes: Minutes;
  meta: MinutesMeta;
}

export interface HealthInfo {
  status: string;
  aiConfigured: boolean;
  timestamp: string;
}

export interface LocalMinutesRecord {
  id: string;
  savedAt: string;
  minutes: Minutes;
}

/** 工作台提交给生成流程的两种输入。 */
export type GenerateInput = { type: 'text'; text: string } | { type: 'file'; file: File };

// 与 server/src/lib/errors.ts 的错误码保持一致，前端额外补充网络错误。
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'CONTENT_TOO_LONG'
  | 'FILE_PARSE_ERROR'
  | 'EMPTY_CONTENT'
  | 'AI_NOT_CONFIGURED'
  | 'AI_TIMEOUT'
  | 'AI_UPSTREAM_ERROR'
  | 'AI_INVALID_OUTPUT'
  | 'EXPORT_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';
