import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { env } from './env';
import { AppError } from './lib/errors';
import { logger } from './lib/logger';
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

  // 可选单进程部署：设置 WEB_DIST 指向 web/dist 后，由后端同时托管前端页面。
  // 未设置或目录不存在时保持纯 API 模式，不影响本地开发。
  if (env.webDist) {
    const webDistPath = path.resolve(process.cwd(), env.webDist);
    const indexHtmlPath = path.join(webDistPath, 'index.html');

    if (fs.existsSync(indexHtmlPath)) {
      app.use(express.static(webDistPath));
      app.get('*', (req, res, next) => {
        // /api 下的未知路径继续交给 404 JSON 处理。
        if (req.path.startsWith('/api')) {
          next();
          return;
        }
        res.sendFile(indexHtmlPath);
      });
    } else {
      logger.warn('WEB_DIST 指向的目录不存在，已跳过静态页面托管', { webDist: env.webDist });
    }
  }

  // 未匹配到任何路由时返回 404，而不是 Express 默认的 HTML 页面。
  app.use((req, _res, next) => {
    next(new AppError('NOT_FOUND', 404, `接口不存在：${req.method} ${req.originalUrl}`));
  });

  app.use(errorHandler);
  return app;
}
