import path from 'node:path';
import mammoth from 'mammoth';
import { env } from '../env';
import { AppError } from '../lib/errors';

/** multer 内存存储后交给本模块的文件信息。 */
export interface UploadedFileInfo {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
}

export interface PreparedText {
  text: string;
  charCount: number;
}

// DOCX 本质是 ZIP 包，前四个字节固定为 "PK\x03\x04"。
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/**
 * 从 TXT 或 DOCX 文件中提取纯文本，并做统一规范化与长度校验。
 * 文件类型在路由层已初步过滤，这里仍然按扩展名兜底，避免绕过。
 */
export async function extractTextFromFile(file: UploadedFileInfo): Promise<PreparedText> {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension === '.txt') {
    return prepareMeetingText(decodeText(file.buffer));
  }

  if (extension === '.docx') {
    return prepareMeetingText(await readDocxText(file.buffer));
  }

  throw new AppError('UNSUPPORTED_FILE_TYPE', 415, '仅支持 TXT 和 DOCX 文件');
}

/**
 * 规范化会议文本：统一换行、去掉行尾空白、压缩连续空行，并校验空内容与长度。
 * 粘贴文本与文件提取共用同一套规则，保证两种入口行为一致。
 */
export function prepareMeetingText(raw: string): PreparedText {
  const text = raw
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text) {
    throw new AppError('EMPTY_CONTENT', 422, '未提取到有效文本，请检查输入内容或文件');
  }

  if (text.length > env.limits.maxTextChars) {
    throw new AppError(
      'CONTENT_TOO_LONG',
      422,
      `文本长度超过 ${env.limits.maxTextChars} 字符上限，请精简后重试`,
    );
  }

  return { text, charCount: text.length };
}

/**
 * 先按 UTF-8 严格解码；失败时回退 GBK，兼容中文 Windows 下保存的 TXT 文件。
 */
function decodeText(buffer: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    try {
      return new TextDecoder('gbk').decode(buffer);
    } catch {
      throw new AppError('FILE_PARSE_ERROR', 422, '无法识别文本文件编码，请使用 UTF-8 或 GBK 编码后重试');
    }
  }
}

async function readDocxText(buffer: Buffer): Promise<string> {
  if (buffer.length < 4 || !buffer.subarray(0, 4).equals(ZIP_SIGNATURE)) {
    throw new AppError('UNSUPPORTED_FILE_TYPE', 415, '文件内容不是有效的 DOCX，请检查文件后重试');
  }

  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch {
    throw new AppError('FILE_PARSE_ERROR', 422, 'DOCX 解析失败，请确认文件未损坏');
  }
}
