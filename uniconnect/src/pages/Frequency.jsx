import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { Loader2, Radio, Send } from "lucide-react";
import { firebase, firebaseReady } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { universityToCampusSlug } from "../utils/campusSlug.js";
import { anonNicknameFromSeed } from "../utils/anonNickname.js";
import { COL } from "../models/firestorePaths.js";

export default function Frequency() {
  const { user, profile } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const slug = useMemo(
    () => universityToCampusSlug(profile?.university || ""),
    [profile?.university],
  );

  const nickname = useMemo(
    () => anonNicknameFromSeed(`${user?.uid || "x"}-${slug}`),
    [user?.uid, slug],
  );

  useEffect(() => {
    if (!firebaseReady || !firebase || !user) return;
    const mq = query(
      collection(firebase.db, COL.CAMPUS_MESSAGES, slug, "messages"),
      orderBy("createdAt", "desc"),
      limit(80),
    );
    const unsub = onSnapshot(mq, (snap) => {
      setMsgs(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse(),
      );
    });
    return () => unsub();
  }, [firebaseReady, user, slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  async function onSend(e) {
    e.preventDefault();
    if (!firebaseReady || !firebase || !user || !text.trim()) return;
    setSending(true);
    try {
      await addDoc(
        collection(firebase.db, COL.CAMPUS_MESSAGES, slug, "messages"),
        {
          text: text.trim().slice(0, 500),
          nickname,
          universitySlug: slug,
          createdAt: serverTimestamp(),
        },
      );
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (!firebaseReady || !firebase) {
    return (
      <p className="text-sm text-slate-400">Firebase aktiv deyil.</p>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-4">
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-slate-950 p-4 ring-1 ring-violet-500/20">
        <div className="flex items-center gap-2">
          <Radio className="h-6 w-6 text-violet-300" />
          <div>
            <h1 className="text-lg font-bold text-white">Kampus Frekansı</h1>
            <p className="text-xs text-violet-200/80">
              Anonim · {profile?.university || "Universitet seçilməyib"} (
              <span className="font-mono text-[10px]">{slug}</span>)
            </p>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Ad və şəkil yoxdur — yalnız ləqəb ilə canlı yazışma. Hörmətli ol.
        </p>
      </div>

      <div className="min-h-[280px] flex-1 space-y-2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
        {msgs.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            Hələ mesaj yoxdur — ilk sən yaz!
          </p>
        )}
        {msgs.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2"
          >
            <p className="text-[11px] font-semibold text-violet-300">
              {m.nickname || "Anonim"}
            </p>
            <p className="text-sm text-slate-100">{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSend}
        className="flex gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-2"
      >
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-500/50"
          placeholder="Mesajın…"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
