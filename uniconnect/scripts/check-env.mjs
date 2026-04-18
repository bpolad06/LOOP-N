import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

function parse(absPath) {
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

const env = { ...parse(path.join(root, ".env")), ...parse(path.join(root, ".env.local")) };
const need = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

console.log("[UniConnect] .env yolu:", envPath);
console.log("[UniConnect] .env mövcuddur:", fs.existsSync(envPath) ? "bəli" : "XƏYR");
for (const k of need) {
  const v = env[k];
  const ok = v && String(v).trim().length > 0;
  console.log(`  ${k}: ${ok ? "dolu" : "BOŞ / yoxdur"}`);
}
if (!need.every((k) => env[k] && String(env[k]).trim())) {
  console.log("\n→ Firebase Console-dan dəyərləri yazın, faylı saxlayın, sonra: npm run dev");
  process.exit(1);
}
console.log("\n→ Firebase env hazırdır. npm run dev işə salın.");
process.exit(0);
