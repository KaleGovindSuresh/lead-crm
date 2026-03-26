import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { leadsApi } from "../api/leads.api";
import { LeadForm } from "../components/Leads/LeadForm";
import { useToast } from "../context/ToastContext";
import type { LeadBody } from "../types";

export const LeadCreatePage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (data: LeadBody) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await leadsApi.createLead(data);
      showToast("Lead created successfully!", "success");
      navigate("/leads");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message ?? "Failed to create lead");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/leads" className="hover:text-slate-300 transition-colors">
          Leads
        </Link>
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="text-slate-300">New Lead</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Create Lead</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a new lead to your pipeline
        </p>
      </div>

      <div className="card p-6">
        <LeadForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Create Lead"
          serverError={serverError}
        />
      </div>
    </div>
  );
};
