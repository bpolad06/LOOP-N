import { firebaseReady, getMissingFirebaseEnvKeys } from "../firebase.js";

export function FirebaseBanner() {
  if (firebaseReady) return null;
  const missing = getMissingFirebaseEnvKeys();

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-50">
      <p className="text-center font-semibold">Firebase quraşdırılmayıb</p>
      <ol className="mx-auto mt-2 max-w-xl list-decimal space-y-1.5 pl-5 text-left text-[13px] leading-snug text-amber-100/95">
        <li>
          <strong>uniconnect</strong> qovluğunda ( <code className="rounded bg-black/25 px-1">package.json</code>{" "}
          ilə <strong>eyni yerə</strong>) <code className="rounded bg-black/25 px-1">.env</code> faylı yaradın.
          Alternativ: bir üst qovluqda (Desktop/LOOPİN) <code className="rounded bg-black/25 px-1">npm run dev</code>{" "}
          də işləyir.
          — adı dəqiq <code className="rounded bg-black/25 px-1">.env</code> olsun,{" "}
          <code className="rounded bg-black/25 px-1">.env.txt</code> yox.
        </li>
        <li>
          Firebase Console → Layihə parametrləri → kopyalayın:{" "}
          <code className="rounded bg-black/25 px-1">.env.example</code> üzrə ən azı bu 4 açar:{" "}
          <code className="rounded bg-black/25 px-1">VITE_FIREBASE_API_KEY</code>,{" "}
          <code className="rounded bg-black/25 px-1">VITE_FIREBASE_PROJECT_ID</code>,{" "}
          <code className="rounded bg-black/25 px-1">VITE_FIREBASE_MESSAGING_SENDER_ID</code>,{" "}
          <code className="rounded bg-black/25 px-1">VITE_FIREBASE_APP_ID</code>.
          <span className="block text-amber-200/80">
            İstəsəniz <code className="rounded bg-black/25 px-1">VITE_FIREBASE_AUTH_DOMAIN</code> və{" "}
            <code className="rounded bg-black/25 px-1">VITE_FIREBASE_STORAGE_BUCKET</code> əlavə edin; əks halda{" "}
            <code className="rounded bg-black/25 px-1">PROJECT_ID</code> əsasında avtomatik doldurulur.
          </span>
        </li>
        <li>
          Faylı yadda saxlayın, terminalda <code className="rounded bg-black/25 px-1">uniconnect</code>{" "}
          içində <code className="rounded bg-black/25 px-1">npm run dev</code> — <strong>serveri dayandırıb
          yenidən işə salın</strong> (Vite .env-i yalnız startda oxuyur).
        </li>
      </ol>
      {missing.length > 0 && (
        <p className="mt-3 text-center text-xs font-medium text-amber-200">
          İndi çatışmayan açarlar: {missing.join(", ")}
        </p>
      )}
      <p className="mt-2 text-center text-[11px] text-amber-200/80">
        Terminalda yoxlama:{" "}
        <code className="rounded bg-black/25 px-1">cd uniconnect</code> →{" "}
        <code className="rounded bg-black/25 px-1">npm run check-env</code>
      </p>
    </div>
  );
}
