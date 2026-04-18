import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { Heart, Mail, Search, Sparkles } from "lucide-react";
import { firebase, firebaseReady } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { UNIVERSITIES } from "../constants/universities.js";
import { localDateKey } from "../utils/dateKey.js";
import { COL } from "../models/firestorePaths.js";

function byLetterDate(a, b) {
  const ta = a.createdAt?.seconds || 0;
  const tb = b.createdAt?.seconds || 0;
  return tb - ta;
}

function overlapHobbies(a = [], b = []) {
  const setB = new Set((b || []).map((x) => x.toLowerCase()));
  return (a || []).filter((h) => setB.has(h.toLowerCase()));
}

export default function Explore() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [letterInbox, setLetterInbox] = useState([]);
  const [uni, setUni] = useState("");
  const [major, setMajor] = useState("");
  const [hobby, setHobby] = useState("");
  const [qText, setQText] = useState("");

  useEffect(() => {
    if (!user || !firebaseReady || !firebase) {
      setLetterInbox([]);
      return;
    }
    const qL = query(
      collection(firebase.db, COL.LETTERS),
      where("recipientUids", "array-contains", user.uid),
      limit(12),
    );
    const unsub = onSnapshot(
      qL,
      (snap) => {
        setLetterInbox(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byLetterDate),
        );
      },
      () => setLetterInbox([]),
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !firebaseReady || !firebase) {
        setStudents([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const col = collection(firebase.db, COL.USERS);
        const snap = await getDocs(query(col, limit(80)));
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((row) => row.id !== user.uid);
        if (!cancelled) setStudents(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = useMemo(() => {
    const qt = qText.trim().toLowerCase();
    return students.filter((s) => {
      if (uni && s.university !== uni) return false;
      if (major && !(s.major || "").toLowerCase().includes(major.toLowerCase()))
        return false;
      if (hobby) {
        const hs = (s.hobbies || []).map((h) => h.toLowerCase());
        if (!hs.some((h) => h.includes(hobby.toLowerCase()))) return false;
      }
      if (!qt) return true;
      const blob = [
        s.firstName,
        s.lastName,
        s.university,
        s.major,
        ...(s.hobbies || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(qt);
    });
  }, [students, uni, major, hobby, qText]);

  const dkToday = localDateKey();

  const sameMoodPeers = useMemo(() => {
    const dk = localDateKey();
    const m = profile?.todayMood;
    if (!m || profile?.todayMoodDate !== dk) return [];
    return students.filter((s) => s.todayMood === m && s.todayMoodDate === dk);
  }, [students, profile]);

  return (
    <div className="space-y-5">
      {!firebaseReady && (
        <p className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
          Məlumatlar yüklənməsi üçün Firebase .env faylını tamamlayın.
        </p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Explore</h2>
          <p className="text-sm text-slate-400">
            Ana səhifə — məktublar, emosiya uyumu və tələbə kəşfi.
          </p>
        </div>
        <div className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200 sm:block">
          Mobile-first
        </div>
      </div>

      {letterInbox.length > 0 && (
        <div className="rounded-2xl border border-sky-500/45 bg-gradient-to-r from-sky-950/55 to-indigo-950/40 p-4 ring-1 ring-sky-400/25">
          <div className="mb-2 flex items-center gap-2 text-sky-200">
            <Mail className="h-4 w-4" />
            <h3 className="text-sm font-semibold text-white">
              Sənə bir məktub var
            </h3>
            <span className="ml-auto rounded-full bg-sky-500/20 px-2 py-0.5 text-[11px] font-bold text-sky-100">
              {letterInbox.length}
            </span>
          </div>
          <p className="mb-3 text-xs text-sky-100/85">
            Anonim göndərici — cavabları Məktublar bölməsində yaz.
          </p>
          <ul className="mb-3 space-y-2">
            {letterInbox.slice(0, 3).map((L) => (
              <li
                key={L.id}
                className="line-clamp-2 rounded-xl border border-sky-500/25 bg-slate-950/50 px-3 py-2 text-xs text-slate-200"
              >
                {L.body}
              </li>
            ))}
          </ul>
          <Link
            to="/mektublar"
            className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-sky-950 hover:bg-sky-400"
          >
            Məktublara keç
          </Link>
        </div>
      )}

      {sameMoodPeers.length > 0 && (
        <div className="rounded-2xl border border-pink-500/40 bg-gradient-to-r from-pink-950/50 to-violet-950/40 p-4 ring-1 ring-pink-500/25">
          <div className="mb-2 flex items-center gap-2 text-pink-200">
            <Heart className="h-4 w-4 fill-pink-400/30" />
            <h3 className="text-sm font-semibold text-white">
              Səninlə eyni hiss edən tələbələr
            </h3>
          </div>
          <p className="mb-3 text-xs text-pink-100/80">
            Bu gün eyni emosiya nişanını seçənlər — bir-birinizi daha yaxşı
            başa düşə bilərsiniz.
          </p>
          <div className="flex flex-wrap gap-2">
            {sameMoodPeers.slice(0, 8).map((s) => (
              <Link
                key={s.id}
                to={`/profile/${s.id}`}
                className="rounded-full border border-pink-400/50 bg-pink-500/15 px-3 py-1 text-xs font-medium text-pink-50 hover:bg-pink-500/25"
              >
                {s.firstName} {s.lastName}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Ad, universitet və ya maraq ilə axtar…"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm outline-none ring-emerald-500/30 focus:border-emerald-500/50 focus:ring"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] text-slate-500">
              Universitet
            </label>
            <select
              value={uni}
              onChange={(e) => setUni(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-sm outline-none focus:border-emerald-500/50"
            >
              <option value="">Hamısı</option>
              {UNIVERSITIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-500">
              İxtisas
            </label>
            <input
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="Məs: İnformatika"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-sm outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-500">Maraq</label>
            <input
              value={hobby}
              onChange={(e) => setHobby(e.target.value)}
              placeholder="Məs: Musiqi"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-sm outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Tələbələr yüklənir…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((s) => {
            const shared = overlapHobbies(profile?.hobbies, s.hobbies);
            const moodPeer =
              profile?.todayMood &&
              profile?.todayMoodDate === dkToday &&
              s.todayMood === profile.todayMood &&
              s.todayMoodDate === dkToday;
            return (
              <Link
                key={s.id}
                to={`/profile/${s.id}`}
                className={`group flex gap-3 rounded-2xl border bg-gradient-to-br from-slate-900/90 to-slate-950 p-4 transition hover:shadow-lg ${
                  moodPeer
                    ? "border-pink-500/60 ring-2 ring-pink-500/30 hover:border-pink-400/80"
                    : "border-slate-800 hover:border-emerald-500/40 hover:shadow-emerald-500/10"
                }`}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-slate-700">
                  {s.photoURL ? (
                    <img
                      src={s.photoURL}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-300">
                      {(s.firstName || "?").slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-white group-hover:text-emerald-100">
                      {s.firstName} {s.lastName}
                    </p>
                    {s.verifiedStudent && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                        Təsdiqli
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    {s.university || "Universitet seçilməyib"}
                    {s.course ? ` · ${s.course}. kurs` : ""}
                  </p>
                  {shared.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-[11px] text-emerald-200">
                      <Sparkles className="h-3 w-3" />
                      <span className="font-medium">Ortaq maraq:</span>
                      {shared.slice(0, 3).join(", ")}
                      {shared.length > 3 ? "…" : ""}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400">
              Uyğun tələbə tapılmadı — filtrləri dəyiş və ya sonra yenidən
              yoxla.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
