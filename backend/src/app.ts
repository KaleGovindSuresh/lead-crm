import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { AppError } from "./utils/error";

// Routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import leadRoutes from "./routes/lead.routes";
import notificationRoutes from "./routes/notification.routes";

const app = express();

// ─── Security Middlewares ──────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body Parsing ──────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging (dev) ────────────────────────────────────────────────────

if (config.nodeEnv === "development") {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    env: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/notifications", notificationRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    if (config.nodeEnv === "development") {
      logger.error(
        `[${err.statusCode}] ${req.method} ${req.originalUrl} — ${err.message}`,
      );
    }
    res.status(err.statusCode).json({
      message: err.message,
      ...(config.nodeEnv === "development" ? { stack: err.stack } : {}),
    });
    return;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    res.status(400).json({ message: err.message });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    res.status(400).json({ message: "Invalid ID format" });
    return;
  }

  // MongoDB duplicate key
  const mongoErr = err as { code?: number };
  if (mongoErr.code === 11000) {
    res
      .status(409)
      .json({ message: "Duplicate entry — resource already exists" });
    return;
  }

  logger.error(`Unhandled error: ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({
    message: "Internal server error",
    ...(config.nodeEnv === "development" ? { error: err.message } : {}),
  });
});

export default app;
