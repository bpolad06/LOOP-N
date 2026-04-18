import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  process.exit(0);
}

const content = `# Firebase Console → Layihə parametrləri → tətbiq seçin → kopyalayın.
# Dırnaq yazmayın. Saxlayandan sonra terminalda Ctrl+C, sonra yenidən: npm run dev

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# İstəyə bağlı (boş qalsa PROJECT_ID əsasında avtomatik doldurulur):
# VITE_FIREBASE_AUTH_DOMAIN=
# VITE_FIREBASE_STORAGE_BUCKET=

# Admin e-poçtları (vergüllə):
# VITE_ADMIN_EMAILS=
`;

fs.writeFileSync(envPath, content, "utf8");
console.log(
  "[UniConnect] .env yaradıldı:",
  envPath,
  "\n→ Firebase dəyərlərini bu faylda doldurun, sonra dev serveri yenidən işə salın.",
);
