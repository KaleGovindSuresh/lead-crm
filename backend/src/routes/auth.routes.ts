import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import {
  validate,
  registerSchema,
  loginSchema,
} from "../middlewares/validate.middleware";
import { loginRateLimiter } from "../middlewares/rateLimiter";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// POST /api/auth/register
router.post("/register", validate(registerSchema), authController.register);

// POST /api/auth/login  (rate limited)
router.post(
  "/login",
  loginRateLimiter,
  validate(loginSchema),
  authController.login,
);

// POST /api/auth/logout
router.post("/logout", authMiddleware, authController.logout);

export default router;
