import http from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { config } from "./config/env";
import { initSocketIO } from "./sockets";
import { logger } from "./utils/logger";

async function bootstrap(): Promise<void> {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server from Express app
  const httpServer = http.createServer(app);

  // Initialize Socket.IO (must be done after HTTP server creation)
  initSocketIO(httpServer);

  // Start listening
  httpServer.listen(config.port, () => {
    logger.info(`🚀 Server running on http://localhost:${config.port}`);
    logger.info(`📡 Socket.IO ready`);
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
    logger.info(`🔗 Client URL: ${config.clientUrl}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    httpServer.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection:", reason);
    process.exit(1);
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    process.exit(1);
  });
}

bootstrap();
