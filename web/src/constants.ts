// 与 server/.env 中的输入限制保持一致；修改时请同步另一侧并在提交说明中注明。
export const MAX_TEXT_CHARS = 30000;
export const MAX_FILE_SIZE_MB = 5;
export const ACCEPTED_FILE_EXTENSIONS = ['.txt', '.docx'] as const;
export const LOCAL_HISTORY_KEY = 'aigc-minutes:history:v1';
export const LOCAL_HISTORY_LIMIT = 10;

// 与 server/src/schemas/minutes.ts 保持一致：导出接口按同样上限校验，
// 前端提前拦截可以避免用户提交后才看到笼统的“导出参数不合法”。
export const MAX_TITLE_LENGTH = 100;
export const MAX_SUMMARY_LENGTH = 20000;
export const MAX_DECISIONS = 20;
export const MAX_DECISION_LENGTH = 500;
export const MAX_TODOS = 20;
export const MAX_TODO_TASK_LENGTH = 500;
export const MAX_OWNER_LENGTH = 50;
