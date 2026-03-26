import { LoginForm } from "../components/Auth/LoginForm";

export const LoginPage = () => (
  <div className="flex min-h-full items-center justify-center bg-[#0a0f1e] px-4 py-16">
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Access your CRM+ workspace
        </p>
      </div>

      <div className="card p-6 shadow-2xl shadow-black/40">
        <LoginForm />
      </div>
    </div>
  </div>
);
