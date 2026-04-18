/**
 * Firebase Auth / Firestore xətalarını istifadəçi üçün qısa azərbaycanlı mətnə çevirir.
 * @param {unknown} err
 * @returns {string}
 */
export function humanizeFirebaseError(err) {
  const code = typeof err?.code === "string" ? err.code : "";
  const msg = typeof err?.message === "string" ? err.message : "";

  const auth = {
    "auth/email-already-in-use":
      "Bu e-poçt artıq qeydiyyatdan keçib — aşağıdan «Giriş» seçin.",
    "auth/invalid-email": "E-poçt ünvanı düzgün deyil.",
    "auth/invalid-credential":
      "E-poçt və ya şifrə yanlışdır (və ya hesab mövcud deyil).",
    "auth/wrong-password": "Şifrə yanlışdır.",
    "auth/user-not-found": "Bu e-poçtla hesab tapılmadı — əvvəlcə qeydiyyatdan keçin.",
    "auth/weak-password": "Şifrə çox zəifdir — ən azı 6 simvol istifadə edin.",
    "auth/operation-not-allowed":
      "E-poçt ilə giriş Firebase-də aktiv deyil. Firebase Console → Authentication → Sign-in method → Email/Password-u «Enable» edin.",
    "auth/network-request-failed": "Şəbəkə xətası — internet bağlantısını yoxlayın.",
    "auth/too-many-requests": "Çox cəhd edilib — bir neçə dəqiqə sonra yenidən cəhd edin.",
    "auth/user-disabled": "Bu hesab deaktiv edilib.",
    "auth/internal-error":
      "Firebase server xətası — layihə ID və .env dəyərlərini yoxlayın.",
    "auth/invalid-login-credentials":
      "E-poçt və ya şifrə yanlışdır (və ya hesab mövcud deyil).",
    "auth/configuration-not-found":
      "Firebase Authentication bu layihədə aktiv deyil və ya API söndürülüb. Addımlar: (1) Firebase Console → Build → Authentication → «Get started» / ilk dəfə açın. (2) Sign-in method → Email/Password → Enable. (3) Google Cloud Console → eyni layihə → APIs & Services → Library → «Identity Toolkit API» axtarıb Enable edin. (4) API açarında məhdudiyyət varsa, Identity Toolkit üçün icazə verin.",
  };

  if (code && auth[code]) return auth[code];

  if (
    code === "permission-denied" ||
    msg.includes("permission-denied") ||
    code === "firestore/permission-denied"
  ) {
    return "Firestore icazəsi yoxdur: Firebase Console-da Firestore Database yaradın və «Rules» faylını yerləşdirin (users kolleksiyasına öz sənədinizə yazma icazəsi).";
  }

  if (msg) return msg;
  return "Əməliyyat alınmadı.";
}
