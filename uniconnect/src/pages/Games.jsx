import { useEffect, useMemo, useState } from "react";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { Gamepad2, Lightbulb, Sparkles, Theater } from "lucide-react";
import { firebase, firebaseReady } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { localDateKey } from "../utils/dateKey.js";
import { scenarioForWeek } from "../constants/scenarios.js";
import { COL } from "../models/firestorePaths.js";

const LABELS = ["A", "B", "C", "D", "E"];

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Games() {
  const [tab, setTab] = useState("puzzle");
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/40 to-slate-950 p-4 ring-1 ring-fuchsia-500/20">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-fuchsia-300" />
          <h1 className="text-lg font-bold text-white">Oyunlar</h1>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Günün tapmacası və həftəlik rol oyunu — dinamik sosial təcrübə.
        </p>
      </div>

      <div className="flex gap-2 rounded-xl bg-slate-900 p-1 ring-1 ring-slate-800">
        <button
          type="button"
          onClick={() => setTab("puzzle")}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold ${
            tab === "puzzle"
              ? "bg-fuchsia-500/25 text-fuchsia-100 ring-1 ring-fuchsia-400/40"
              : "text-slate-400"
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          Tapmaca
        </button>
        <button
          type="button"
          onClick={() => setTab("role")}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold ${
            tab === "role"
              ? "bg-fuchsia-500/25 text-fuchsia-100 ring-1 ring-fuchsia-400/40"
              : "text-slate-400"
          }`}
        >
          <Theater className="h-3.5 w-3.5" />
          Rol oyunu
        </button>
      </div>

      {tab === "puzzle" && <DailyPuzzle />}
      {tab === "role" && <RoleplayPanel />}
    </div>
  );
}

function RoleplayPanel() {
  const sc = useMemo(() => scenarioForWeek(), []);
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="text-base font-semibold text-white">{sc.title}</h2>
      <p className="text-sm text-slate-400">{sc.blurb}</p>
      <div>
        <p className="mb-2 text-xs font-bold uppercase text-fuchsia-300/90">
          Buzqıran suallar
        </p>
        <ul className="space-y-2">
          {sc.icebreakers.map((q, i) => (
            <li
              key={i}
              className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
            >
              {q}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/frekans"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 hover:bg-fuchsia-500/20"
        >
          Kampus Frekansında buzqıranı sınayın
        </Link>
        <Link
          to="/explore"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500/40"
        >
          Explore-da dost tap
        </Link>
      </div>
      <p className="text-[11px] text-slate-500">
        Ssenari hər həftə dəyişir — bu suallarla anonim və ya şəxsi çatda
        söhbətə başlayın.
      </p>
    </div>
  );
}

function DailyPuzzle() {
  const { user, profile, refreshProfile } = useAuth();
  const dateKey = useMemo(() => localDateKey(), []);
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function ensurePuzzle() {
    if (!firebaseReady || !firebase || !user) return;
    setLoading(true);
    try {
      const ref = doc(firebase.db, COL.DAILY_PUZZLES, dateKey);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPuzzle({ id: snap.id, ...snap.data() });
        return;
      }
      const poolQ = query(collection(firebase.db, COL.USERS), limit(80));
      const poolSnap = await getDocs(poolQ);
      const ids = poolSnap.docs.map((d) => d.id).filter((id) => id !== user.uid);
      if (ids.length < 5) {
        setPuzzle(null);
        return;
      }
      const subjectUid = ids[Math.floor(Math.random() * ids.length)];
      const others = shuffle(ids.filter((id) => id !== subjectUid)).slice(0, 4);
      const choiceUids = shuffle([subjectUid, ...others]);
      const subSnap = await getDoc(doc(firebase.db, COL.USERS, subjectUid));
      const sub = subSnap.exists() ? subSnap.data() : {};
      const hobbyStr = (sub.hobbies || []).slice(0, 2).join(", ") || "—";
      const payload = {
        subjectUid,
        choiceUids,
        clueMajor: sub.major || "İxtisas gizlidir",
        clueHobby: hobbyStr,
        clueCity: sub.city || sub.university || "Şəhər/kampus gizlidir",
        winners: [],
        createdAt: serverTimestamp(),
      };
      try {
        await setDoc(ref, payload);
      } catch {
        const again = await getDoc(ref);
        if (again.exists()) {
          setPuzzle({ id: again.id, ...again.data() });
          return;
        }
        throw new Error("Tapmaca yaradılmadı");
      }
      setPuzzle({ id: dateKey, ...payload });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ensurePuzzle();
  }, [user, dateKey]);

  async function pick(uid) {
    if (!puzzle || !user || !firebaseReady || !firebase) return;
    if ((puzzle.winners || []).includes(user.uid)) {
      setMsg("Bu gün artıq qazandın!");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      if (uid === puzzle.subjectUid) {
        await updateDoc(doc(firebase.db, COL.DAILY_PUZZLES, dateKey), {
          winners: arrayUnion(user.uid),
        });
        await updateDoc(doc(firebase.db, COL.USERS, user.uid), {
          puzzleWins: increment(1),
          puzzleBoost: true,
        });
        await refreshProfile?.();
        setMsg("Düzgün! Profilində «Tapmaca qalib» boost aktivləşdi.");
        await ensurePuzzle();
      } else {
        setMsg("Yaxın, amma deyil — yenidən cəhd et.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseReady || !firebase) {
    return <p className="text-sm text-slate-400">Firebase aktiv deyil.</p>;
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-400">
        Tapmaca yüklənir…
      </p>
    );
  }

  if (!puzzle) {
    return (
      <p className="text-sm text-slate-500">
        Tapmaca üçün kifayət qədər profil yoxdur.
      </p>
    );
  }

  const won = (puzzle.winners || []).includes(user?.uid);
  const wins = profile?.puzzleWins ?? 0;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-300" />
        <h2 className="text-base font-semibold text-white">Günün tapmacası</h2>
        <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
          {dateKey}
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Bu tələbə kimdir? Ad yoxdur — yalnız 3 ipucu. Düzgün seçəndə virtual
        nişan + boost.
      </p>
      <ul className="space-y-2 text-sm text-slate-200">
        <li>
          <span className="text-fuchsia-400">İxtisas / istiqamət:</span>{" "}
          {puzzle.clueMajor}
        </li>
        <li>
          <span className="text-fuchsia-400">Maraq:</span> {puzzle.clueHobby}
        </li>
        <li>
          <span className="text-fuchsia-400">Şəhər / kampus:</span>{" "}
          {puzzle.clueCity}
        </li>
      </ul>
      <p className="text-[11px] text-slate-500">
        Ümumi qələbə sayın: <strong className="text-white">{wins}</strong>
        {profile?.puzzleBoost && (
          <span className="ml-2 text-amber-300">· Tapmaca boost aktiv</span>
        )}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(puzzle.choiceUids || []).map((uid, i) => (
          <button
            key={uid}
            type="button"
            disabled={busy || won}
            onClick={() => pick(uid)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-left text-sm font-medium text-slate-100 transition hover:border-fuchsia-500/50 hover:bg-slate-900 disabled:opacity-40"
          >
            Seçim {LABELS[i] || i + 1}
          </button>
        ))}
      </div>
      {won && (
        <p className="text-sm font-medium text-emerald-300">
          Bu günün tapmacasını artıq həll etmisən.
        </p>
      )}
      {msg && <p className="text-sm text-amber-100">{msg}</p>}
    </div>
  );
}
