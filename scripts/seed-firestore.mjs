// ─── FIRESTORE SEED SCRIPT ───────────────────────────────────────────────────
// Uploads all LOCAL_ESSAYS to Firestore.
// Run once after setting up your Firebase project:
//
//   node scripts/seed-firestore.mjs
//
// Requires a .env.local file (or env vars) with your Firebase config.
// Uses the essay `id` field as the Firestore document ID so re-running is safe.

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env.local manually (Vite doesn't run here) ──────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env.local");
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  // .env.local missing — rely on environment variables already set
}

const {
  VITE_FIREBASE_API_KEY: apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: authDomain,
  VITE_FIREBASE_PROJECT_ID: projectId,
  VITE_FIREBASE_STORAGE_BUCKET: storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
  VITE_FIREBASE_APP_ID: appId,
} = process.env;

if (!apiKey || !projectId) {
  console.error(
    "Missing Firebase config. Add VITE_FIREBASE_* vars to .env.local"
  );
  process.exit(1);
}

// ── Inline essays (no Vite transform available in Node) ──────────────────────
// This re-exports the LOCAL_ESSAYS array directly so we can run in plain Node.
const essaysPath = resolve(__dir, "../src/essays.js");
const essaysModule = await import(essaysPath);
const LOCAL_ESSAYS = essaysModule.LOCAL_ESSAYS;

// ── Seed ──────────────────────────────────────────────────────────────────────
const app = initializeApp({
  apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId,
});
const db = getFirestore(app);

let ok = 0;
let fail = 0;

for (const essay of LOCAL_ESSAYS) {
  try {
    await setDoc(doc(db, "essays", String(essay.id)), essay);
    console.log(`  ✓  ${essay.id}. ${essay.title}`);
    ok++;
  } catch (err) {
    console.error(`  ✗  ${essay.id}. ${essay.title} — ${err.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} uploaded, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
