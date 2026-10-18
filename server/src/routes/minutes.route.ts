import { Router, type NextFunction, type Request, type Response } from 'express';
import { AppError } from '../lib/errors';
import { upload } from '../middleware/upload';
import { ExportRequestSchema, GenerateTextSchema, toErrorDetails } from '../schemas/minutes';
import { extractTextFromFile, prepareMeetingText } from '../services/extractText';
import { buildMinutesDocx, buildMinutesFileName, DOCX_MIME } from '../services/exportDocx';
import { generateMinutes } from '../services/minutes';

export const minutesRouter = Router();

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

/** Express 4 不会自动捕获 async 函数抛出的异常，这里统一转交给错误中间件。 */
function asyncHandler(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}

/**
 * POST /api/minutes/generate
 * - application/json：{ text }
 * - multipart/form-data：file 字段（TXT / DOCX）
 * multer 只处理 multipart 请求，JSON 请求会原样进入后续逻辑。
 */
minutesRouter.post(
  '/generate',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const isMultipart = Boolean(req.is('multipart/form-data'));
    const isJson = Boolean(req.is('application/json'));

    if (!isMultipart && !isJson) {
      throw new AppError('UNSUPPORTED_MEDIA_TYPE', 415, '仅支持 application/json 或 multipart/form-data 请求');
    }

    let text: string;
    let source: { sourceType: 'text' | 'file'; fileName: string | null };

    if (isMultipart) {
      if (!req.file) {
        throw new AppError('VALIDATION_ERROR', 400, '请选择要上传的 TXT 或 DOCX 文件');
      }

      const extracted = await extractTextFromFile(req.file);
      text = extracted.text;
      source = { sourceType: 'file', fileName: req.file.originalname };
    } else {
      const parsed = GenerateTextSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 400, '请求参数不合法', toErrorDetails(parsed.error));
      }

      const prepared = prepareMeetingText(parsed.data.text);
      text = prepared.text;
      source = { sourceType: 'text', fileName: null };
    }

    const result = await generateMinutes(text, source);
    res.json({ data: result });
  }),
);

/**
 * POST /api/minutes/export
 * 接收前端编辑后的纪要，返回 docx 二进制。
 * 无状态：不保存文件，也不依赖数据库。
 */
minutesRouter.post(
  '/export',
  asyncHandler(async (req, res) => {
    const parsed = ExportRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, '导出参数不合法', toErrorDetails(parsed.error));
    }

    const buffer = await buildMinutesDocx(parsed.data.minutes);
    const fileName = buildMinutesFileName();

    res.setHeader('Content-Type', DOCX_MIME);
    // filename 提供 ASCII 兜底，filename* 按 RFC 5987 传递中文名。
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="minutes.docx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.setHeader('Content-Length', String(buffer.length));
    res.send(buffer);
  }),
);
