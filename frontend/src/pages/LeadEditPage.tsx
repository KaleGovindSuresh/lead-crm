import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { leadsApi } from "../api/leads.api";
import { LeadForm } from "../components/Leads/LeadForm";
import { PageLoader } from "../components/UI/Spinner";
import { ErrorState } from "../components/UI/States";
import { useToast } from "../context/ToastContext";
import type { Lead, LeadBody } from "../types";

export const LeadEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const showToast = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsFetching(true);
    leadsApi
      .getLead(id)
      .then((lead) => setLead(lead))
      .catch(() =>
        setFetchError("Lead not found or you lack permission to view it."),
      )
      .finally(() => setIsFetching(false));
  }, [id]);

  const handleSubmit = async (data: LeadBody) => {
    if (!id) return;
    setIsSubmitting(true);
    setServerError(null);
    try {
      await leadsApi.updateLead(id, data);
      showToast("Lead updated successfully!", "success");
      navigate("/leads");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message ?? "Failed to update lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) return <PageLoader />;
  if (fetchError) return <ErrorState message={fetchError} />;

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
        <span className="text-slate-300">{lead?.name}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Edit Lead</h1>
        <p className="mt-1 text-sm text-slate-500">Update lead information</p>
      </div>

      <div className="card p-6">
        {lead && (
          <LeadForm
            initialValues={lead}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            submitLabel="Save Changes"
            serverError={serverError}
          />
        )}
      </div>
    </div>
  );
};
