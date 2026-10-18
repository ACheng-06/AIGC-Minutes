import multer from 'multer';
import path from 'node:path';
import { env } from '../env';
import { AppError } from '../lib/errors';

const ALLOWED_EXTENSIONS = new Set(['.txt', '.docx']);

/**
 * 使用内存存储：文件不会落盘，解析完即释放，适合小型 MVP。
 * 类型与大小在进入业务逻辑前拦截，具体内容校验（DOCX 魔数、文本长度）在 extractText 中完成。
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.limits.maxFileSizeMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension === '.doc') {
      callback(new AppError('UNSUPPORTED_FILE_TYPE', 415, '暂不支持旧版 .doc 文件，请另存为 .docx 后重试'));
      return;
    }

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      callback(new AppError('UNSUPPORTED_FILE_TYPE', 415, '仅支持 TXT 和 DOCX 文件'));
      return;
    }

    callback(null, true);
  },
});
