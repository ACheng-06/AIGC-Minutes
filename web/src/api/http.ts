import axios from 'axios';
import type { ApiErrorCode } from '../types/minutes';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

interface ServerErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
  };
}

const SERVER_ERROR_CODES = new Set<ApiErrorCode>([
  'VALIDATION_ERROR',
  'UNSUPPORTED_MEDIA_TYPE',
  'UNSUPPORTED_FILE_TYPE',
  'FILE_TOO_LARGE',
  'CONTENT_TOO_LONG',
  'FILE_PARSE_ERROR',
  'EMPTY_CONTENT',
  'AI_NOT_CONFIGURED',
  'AI_TIMEOUT',
  'AI_UPSTREAM_ERROR',
  'AI_INVALID_OUTPUT',
  'EXPORT_ERROR',
  'NOT_FOUND',
  'INTERNAL_ERROR',
]);

/** 前端统一使用的错误对象，页面只需要展示 message，并按需判断 code。 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details: ApiErrorDetail[];

  constructor(code: ApiErrorCode, status: number, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const http = axios.create({
  baseURL,
  timeout: 90000,
});

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    // 导出接口使用 responseType=blob，后端返回的错误 JSON 也会被包装成 Blob。
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        error.response.data = JSON.parse(text) as ServerErrorBody;
      } catch {
        // 保持原始错误，交给下面的统一转换。
      }
    }
    return Promise.reject(toApiError(error));
  },
);

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data as ServerErrorBody | undefined;
    const serverCode = body?.error?.code;

    if (body?.error?.message && serverCode && SERVER_ERROR_CODES.has(serverCode as ApiErrorCode)) {
      return new ApiError(
        serverCode as ApiErrorCode,
        status,
        body.error.message,
        body.error.details ?? [],
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiError('NETWORK_ERROR', status, '请求超时，请稍后重试或缩短输入内容');
    }

    return new ApiError('NETWORK_ERROR', status, '无法连接后端服务，请确认服务已启动');
  }

  return new ApiError('UNKNOWN_ERROR', 0, '发生未知错误，请稍后重试');
}
