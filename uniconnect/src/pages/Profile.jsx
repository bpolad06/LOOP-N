import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { COL } from "../models/firestorePaths.js";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  BadgeCheck,
  Camera,
  Heart,
  Loader2,
  LogOut,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { firebase, firebaseReady } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { UNIVERSITIES, HOBBY_SUGGESTIONS } from "../constants/universities.js";
import { isVerifiedStudentEmail } from "../utils/student.js";
import { pairId } from "../utils/friends.js";
import { localDateKey } from "../utils/dateKey.js";

function hobbyOverlapLower(viewerHobbies = [], targetHobbies = []) {
  const v = new Set((viewerHobbies || []).map((x) => x.toLowerCase()));
  const out = new Set();
  for (const th of targetHobbies || []) {
    if (v.has(String(th).toLowerCase())) out.add(String(th).toLowerCase());
  }
  return out;
}

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const {
    user,
    profile,
    isAdmin,
    logout,
    upsertUserDocument,
    refreshProfile,
  } = useAuth();

  const isSelf = !userId || userId === user?.uid;
  const [target, setTarget] = useState(null);
  const [edge, setEdge] = useState(null);
  const [loadingTarget, setLoadingTarget] = useState(!isSelf);
  const [saving, setSaving] = useState(false);
  const [friendBusy, setFriendBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    course: "",
    university: "",
    major: "",
    hobbies: [],
    hobbyInput: "",
    photoURL: "",
    city: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      age: profile.age ?? "",
      course: profile.course ?? "",
      university: profile.university || "",
      major: profile.major || "",
      hobbies: profile.hobbies || [],
      photoURL: profile.photoURL || user?.photoURL || "",
      city: profile.city || "",
    }));
  }, [profile, user]);

  useEffect(() => {
    let cancelled = false;
    async function loadOther() {
      if (!user || isSelf) {
        setLoadingTarget(false);
        return;
      }
      if (!firebaseReady || !firebase) {
        setTarget(null);
        setEdge(null);
        setLoadingTarget(false);
        return;
      }
      setLoadingTarget(true);
      try {
        const refDoc = doc(firebase.db, COL.USERS, userId);
        const snap = await getDoc(refDoc);
        if (!cancelled) {
          setTarget(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        }
        const pid = pairId(user.uid, userId);
        const eSnap = await getDoc(doc(firebase.db, "friendEdges", pid));
        if (!cancelled) {
          setEdge(eSnap.exists() ? { id: eSnap.id, ...eSnap.data() } : null);
        }
      } finally {
        if (!cancelled) setLoadingTarget(false);
      }
    }
    loadOther();
    return () => {
      cancelled = true;
    };
  }, [user, userId, isSelf]);

  const sharedHobbies = useMemo(() => {
    if (!isSelf && profile && target) {
      return hobbyOverlapLower(profile.hobbies, target.hobbies);
    }
    return new Set();
  }, [isSelf, profile, target]);

  const sameUniversity =
    !isSelf &&
    profile?.university &&
    target?.university &&
    profile.university === target.university;

  async function onSaveProfile(e) {
    e.preventDefault();
    if (!user || !firebaseReady || !firebase) return;
    setSaving(true);
    try {
      await upsertUserDocument(user, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        age: form.age === "" ? null : Number(form.age),
        course: form.course === "" ? null : Number(form.course),
        university: form.university,
        major: form.major.trim(),
        hobbies: form.hobbies,
        photoURL: form.photoURL || "",
        city: form.city.trim(),
        verifiedStudent: isVerifiedStudentEmail(user.email || ""),
      });
    } finally {
      setSaving(false);
    }
  }

  async function onPhoto(file) {
    if (!file || !user || !firebaseReady || !firebase) return;
    setSaving(true);
    try {
      const storageRef = ref(firebase.storage, `profiles/${user.uid}/avatar`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((f) => ({ ...f, photoURL: url }));
      await updateDoc(doc(firebase.db, COL.USERS, user.uid), {
        photoURL: url,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  }

  function toggleHobby(tag) {
    setForm((f) => {
      const exists = f.hobbies.includes(tag);
      return {
        ...f,
        hobbies: exists
          ? f.hobbies.filter((h) => h !== tag)
          : [...f.hobbies, tag],
      };
    });
  }

  function addCustomHobby() {
    const v = form.hobbyInput.trim();
    if (!v) return;
    setForm((f) =>
      f.hobbies.includes(v)
        ? { ...f, hobbyInput: "" }
        : { ...f, hobbies: [...f.hobbies, v], hobbyInput: "" },
    );
  }

  async function sendFriendRequest() {
    if (!user || !target || !firebaseReady || !firebase) return;
    setFriendBusy(true);
    try {
      const id = pairId(user.uid, target.id);
      const refEdge = doc(firebase.db, "friendEdges", id);
      const existing = await getDoc(refEdge);
      if (!existing.exists()) {
        await setDoc(refEdge, {
          participants: [user.uid, target.id].sort(),
          status: "pending",
          requester: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const data = existing.data();
        if (data.status === "declined" || data.status === "none") {
          await updateDoc(refEdge, {
            status: "pending",
            requester: user.uid,
            updatedAt: serverTimestamp(),
          });
        }
      }
      const snap = await getDoc(refEdge);
      setEdge({ id: snap.id, ...snap.data() });
    } finally {
      setFriendBusy(false);
    }
  }

  async function acceptFriendRequest() {
    if (!user || !target || !firebaseReady || !firebase) return;
    setFriendBusy(true);
    try {
      const id = pairId(user.uid, target.id);
      const refEdge = doc(firebase.db, "friendEdges", id);
      await updateDoc(refEdge, {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(refEdge);
      setEdge({ id: snap.id, ...snap.data() });
    } finally {
      setFriendBusy(false);
    }
  }

  if (!user) return null;

  if (!isSelf && loadingTarget) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Profil yüklənir…
      </div>
    );
  }

  if (!isSelf && !target) {
    return (
      <div className="space-y-3 text-sm text-slate-300">
        <p>İstifadəçi tapılmadı.</p>
        <Link
          to="/explore"
          className="text-emerald-300 underline-offset-2 hover:underline"
        >
          Explore-ə qayıt
        </Link>
      </div>
    );
  }

  const display = isSelf ? { id: user.uid, ...profile } : target;
  const verified = Boolean(display?.verifiedStudent);

  const friendStatus = edge?.status;
  const requesterIsMe = edge?.requester === user.uid;
  const isFriend = friendStatus === "accepted";
  const pendingInbound =
    friendStatus === "pending" && edge?.requester === target?.id;
  const pendingOutbound =
    friendStatus === "pending" && requesterIsMe && edge?.requester === user.uid;

  const dk = localDateKey();
  const sameMood =
    !isSelf &&
    profile?.todayMood &&
    profile?.todayMoodDate === dk &&
    target?.todayMood === profile.todayMood &&
    target?.todayMoodDate === dk;

  function lonelinessScoreForMood(emoji) {
    if (emoji === "😔") return 3;
    if (emoji === "😐") return 2;
    return 1;
  }

  async function saveMood(emoji) {
    if (!user || !firebaseReady || !firebase) return;
    const lonelinessScore = lonelinessScoreForMood(emoji);
    await updateDoc(doc(firebase.db, COL.USERS, user.uid), {
      todayMood: emoji,
      todayMoodDate: dk,
      lonelinessScore,
      updatedAt: serverTimestamp(),
    });
    await setDoc(
      doc(firebase.db, COL.MOODS, user.uid, "entries", dk),
      {
        userId: user.uid,
        mood: emoji,
        dateKey: dk,
        lonelinessScore,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await refreshProfile();
  }

  return (
    <div className="space-y-6">
      {!firebaseReady && (
        <p className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
          Profil saxlanması üçün Firebase .env faylını tamamlayın.
        </p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              {isSelf ? "Profilim" : `${display?.firstName} ${display?.lastName}`}
            </h2>
            {isSelf && isAdmin && (
              <span className="rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-100">
                Admin
              </span>
            )}
            {isSelf && (profile?.puzzleWins || 0) > 0 && (
              <span className="rounded-full border border-fuchsia-500/40 bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold text-fuchsia-100">
                Tapmaca ustadı ×{profile.puzzleWins}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            {isSelf
              ? "Məlumatlarını yenilə və görünürlüyünü artır."
              : "Ortaq məqamlar yaşıl ilə vurğulanır."}
          </p>
        </div>
        {isSelf && (
          <button
            type="button"
            onClick={() => logout().then(() => navigate("/login"))}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:border-rose-500/50 hover:text-rose-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            Çıxış
          </button>
        )}
      </div>

      {isSelf && firebaseReady && firebase && (
        <section className="rounded-2xl border border-pink-500/35 bg-gradient-to-r from-pink-950/45 to-violet-950/30 p-4 ring-1 ring-pink-500/20">
          <div className="mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-300" />
            <h3 className="text-sm font-semibold text-white">
              Bu gün necə hiss edirsən?
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { emoji: "😔", label: "Çətin" },
              { emoji: "😐", label: "Neytral" },
              { emoji: "😊", label: "Yaxşı" },
            ].map(({ emoji, label }) => (
              <button
                key={emoji}
                type="button"
                onClick={() => saveMood(emoji)}
                className={`flex min-w-[5.5rem] flex-col items-center rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  profile?.todayMood === emoji && profile?.todayMoodDate === dk
                    ? "border-pink-400 bg-pink-500/25 text-white ring-1 ring-pink-300/50"
                    : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-pink-500/40"
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-pink-100/70">
            Tənhalıq skoru (1–3) emosiyaya görə saxlanır; moods kolleksiyasına
            günlük qeyd yazılır. Explore-da eyni emosiyanı seçənlər çəhrayı ilə
            vurğulanır.
          </p>
          <Link
            to="/mektublar"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-sky-500/40 bg-sky-500/10 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/20"
          >
            Məktub qutusu — gələn anonim məktublar
          </Link>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-800 ring-2 ring-slate-700">
            {display?.photoURL ? (
              <img
                src={display.photoURL}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-300">
                {(display?.firstName || "?").slice(0, 1)}
              </div>
            )}
            {isSelf && (
              <label className="absolute inset-x-1 bottom-1 flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-slate-950/80 px-1 py-1 text-[10px] text-white ring-1 ring-slate-700">
                <Camera className="h-3 w-3" />
                Şəkil
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPhoto(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-xl font-semibold text-white">
                {display?.firstName} {display?.lastName}
              </p>
              {verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-400/40">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Təsdiqlənmiş Tələbə
                </span>
              )}
            </div>
            {isSelf && display?.email && (
              <p className="text-sm text-slate-500">{display.email}</p>
            )}
            {!isSelf && (
              <div className="flex flex-wrap gap-2 pt-1">
                {!isFriend && !pendingInbound && !pendingOutbound && (
                  <button
                    type="button"
                    disabled={friendBusy}
                    onClick={sendFriendRequest}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {friendBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Dostluq istəyi göndər
                  </button>
                )}
                {pendingOutbound && (
                  <span className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    Dostluq istəyi gözləmədədir
                  </span>
                )}
                {pendingInbound && (
                  <button
                    type="button"
                    disabled={friendBusy}
                    onClick={acceptFriendRequest}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
                  >
                    {friendBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    İstəyi qəbul et
                  </button>
                )}
                {isFriend && (
                  <Link
                    to={`/chat/${target.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Mesaj yaz
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:grid-cols-2">
        <Field
          label="Yaş"
          highlight={false}
          value={display?.age ?? "—"}
          self={isSelf}
        />
        <Field
          label="Kurs"
          highlight={false}
          value={display?.course ? `${display.course}` : "—"}
          self={isSelf}
        />
        <Field
          label="Universitet"
          highlight={sameUniversity}
          value={display?.university || "—"}
          self={isSelf}
        />
        <Field
          label="İxtisas"
          highlight={false}
          value={display?.major || "—"}
          self={isSelf}
        />
        <Field
          label="Şəhər (tapmaca üçün)"
          highlight={false}
          value={display?.city || "—"}
          self={isSelf}
        />
        <Field
          label="Bu günkü əhval"
          highlight={sameMood}
          value={display?.todayMood || "—"}
          self={isSelf}
        />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-white">Hobbilər</h3>
        <div className="flex flex-wrap gap-2">
          {(display?.hobbies || []).length === 0 && (
            <span className="text-sm text-slate-500">Hələ əlavə olunmayıb</span>
          )}
          {(display?.hobbies || []).map((h) => {
            const hl =
              !isSelf && sharedHobbies.has(String(h).toLowerCase());
            return (
              <span
                key={h}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                  hl
                    ? "bg-emerald-500/20 text-emerald-100 ring-emerald-400/60"
                    : "bg-slate-800 text-slate-200 ring-slate-700"
                }`}
              >
                {h}
              </span>
            );
          })}
        </div>
      </section>

      {isSelf && (
        <section className="space-y-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Profili düzəlt</h3>
            {saving && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saxlanılır…
              </span>
            )}
          </div>
          <form onSubmit={onSaveProfile} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Ad</label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Soyad
                </label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Yaş</label>
                <input
                  type="number"
                  min={16}
                  max={80}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                  value={form.age}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, age: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Kurs (1-5)
                </label>
                <select
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                  value={form.course}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, course: e.target.value }))
                  }
                >
                  <option value="">Seç</option>
                  {[1, 2, 3, 4, 5].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Universitet
              </label>
              <select
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                value={form.university}
                onChange={(e) =>
                  setForm((f) => ({ ...f, university: e.target.value }))
                }
                required
              >
                <option value="">Seç</option>
                {UNIVERSITIES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                İxtisas
              </label>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                value={form.major}
                onChange={(e) =>
                  setForm((f) => ({ ...f, major: e.target.value }))
                }
                placeholder="Məs: Kompüter elmləri"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Şəhər (tapmaca ipucu üçün)
              </label>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                placeholder="Məs: Bakı"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Hobbilər (teqlər)
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {HOBBY_SUGGESTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHobby(h)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                      form.hobbies.includes(h)
                        ? "bg-emerald-500/20 text-emerald-50 ring-emerald-400/60"
                        : "bg-slate-900 text-slate-300 ring-slate-700 hover:text-white"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500/50"
                  placeholder="Öz marağını yaz və əlavə et"
                  value={form.hobbyInput}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hobbyInput: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={addCustomHobby}
                  className="rounded-xl border border-slate-700 px-3 text-sm text-slate-100 hover:border-emerald-500/50"
                >
                  Əlavə et
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.hobbies.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHobby(h)}
                    className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-100 ring-1 ring-slate-600"
                  >
                    {h} ×
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              Dəyişiklikləri saxla
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function Field({ label, value, highlight, self }) {
  return (
    <div
      className={`rounded-xl px-3 py-2 text-sm ${
        highlight && !self
          ? "bg-emerald-500/15 text-emerald-50 ring-1 ring-emerald-400/50"
          : "bg-slate-950/60 text-slate-100 ring-1 ring-slate-800"
      }`}
    >
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
