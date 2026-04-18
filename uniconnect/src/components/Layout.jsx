import { Link, NavLink } from "react-router-dom";
import {
  Compass,
  Gamepad2,
  Mail,
  MessageCircle,
  Radio,
  Shield,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const linkClass =
  "flex min-w-[4.25rem] shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold text-slate-400 transition hover:text-white sm:min-w-[4.75rem] sm:text-xs";
const activeClass =
  "bg-gradient-to-br from-emerald-500/25 to-violet-500/20 text-emerald-200 ring-1 ring-emerald-400/40";

export function Layout({ children }) {
  const { isAdmin } = useAuth();
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-3xl flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pb-28 sm:max-w-4xl lg:max-w-6xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-emerald-500/10 to-transparent" />
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/85 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400/90">
              UniConnect
            </p>
            <p className="text-sm font-medium text-slate-300">
              Kampus · dostluq · oyun
            </p>
          </div>
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/25"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </div>
      </header>
      <main className="relative z-0 flex-1 px-4 py-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl justify-start gap-0.5 overflow-x-auto px-2 py-2 sm:max-w-4xl sm:justify-center lg:max-w-6xl">
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
          >
            <Compass className="h-5 w-5 shrink-0" />
            Explore
          </NavLink>
          <NavLink
            to="/frekans"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
          >
            <Radio className="h-5 w-5 shrink-0" />
            Frekans
          </NavLink>
          <NavLink
            to="/mektublar"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
          >
            <Mail className="h-5 w-5 shrink-0" />
            Məktublar
          </NavLink>
          <NavLink
            to="/oyunlar"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
          >
            <Gamepad2 className="h-5 w-5 shrink-0" />
            Oyunlar
          </NavLink>
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            Çat
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
          >
            <User className="h-5 w-5 shrink-0" />
            Profil
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
