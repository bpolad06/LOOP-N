import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { firebase, firebaseReady } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { chatIdForPair } from "../utils/student.js";

export default function Chat() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [edges, setEdges] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user || !firebaseReady || !firebase) {
      setEdges([]);
      setLoadingFriends(false);
      return;
    }
    let cancelled = false;
    async function loadEdges() {
      setLoadingFriends(true);
      try {
        const q = query(
          collection(firebase.db, "friendEdges"),
          where("participants", "array-contains", user.uid),
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!cancelled) setEdges(rows.filter((e) => e.status === "accepted"));
      } finally {
        if (!cancelled) setLoadingFriends(false);
      }
    }
    loadEdges();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function hydrateFriends() {
      if (!user || edges.length === 0) {
        setFriends([]);
        return;
      }
      const others = edges.map((e) =>
        e.participants.find((p) => p !== user.uid),
      );
      const uniq = [...new Set(others)];
      const out = [];
      for (const uid of uniq) {
        const snap = await getDoc(doc(firebase.db, "users", uid));
        if (snap.exists()) {
          out.push({ id: snap.id, ...snap.data() });
        }
      }
      if (!cancelled) setFriends(out);
    }
    hydrateFriends();
    return () => {
      cancelled = true;
    };
  }, [edges, user]);

  const activeFriend = useMemo(
    () => friends.find((f) => f.id === friendId) || null,
    [friends, friendId],
  );

  useEffect(() => {
    if (!user || !friendId || !firebaseReady || !firebase) {
      setMessages([]);
      return;
    }
    const cid = chatIdForPair(user.uid, friendId);
    const mq = query(
      collection(firebase.db, "chats", cid, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );
    const unsub = onSnapshot(mq, (snap) => {
      setMessages(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })),
      );
    });
    return () => unsub();
  }, [user, friendId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, friendId]);

  async function onSend(e) {
    e.preventDefault();
    if (!user || !friendId || !text.trim() || !firebaseReady || !firebase)
      return;
    const accepted = edges.some(
      (e) =>
        e.status === "accepted" &&
        e.participants.includes(user.uid) &&
        e.participants.includes(friendId),
    );
    if (!accepted) return;
    setSending(true);
    try {
      const cid = chatIdForPair(user.uid, friendId);
      await addDoc(collection(firebase.db, "chats", cid, "messages"), {
        senderId: user.uid,
        text: text.trim(),
        participants: [user.uid, friendId].sort(),
        createdAt: serverTimestamp(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex min-h-[70vh] flex-col gap-4">
      {!firebaseReady && (
        <p className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
          Çat üçün Firebase .env faylını tamamlayın.
        </p>
      )}
      <div>
        <h2 className="text-lg font-semibold text-white">Çat</h2>
        <p className="text-sm text-slate-400">
          Yalnız qəbul olunmuş dostlarla real-time mesajlaşma.
        </p>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[260px,minmax(0,1fr)]">
        <aside className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Dostlar
          </p>
          {loadingFriends && (
            <p className="flex items-center gap-2 px-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Yüklənir…
            </p>
          )}
          {!loadingFriends && friends.length === 0 && (
            <p className="px-2 text-sm text-slate-500">
              Hələ qəbul olunmuş dostun yoxdur.{" "}
              <Link className="text-emerald-300 underline" to="/explore">
                Explore
              </Link>
            </p>
          )}
          <ul className="space-y-1">
            {friends.map((f) => {
              const active = f.id === friendId;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/chat/${f.id}`)}
                    className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition ${
                      active
                        ? "bg-emerald-500/15 text-emerald-50 ring-1 ring-emerald-400/50"
                        : "text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-800">
                      {f.photoURL ? (
                        <img
                          src={f.photoURL}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold">
                          {(f.firstName || "?").slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {f.firstName} {f.lastName}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {f.university}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex min-h-[420px] flex-col rounded-2xl border border-slate-800 bg-slate-900/40">
          {!friendId && (
            <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-slate-500">
              Söhbətə başlamaq üçün soldan dost seç.
            </div>
          )}
          {friendId && (
            <>
              <header className="flex items-center gap-3 border-b border-slate-800 px-3 py-3">
                <button
                  type="button"
                  onClick={() => navigate("/chat")}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-800">
                  {activeFriend?.photoURL ? (
                    <img
                      src={activeFriend.photoURL}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-300">
                      {(activeFriend?.firstName || "?").slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {activeFriend
                      ? `${activeFriend.firstName} ${activeFriend.lastName}`
                      : "Dost"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {activeFriend?.university || "—"}
                  </p>
                </div>
                <Link
                  to={`/profile/${friendId}`}
                  className="text-xs font-medium text-emerald-300 hover:underline"
                >
                  Profilə bax
                </Link>
              </header>
              <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-slate-500">
                    Hələ mesaj yoxdur — salam de!
                  </p>
                )}
                {messages.map((m) => {
                  const mine = m.senderId === user.uid;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? "bg-emerald-500 text-emerald-950"
                            : "bg-slate-800 text-slate-100"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form
                onSubmit={onSend}
                className="flex items-center gap-2 border-t border-slate-800 p-3"
              >
                <input
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                  placeholder={
                    edges.some(
                      (e) =>
                        e.status === "accepted" &&
                        e.participants.includes(friendId),
                    )
                      ? "Mesaj yaz…"
                      : "Əvvəlcə dostluğu qəbul et"
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={
                    !edges.some(
                      (e) =>
                        e.status === "accepted" &&
                        e.participants.includes(friendId),
                    ) || sending
                  }
                />
                <button
                  type="submit"
                  disabled={
                    sending ||
                    !text.trim() ||
                    !edges.some(
                      (e) =>
                        e.status === "accepted" &&
                        e.participants.includes(friendId),
                    )
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-40"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {!friendId && profile && (
        <p className="text-center text-[11px] text-slate-600">
          Daxil olmuş hesab: {profile.firstName} {profile.lastName}
        </p>
      )}
    </div>
  );
}
