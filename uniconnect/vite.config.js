import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Node ilə .env oxunur (UTF-8, BOM, Windows). */
function parseDotEnvFile(absPath) {
  const out = {};
  if (!fs.existsSync(absPath)) return out;
  let raw = fs.readFileSync(absPath, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    if (!key.startsWith("VITE_")) continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadMergedViteEnv() {
  const merged = {
    ...parseDotEnvFile(path.join(__dirname, ".env")),
    ...parseDotEnvFile(path.join(__dirname, ".env.local")),
  };
  const keys = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_ADMIN_EMAILS",
  ];
  for (const k of keys) {
    if (process.env[k]) merged[k] = process.env[k];
  }
  return merged;
}

const mergedEnv = loadMergedViteEnv();

/**
 * Vite-in import.meta.env plagini bəzən `define` ilə eyni açarlarda toqquşur.
 * Firebase üçün ayrıca global simvollar — həmişə .env-dən inject olunur.
 */
const envDefine = {
  __UC_FB_API_KEY__: JSON.stringify(mergedEnv.VITE_FIREBASE_API_KEY ?? ""),
  __UC_FB_PROJECT_ID__: JSON.stringify(mergedEnv.VITE_FIREBASE_PROJECT_ID ?? ""),
  __UC_FB_MESSAGING_SENDER_ID__: JSON.stringify(
    mergedEnv.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  ),
  __UC_FB_APP_ID__: JSON.stringify(mergedEnv.VITE_FIREBASE_APP_ID ?? ""),
  __UC_FB_AUTH_DOMAIN__: JSON.stringify(mergedEnv.VITE_FIREBASE_AUTH_DOMAIN ?? ""),
  __UC_FB_STORAGE_BUCKET__: JSON.stringify(
    mergedEnv.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  ),
  __UC_ADMIN_EMAILS__: JSON.stringify(mergedEnv.VITE_ADMIN_EMAILS ?? ""),
};

export default defineConfig({
  envDir: __dirname,
  define: envDefine,
  plugins: [react(), tailwindcss()],
  server: {
    // Bəzi Windows qurğularında yalnız "localhost" işləməyəndə 127.0.0.1 / LAN ünvanı işləsin
    host: true,
    port: 5173,
  },
});
