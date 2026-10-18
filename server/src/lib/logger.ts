type Meta = Record<string, unknown>;

// 轻量日志：只记录时间、级别、消息和少量结构化字段。
// 注意：不要把会议原文或密钥写进日志。
function write(level: 'info' | 'warn' | 'error', message: string, meta?: Meta): void {
  const prefix = `[${new Date().toISOString()}] [${level}] ${message}`;
  if (level === 'error') {
    console.error(prefix, meta ?? '');
    return;
  }
  if (level === 'warn') {
    console.warn(prefix, meta ?? '');
    return;
  }
  console.log(prefix, meta ?? '');
}

export const logger = {
  info: (message: string, meta?: Meta) => write('info', message, meta),
  warn: (message: string, meta?: Meta) => write('warn', message, meta),
  error: (message: string, meta?: Meta) => write('error', message, meta),
};
