import { Link, Navigate } from "react-router-dom";
import { ExternalLink, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Admin() {
  const { isAdmin, user } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "";
  const consoleUsers = projectId
    ? `https://console.firebase.google.com/project/${projectId}/authentication/users`
    : "https://console.firebase.google.com/";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-400/50">
          <Shield className="h-5 w-5 text-amber-200" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Admin paneli</h1>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
      </div>

      <p className="text-sm text-slate-400">
        Bu səhifə yalnız <code className="rounded bg-slate-900 px-1">.env</code>{" "}
        faylında <code className="rounded bg-slate-900 px-1">VITE_ADMIN_EMAILS</code>{" "}
        siyahısında olan e-poçt üçün açılır. İstifadəçi silmə / rol vermə kimi
        kritik əməliyyatlar üçün Firebase Console istifadə edin.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={consoleUsers}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white hover:border-amber-500/50"
        >
          Firebase — Authentication
          <ExternalLink className="h-4 w-4 opacity-70" />
        </a>
        <Link
          to="/explore"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
        >
          Explore
        </Link>
        <Link
          to="/profile"
          className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
        >
          Profilim
        </Link>
      </div>
    </div>
  );
}
