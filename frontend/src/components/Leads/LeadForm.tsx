import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "../../api/users.api";
import { usePermissions } from "../../hooks/usePermissions";
import type { Lead, User } from "../../types";

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(7, "Enter a valid phone number").max(20),
  email: z
    .union([z.string().email("Invalid email address"), z.literal("")])
    .optional(),
  source: z.enum(["website", "referral", "cold", "other"] as const),
  status: z.enum(["new", "contacted", "qualified", "won", "lost"] as const),
  notes: z.string().max(2000).optional(),
  assignedTo: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  initialValues?: Partial<Lead>;
  onSubmit: (data: LeadFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  serverError?: string | null;
}

export const LeadForm = ({
  initialValues,
  onSubmit,
  isLoading,
  submitLabel = "Save Lead",
  serverError,
}: LeadFormProps) => {
  const { can } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      phone: initialValues?.phone ?? "",
      email: initialValues?.email ?? "",
      source: initialValues?.source ?? "website",
      status: initialValues?.status ?? "new",
      notes: initialValues?.notes ?? "",
      assignedTo:
        typeof initialValues?.assignedTo === "object"
          ? initialValues.assignedTo?._id
          : (initialValues?.assignedTo ?? ""),
    },
  });

  // Load users for assignedTo dropdown (manager/admin only)
  useEffect(() => {
    if (can("user:read")) {
      usersApi
        .getUsers()
        .then((result) => setUsers(result.users))
        .catch(() => {});
    }
  }, [can]);

  const inputClass = (err?: { message?: string }) =>
    `input ${err ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : ""}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Name */}
        <div>
          <label className="label">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            {...register("name")}
            className={inputClass(errors.name)}
            placeholder="Full name"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="label">
            Phone <span className="text-red-400">*</span>
          </label>
          <input
            {...register("phone")}
            className={inputClass(errors.phone)}
            placeholder="+91 98765 43210"
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-red-400">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="label">
            Email{" "}
            <span className="text-slate-600 text-[10px] ml-1">optional</span>
          </label>
          <input
            {...register("email")}
            type="email"
            className={inputClass(errors.email)}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Source */}
        <div>
          <label className="label">
            Source <span className="text-red-400">*</span>
          </label>
          <select {...register("source")} className="select">
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="cold">Cold</option>
            <option value="other">Other</option>
          </select>
          {errors.source && (
            <p className="mt-1.5 text-xs text-red-400">
              {errors.source.message}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="label">
            Status <span className="text-red-400">*</span>
          </label>
          <select {...register("status")} className="select">
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          {errors.status && (
            <p className="mt-1.5 text-xs text-red-400">
              {errors.status.message}
            </p>
          )}
        </div>

        {/* Assigned To (manager/admin only) */}
        {can("user:read") && (
          <div>
            <label className="label">
              Assigned To{" "}
              <span className="text-slate-600 text-[10px] ml-1">optional</span>
            </label>
            <select {...register("assignedTo")} className="select">
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="label">
          Notes{" "}
          <span className="text-slate-600 text-[10px] ml-1">optional</span>
        </label>
        <textarea
          {...register("notes")}
          rows={4}
          className={`${inputClass(errors.notes)} resize-none`}
          placeholder="Any additional information…"
        />
        {errors.notes && (
          <p className="mt-1.5 text-xs text-red-400">{errors.notes.message}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary min-w-[120px]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
              Saving…
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};
