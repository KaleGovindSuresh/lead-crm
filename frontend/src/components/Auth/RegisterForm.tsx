import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      showToast("Account created! Please sign in.", "success");
      navigate("/login");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(
        e.response?.data?.message ?? "Registration failed. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <div>
        <label className="label">Full name</label>
        <input
          {...register("name")}
          className={`input ${errors.name ? "border-red-500/60" : ""}`}
          placeholder="Jane Smith"
        />
        {errors.name && (
          <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="label">Email address</label>
        <input
          {...register("email")}
          type="email"
          className={`input ${errors.email ? "border-red-500/60" : ""}`}
          placeholder="you@company.com"
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="label">Password</label>
        <input
          {...register("password")}
          type="password"
          className={`input ${errors.password ? "border-red-500/60" : ""}`}
          placeholder="Min. 6 characters"
        />
        {errors.password && (
          <p className="mt-1.5 text-xs text-red-400">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label className="label">Confirm password</label>
        <input
          {...register("confirmPassword")}
          type="password"
          className={`input ${errors.confirmPassword ? "border-red-500/60" : ""}`}
          placeholder="Repeat password"
        />
        {errors.confirmPassword && (
          <p className="mt-1.5 text-xs text-red-400">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full py-3"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
            Creating account…
          </span>
        ) : (
          "Create account"
        )}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
};
