import { Request, Response, NextFunction } from "express";

type FieldRule = {
  required?: boolean;
  type?: "string" | "number" | "boolean";
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  regex?: RegExp;
  isEmail?: boolean;
  isOptional?: boolean;
};

type Schema = Record<string, FieldRule>;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    const body = req.body as Record<string, unknown>;

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      const isEmpty = value === undefined || value === null || value === "";

      if (rules.isOptional && isEmpty) continue;
      if (rules.required && isEmpty) {
        errors.push(`${field} is required`);
        continue;
      }
      if (isEmpty) continue;

      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be a ${rules.type}`);
        continue;
      }

      if (rules.type === "string") {
        const str = value as string;
        if (rules.minLength && str.length < rules.minLength) {
          errors.push(
            `${field} must be at least ${rules.minLength} characters`,
          );
        }
        if (rules.maxLength && str.length > rules.maxLength) {
          errors.push(`${field} cannot exceed ${rules.maxLength} characters`);
        }
        if (rules.enum && !rules.enum.includes(str)) {
          errors.push(`${field} must be one of: ${rules.enum.join(", ")}`);
        }
        if (rules.regex && !rules.regex.test(str)) {
          errors.push(`${field} format is invalid`);
        }
        if (rules.isEmail && !isValidEmail(str)) {
          errors.push(`${field} must be a valid email`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    next();
  };
}

// Reusable schemas
export const registerSchema: Schema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 100 },
  email: { required: true, type: "string", isEmail: true },
  password: { required: true, type: "string", minLength: 6, maxLength: 100 },
};

export const loginSchema: Schema = {
  email: { required: true, type: "string", isEmail: true },
  password: { required: true, type: "string" },
};

export const createLeadSchema: Schema = {
  name: { required: true, type: "string", minLength: 2, maxLength: 100 },
  phone: {
    required: true,
    type: "string",
    regex: /^[0-9+\-()\s]{7,20}$/,
  },
  email: { isOptional: true, type: "string", isEmail: true },
  source: {
    required: true,
    type: "string",
    enum: ["website", "referral", "cold", "other"],
  },
  status: {
    isOptional: true,
    type: "string",
    enum: ["new", "contacted", "qualified", "won", "lost"],
  },
  notes: { isOptional: true, type: "string", maxLength: 2000 },
};

export const updateLeadSchema: Schema = {
  name: { isOptional: true, type: "string", minLength: 2, maxLength: 100 },
  phone: {
    isOptional: true,
    type: "string",
    regex: /^[0-9+\-()\s]{7,20}$/,
  },
  email: { isOptional: true, type: "string", isEmail: true },
  source: {
    isOptional: true,
    type: "string",
    enum: ["website", "referral", "cold", "other"],
  },
  status: {
    isOptional: true,
    type: "string",
    enum: ["new", "contacted", "qualified", "won", "lost"],
  },
  notes: { isOptional: true, type: "string", maxLength: 2000 },
};

export const updateRoleSchema: Schema = {
  role: {
    required: true,
    type: "string",
    enum: ["admin", "manager", "sales"],
  },
};
