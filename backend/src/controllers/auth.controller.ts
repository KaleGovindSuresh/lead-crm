import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";

export const authController = {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, email, password } = req.body as {
        name: string;
        email: string;
        password: string;
      };
      const user = await authService.register({ name, email, password });
      res.status(201).json({ message: "Registration successful", user });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const result = await authService.login({ email, password });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  logout(_req: Request, res: Response): void {
    // Stateless JWT — client discards token
    res.status(200).json({ message: "Logged out successfully" });
  },
};
