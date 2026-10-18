import express from 'express';
import cors from 'cors';
import { env } from './env';
import { AppError } from './lib/errors';
import { errorHandler } from './middleware/errorHandler';
import { minutesRouter } from './routes/minutes.route';

/**
 * 创建 Express 应用但不监听端口，便于测试里直接交给 supertest 使用。
 */
export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');

  // 本地开发默认允许跨域；如需收紧，可在此配置 origin 白名单。
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      data: {
        status: 'ok',
        aiConfigured: env.aiConfigured,
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use('/api/minutes', minutesRouter);

  // 未匹配到任何路由时返回 404，而不是 Express 默认的 HTML 页面。
  app.use((req, _res, next) => {
    next(new AppError('NOT_FOUND', 404, `接口不存在：${req.method} ${req.originalUrl}`));
  });

  app.use(errorHandler);
  return app;
}
