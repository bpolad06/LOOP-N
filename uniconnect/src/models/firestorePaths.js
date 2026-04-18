/**
 * UniConnect / LOOPİN — Firestore kolleksiya sxemi.
 * letters, moods, campus_messages (+ dailyPuzzles, users).
 *
 * moods: moods/{userId}/entries/{dateKey}
 * campus_messages: campus_messages/{universitySlug}/messages/{msgId}
 */

export const COL = {
  USERS: "users",
  LETTERS: "letters",
  MOODS: "moods",
  CAMPUS_MESSAGES: "campus_messages",
  DAILY_PUZZLES: "dailyPuzzles",
};
