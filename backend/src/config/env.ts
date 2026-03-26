import dotenv from "dotenv";
dotenv.config({ debug: true });
function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env["PORT"] ?? "4000", 10),
  mongoUri: requireEnv("MONGO_URI", "mongodb://localhost:27017/crm_plus"),
  jwtSecret: requireEnv("JWT_SECRET", "change_this_secret_in_production"),
  jwtExpiresIn: process.env["JWT_EXPIRES_IN"] ?? "1h",
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  clientUrl: process.env["CLIENT_URL"] ?? "http://localhost:5173",
  loginRateLimitWindowMs: parseInt(
    process.env["LOGIN_RATE_LIMIT_WINDOW_MS"] ?? "60000",
    10,
  ),
  loginRateLimitMax: parseInt(process.env["LOGIN_RATE_LIMIT_MAX"] ?? "5", 10),
} as const;
