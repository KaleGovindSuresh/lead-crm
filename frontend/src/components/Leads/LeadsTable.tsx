import { Link } from "react-router-dom";
import { useState } from "react";
import type { Lead } from "../../types";
import { StatusBadge, SourceBadge } from "../UI/Badges";
import { formatDate } from "../../utils/formatters";
import { usePermissions } from "../../hooks/usePermissions";

interface LeadsTableProps {
  leads: Lead[];
  onDelete: (id: string) => void;
  isDeleting?: string | null;
}

export const LeadsTable = ({
  leads,
  onDelete,
  isDeleting,
}: LeadsTableProps) => {
  const { can } = usePermissions();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const getAssigneeName = (lead: Lead): string => {
    if (!lead.assignedTo) return "—";
    if (typeof lead.assignedTo === "object") return lead.assignedTo.name;
    return "—";
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2d4d]">
              {[
                "Name",
                "Contact",
                "Source",
                "Status",
                "Assigned To",
                "Created",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-500 tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead._id}
                className="group border-b border-[#1a2440] transition-colors hover:bg-[#1a2440]/50 last:border-0"
              >
                <td className="px-4 py-3.5">
                  <Link
                    to={`/leads/${lead._id}/edit`}
                    className="font-medium text-slate-200 hover:text-blue-400 transition-colors"
                  >
                    {lead.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <div>
                    {lead.email && (
                      <p className="text-slate-400 text-xs">{lead.email}</p>
                    )}
                    <p className="text-slate-500 text-xs font-mono">
                      {lead.phone}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <SourceBadge source={lead.source} />
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3.5 text-slate-400 text-xs">
                  {getAssigneeName(lead)}
                </td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">
                  {formatDate(lead.createdAt)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/leads/${lead._id}/edit`}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1e2d4d] text-slate-400 transition-colors hover:border-blue-500/40 hover:text-blue-400"
                      title="Edit"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </Link>

                    {can("lead:delete") &&
                      (confirmId === lead._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onDelete(lead._id);
                              setConfirmId(null);
                            }}
                            disabled={isDeleting === lead._id}
                            className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-500 disabled:opacity-50"
                          >
                            {isDeleting === lead._id ? "…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-md border border-[#1e2d4d] px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(lead._id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1e2d4d] text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-400"
                          title="Delete"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {leads.map((lead) => (
          <div key={lead._id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  to={`/leads/${lead._id}/edit`}
                  className="font-semibold text-slate-200 hover:text-blue-400"
                >
                  {lead.name}
                </Link>
                {lead.email && (
                  <p className="mt-0.5 text-xs text-slate-500">{lead.email}</p>
                )}
                <p className="text-xs font-mono text-slate-600">{lead.phone}</p>
              </div>
              <StatusBadge status={lead.status} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2">
                <SourceBadge source={lead.source} />
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/leads/${lead._id}/edit`}
                  className="btn-secondary text-xs py-1.5 px-2.5"
                >
                  Edit
                </Link>
                {can("lead:delete") && (
                  <button
                    onClick={() => onDelete(lead._id)}
                    disabled={isDeleting === lead._id}
                    className="btn-danger text-xs py-1.5 px-2.5"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
