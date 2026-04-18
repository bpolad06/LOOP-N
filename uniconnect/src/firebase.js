/* global __UC_FB_API_KEY__, __UC_FB_PROJECT_ID__, __UC_FB_MESSAGING_SENDER_ID__, __UC_FB_APP_ID__, __UC_FB_AUTH_DOMAIN__, __UC_FB_STORAGE_BUCKET__ */
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { enableNetwork, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * vite.config.js → `define` bu identifikatorları .env dəyərləri ilə əvəz edir.
 * import.meta.env ilə eyni adda Vite toqquşması olmur.
 */
function trim(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function buildFirebaseConfig() {
  const apiKey = trim(__UC_FB_API_KEY__);
  const projectId = trim(__UC_FB_PROJECT_ID__);
  let authDomain = trim(__UC_FB_AUTH_DOMAIN__);
  let storageBucket = trim(__UC_FB_STORAGE_BUCKET__);
  if (projectId) {
    if (!authDomain) authDomain = `${projectId}.firebaseapp.com`;
    if (!storageBucket) storageBucket = `${projectId}.appspot.com`;
  }
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId: trim(__UC_FB_MESSAGING_SENDER_ID__),
    appId: trim(__UC_FB_APP_ID__),
  };
}

const firebaseConfig = buildFirebaseConfig();

export function getMissingFirebaseEnvKeys() {
  const missing = [];
  if (!trim(__UC_FB_API_KEY__)) missing.push("VITE_FIREBASE_API_KEY");
  if (!trim(__UC_FB_PROJECT_ID__)) missing.push("VITE_FIREBASE_PROJECT_ID");
  if (!trim(__UC_FB_MESSAGING_SENDER_ID__))
    missing.push("VITE_FIREBASE_MESSAGING_SENDER_ID");
  if (!trim(__UC_FB_APP_ID__)) missing.push("VITE_FIREBASE_APP_ID");
  return missing;
}

function isConfigComplete() {
  const c = firebaseConfig;
  return Boolean(
    c.apiKey &&
      c.projectId &&
      c.authDomain &&
      c.storageBucket &&
      c.messagingSenderId &&
      c.appId,
  );
}

let firebase = null;
let firebaseReady = false;

if (isConfigComplete()) {
  try {
    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    /**
     * Standart getFirestore — SDK avtomatik long-polling aşkarlaması işləyir.
     * Əvvəlki initializeFirestore+memory bəzi mühitlərdə əlavə "offline" xətası verirdi.
     */
    const db = getFirestore(app);
    enableNetwork(db).catch(() => {});
    firebase = {
      app,
      auth: getAuth(app),
      db,
      storage: getStorage(app),
      googleProvider: new GoogleAuthProvider(),
    };
    firebaseReady = true;
  } catch (err) {
    console.error("[UniConnect] Firebase init xətası:", err);
  }
} else {
  const missing = getMissingFirebaseEnvKeys();
  console.warn(
    "[UniConnect] Firebase .env natamamdır. Çatışmayan:",
    missing.length ? missing.join(", ") : "(dəyərlərdə problem ola bilər)",
  );
}

export { firebase, firebaseReady };
