// 与 server/.env 中的输入限制保持一致；修改时请同步另一侧并在提交说明中注明。
export const MAX_TEXT_CHARS = 30000;
export const MAX_FILE_SIZE_MB = 5;
export const ACCEPTED_FILE_EXTENSIONS = ['.txt', '.docx'] as const;
export const LOCAL_HISTORY_KEY = 'aigc-minutes:history:v1';
export const LOCAL_HISTORY_LIMIT = 10;
