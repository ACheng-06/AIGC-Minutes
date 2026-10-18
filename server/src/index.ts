import { env } from './env';
import { createApp } from './app';
import { logger } from './lib/logger';

const app = createApp();
const server = app.listen(env.port, () => {
  logger.info(`AIGC Minutes 后端已启动：http://localhost:${env.port}`);
  if (!env.aiConfigured) {
    logger.warn('未配置 LLM_BASE_URL / LLM_API_KEY / LLM_MODEL，生成接口将返回 503');
  }
});

/** 收到退出信号时先停止接收新请求，再退出进程。 */
function shutdown(signal: string): void {
  logger.info(`收到 ${signal}，正在关闭服务...`);
  server.close((error) => {
    if (error) {
      logger.error('关闭服务时出错', { error: error.message });
      process.exitCode = 1;
    }
    process.exit();
  });
  setTimeout(() => {
    logger.warn('优雅关闭超时，强制退出');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
