import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { Loader2, Mail, Send } from "lucide-react";
import { firebase, firebaseReady } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { COL } from "../models/firestorePaths.js";

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Letters() {
  const { user } = useAuth();
  const [tab, setTab] = useState("inbox");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!firebaseReady || !firebase || !user) return;
    setLoading(true);
    try {
      const qIn = query(
        collection(firebase.db, COL.LETTERS),
        where("recipientUids", "array-contains", user.uid),
        limit(40),
      );
      const qOut = query(
        collection(firebase.db, COL.LETTERS),
        where("authorUid", "==", user.uid),
        limit(40),
      );
      const [inSnap, outSnap] = await Promise.all([getDocs(qIn), getDocs(qOut)]);
      setInbox(
        inSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byDate),
      );
      setSent(
        outSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byDate),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [user]);

  async function sendLetter(e) {
    e.preventDefault();
    if (!firebaseReady || !firebase || !user || !body.trim()) return;
    setBusy(true);
    try {
      const pool = query(collection(firebase.db, COL.USERS), limit(120));
      const snap = await getDocs(pool);
      const ids = snap.docs
        .map((d) => d.id)
        .filter((id) => id !== user.uid);
      const pick = shuffle(ids).slice(0, 3);
      if (pick.length < 3) {
        window.alert(
          "Kifayət qədər istifadəçi yoxdur — bir az sonra yenidən cəhd edin.",
        );
        return;
      }
      await addDoc(collection(firebase.db, COL.LETTERS), {
        body: body.trim().slice(0, 4000),
        authorUid: user.uid,
        recipientUids: pick,
        createdAt: serverTimestamp(),
      });
      setBody("");
      await refresh();
      setTab("sent");
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseReady || !firebase) {
    return <p className="text-sm text-slate-400">Firebase aktiv deyil.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/50 to-slate-950 p-4 ring-1 ring-sky-500/20">
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-sky-300" />
          <h1 className="text-lg font-bold text-white">Tələbə məktubu</h1>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Anonim məktub — təsadüfi 3 tələbəyə. Cavablar ayrıca saxlanılır.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-900 p-1 ring-1 ring-slate-800">
        {[
          { id: "inbox", label: "Gələnlər" },
          { id: "write", label: "Məktub yaz" },
          { id: "sent", label: "Göndərilənlər" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-sky-500/25 text-sky-100 ring-1 ring-sky-400/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "write" && (
        <form
          onSubmit={sendLetter}
          className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
        >
          <label className="block text-xs text-slate-400">
            Dərdin, sualın və ya motivasiya (anonim göndərilir)
          </label>
          <textarea
            className="min-h-[140px] w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500/50"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-sky-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Göndər (3 nəfərə)
          </button>
        </form>
      )}

      {tab === "inbox" && (
        <div className="space-y-3">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Yüklənir…
            </p>
          )}
          {!loading && inbox.length === 0 && (
            <p className="text-sm text-slate-500">Hələ məktub yoxdur.</p>
          )}
          {inbox.map((L) => (
            <LetterCard key={L.id} letter={L} mode="inbox" onChanged={refresh} />
          ))}
        </div>
      )}

      {tab === "sent" && (
        <div className="space-y-3">
          {sent.map((L) => (
            <LetterCard key={L.id} letter={L} mode="sent" onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function byDate(a, b) {
  const ta = a.createdAt?.seconds || 0;
  const tb = b.createdAt?.seconds || 0;
  return tb - ta;
}

function LetterCard({ letter, mode, onChanged }) {
  const { user } = useAuth();
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!firebaseReady || !firebase || !letter?.id) return;
    const q = query(
      collection(firebase.db, COL.LETTERS, letter.id, "replies"),
      orderBy("createdAt", "asc"),
      limit(50),
    );
    const unsub = onSnapshot(q, (snap) => {
      setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [letter?.id, firebaseReady]);

  async function addReply() {
    const t = replyText.trim();
    if (!t || !firebaseReady || !firebase || !user) return;
    await addDoc(
      collection(firebase.db, COL.LETTERS, letter.id, "replies"),
      {
        authorUid: user.uid,
        text: t.slice(0, 2000),
        createdAt: serverTimestamp(),
      },
    );
    setReplyText("");
    onChanged?.();
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      {mode === "inbox" && (
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-200">
          Sənə bir məktub var
        </p>
      )}
      {mode === "sent" && (
        <p className="mb-2 text-xs text-slate-500">Göndərilib</p>
      )}
      <p className="whitespace-pre-wrap text-sm text-slate-100">{letter.body}</p>
      {replies.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
          <p className="text-[11px] font-semibold text-slate-500">Cavablar</p>
          {replies.map((r) => (
            <div
              key={r.id}
              className="rounded-lg bg-slate-950/80 px-2 py-1.5 text-xs text-slate-300"
            >
              {r.text}
            </div>
          ))}
        </div>
      )}
      {mode === "inbox" && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500/50"
            placeholder="Cavab yaz…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button
            type="button"
            onClick={addReply}
            className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
          >
            Cavabla
          </button>
        </div>
      )}
    </div>
  );
}
