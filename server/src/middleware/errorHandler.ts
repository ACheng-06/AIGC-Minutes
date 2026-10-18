import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../env';
import { AppError, type ErrorCode, type ErrorDetail } from '../lib/errors';
import { logger } from '../lib/logger';

/** 把任意异常转换成带错误码的 AppError，避免把内部实现细节暴露给前端。 */
function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new AppError('FILE_TOO_LARGE', 413, `文件超过 ${env.limits.maxFileSizeMb}MB 大小限制`);
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return new AppError('VALIDATION_ERROR', 400, '一次只能上传一个文件，且字段名必须为 file');
    }
    return new AppError('VALIDATION_ERROR', 400, `文件上传失败：${error.message}`);
  }

  // express.json 在请求体不是合法 JSON 时抛出带 status=400 的 SyntaxError。
  if (error instanceof SyntaxError && (error as { status?: number }).status === 400) {
    return new AppError('VALIDATION_ERROR', 400, '请求体不是合法的 JSON');
  }

  const message =
    env.nodeEnv === 'production'
      ? '服务器内部错误'
      : `服务器内部错误：${error instanceof Error ? error.message : String(error)}`;
  return new AppError('INTERNAL_ERROR', 500, message);
}

/**
 * 统一错误响应格式：
 * { error: { code, message, details? } }
 */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (res.headersSent) {
    return;
  }

  const appError = normalizeError(error);
  if (appError.status >= 500) {
    // 业务可预期的 5xx（模型超时、输出不合法等）只记录错误码；
    // 未预期的异常才附带堆栈，方便定位问题，也避免日志被无关堆栈淹没。
    const isExpectedBusinessError = error instanceof AppError;
    logger.error(appError.message, {
      code: appError.code,
      ...(isExpectedBusinessError ? {} : { stack: error instanceof Error ? error.stack : undefined }),
    });
  }

  const body: { error: { code: ErrorCode; message: string; details?: ErrorDetail[] } } = {
    error: { code: appError.code, message: appError.message },
  };
  if (appError.details && appError.details.length > 0) {
    body.error.details = appError.details;
  }

  res.status(appError.status).json(body);
}
