import app from './app';
import { config } from './Config';
import { Logger } from './Utils/logger';

const startServer = async (): Promise<void> => {
  try {
    app.listen(config.port, () => {
      console.log('═══════════════════════════════════════════════════');
      Logger.info(`🚀 Server http://localhost:${config.port} üzerinde çalışıyor`);
      Logger.info(`📚 Swagger docs http://localhost:${config.port}/api-docs`);
      Logger.info(`🌍 Ortam: ${config.node_env}`);
      console.log('═══════════════════════════════════════════════════');
    });
  } catch (error) {
    Logger.error('❌ Server başlatılamadı:', error as Error);
    process.exit(1);
  }
};

startServer();
