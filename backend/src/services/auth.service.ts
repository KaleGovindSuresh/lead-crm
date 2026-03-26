import bcrypt from "bcryptjs";
import { UserModel, UserRole } from "../models/user.model";
import { signToken } from "../utils/jwt";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../utils/error";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authService = {
  async register(input: RegisterInput) {
    const { name, email, password, role = "sales" } = input;

    const existing = await UserModel.findOne({ email });
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    if (password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await UserModel.create({ name, email, passwordHash, role });

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },

  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signToken({ sub: user._id.toString(), role: user.role });

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },
};
