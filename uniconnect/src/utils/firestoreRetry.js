import { enableNetwork, getDoc } from "firebase/firestore";

function isRetriable(err) {
  const code = err?.code;
  const msg = String(err?.message || "");
  return (
    code === "unavailable" ||
    code === "deadline-exceeded" ||
    code === "resource-exhausted" ||
    msg.includes("offline") ||
    msg.includes("Failed to get document because the client is offline")
  );
}

/**
 * İlk yükləmədə və ya zəif şəbəkədə getDoc bəzən "offline" atır — qısa gözləmə ilə təkrar.
 */
export async function getDocWithRetry(db, docRef, { maxAttempts = 5 } = {}) {
  let last;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await enableNetwork(db).catch(() => {});
      last = await getDoc(docRef);
      return last;
    } catch (e) {
      last = e;
      if (!isRetriable(e) || i === maxAttempts - 1) throw e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw last;
}
