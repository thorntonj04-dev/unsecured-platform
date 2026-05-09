// ─── FIREBASE / FIRESTORE + AUTH ─────────────────────────────────────────────
// Public reads come from the 'essays' Firestore collection.
// Admin writes require Firebase Auth (email/password).
//
// Required env vars in .env.local:
//   VITE_FIREBASE_API_KEY
//   VITE_FIREBASE_AUTH_DOMAIN
//   VITE_FIREBASE_PROJECT_ID
//   VITE_FIREBASE_STORAGE_BUCKET
//   VITE_FIREBASE_MESSAGING_SENDER_ID
//   VITE_FIREBASE_APP_ID

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, collection, getDocs, doc,
  setDoc, deleteDoc, query, orderBy, where,
  addDoc, serverTimestamp, limit,
} from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword,
  signOut as fbSignOut, onAuthStateChanged,
} from "firebase/auth";
import { LOCAL_ESSAYS } from "./essays";

const {
  VITE_FIREBASE_API_KEY: apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: authDomain,
  VITE_FIREBASE_PROJECT_ID: projectId,
  VITE_FIREBASE_STORAGE_BUCKET: storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
  VITE_FIREBASE_APP_ID: appId,
} = import.meta.env;

const CONFIGURED = !!(apiKey && projectId);

let _db = null;
let _auth = null;

function getApp() {
  if (!CONFIGURED) return null;
  return getApps().length > 0
    ? getApps()[0]
    : initializeApp({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId });
}

function getDB() {
  if (!CONFIGURED) return null;
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

function getAuthInstance() {
  if (!CONFIGURED) return null;
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}

// ── ESSAY SCHEMA HELPER ───────────────────────────────────────────────────────
function normalizeEssay(data) {
  return {
    id: data.id,
    theme: data.theme || "Pressure",
    readTime: data.readTime || "",
    title: data.title || "",
    hook: data.hook || "",
    pullQuote: data.pullQuote || "",
    subhead: data.subhead || "",
    body: Array.isArray(data.body) ? data.body : [],
    bookTie: data.bookTie || "",
    related: Array.isArray(data.related) ? data.related : [],
    published: data.published !== false, // default true
  };
}

// ── PUBLIC: fetch published essays ───────────────────────────────────────────
// Returns sorted array or null (→ fallback to LOCAL_ESSAYS).
export async function fetchEssays() {
  const db = getDB();
  if (!db) return null;
  try {
    const q = query(
      collection(db, "essays"),
      where("published", "!=", false),
      orderBy("published"),
      orderBy("id", "asc")
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs.map(d => normalizeEssay(d.data()));
  } catch (err) {
    console.warn("Firestore fetch failed, using local essays:", err.message);
    return null;
  }
}

// ── ADMIN: fetch ALL essays (including drafts) ────────────────────────────────
export async function fetchAllEssays() {
  const db = getDB();
  if (!db) return LOCAL_ESSAYS;
  try {
    const q = query(collection(db, "essays"), orderBy("id", "asc"));
    const snap = await getDocs(q);
    if (snap.empty) return LOCAL_ESSAYS;
    return snap.docs.map(d => normalizeEssay(d.data()));
  } catch (err) {
    console.warn("fetchAllEssays failed:", err.message);
    return LOCAL_ESSAYS;
  }
}

// ── ADMIN: save (create or update) an essay ──────────────────────────────────
export async function saveEssay(essay) {
  const db = getDB();
  if (!db) throw new Error("Firebase not configured");
  await setDoc(doc(db, "essays", String(essay.id)), normalizeEssay(essay));
}

// ── ADMIN: delete an essay ────────────────────────────────────────────────────
export async function deleteEssay(id) {
  const db = getDB();
  if (!db) throw new Error("Firebase not configured");
  await deleteDoc(doc(db, "essays", String(id)));
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const auth = getAuthInstance();
  if (!auth) throw new Error("Firebase not configured");
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  const auth = getAuthInstance();
  if (auth) await fbSignOut(auth);
}

export function onAuthChange(callback) {
  const auth = getAuthInstance();
  if (!auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
}

// ── SAVE AUDIT RESULT ─────────────────────────────────────────────────────────
export async function saveAuditResult({ email, name, scores, profile }) {
  const db = getDB();
  if (!db) return;
  await addDoc(collection(db, "audits"), {
    email, name: name || "", scores, profile,
    timestamp: serverTimestamp(),
  });
}

// ── ADD TO WAITLIST ───────────────────────────────────────────────────────────
export async function addToWaitlist({ name, email }) {
  const db = getDB();
  if (!db) return;
  await addDoc(collection(db, "waitlist"), {
    name: name || "", email,
    timestamp: serverTimestamp(),
  });
}

// ── SUBSCRIBE TO NEWSLETTER ───────────────────────────────────────────────────
export async function subscribeNewsletter(email) {
  const db = getDB();
  if (!db) return;
  const key = email.toLowerCase().trim();
  await setDoc(doc(db, "subscribers", key), {
    email: key,
    timestamp: serverTimestamp(),
  }, { merge: true });
}

// ── SUBMIT CORPORATE INQUIRY ──────────────────────────────────────────────────
export async function submitInquiry({ name, email, organization, role, teamSize, interests, message }) {
  const db = getDB();
  if (!db) return;
  await addDoc(collection(db, "inquiries"), {
    name, email, organization: organization || "", role: role || "",
    teamSize: teamSize || "", interests: interests || [],
    message: message || "", timestamp: serverTimestamp(),
  });
}

// ── FETCH ADMIN COLLECTION ────────────────────────────────────────────────────
export async function fetchAdminCollection(name) {
  const db = getDB();
  if (!db) return [];
  const q = query(collection(db, name), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── ANALYTICS HELPERS ─────────────────────────────────────────────────────────

export function parseReferrer() {
  try {
    const ref = document.referrer;
    if (!ref) return "Direct";
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (host.includes("google")) return "Google";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("twitter") || host.includes("x.com")) return "X";
    if (host.includes("bing")) return "Bing";
    if (host.includes("reddit")) return "Reddit";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("tiktok")) return "TikTok";
    return host || "Direct";
  } catch { return "Direct"; }
}

export function getSessionId() {
  try {
    let id = sessionStorage.getItem("_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("_sid", id);
    }
    return id;
  } catch { return "unknown"; }
}

// Captures the referrer once per session (so navigating essays doesn't overwrite it)
export function getSessionReferrer() {
  try {
    let ref = sessionStorage.getItem("_ref");
    if (ref === null) {
      ref = parseReferrer();
      sessionStorage.setItem("_ref", ref);
    }
    return ref;
  } catch { return "Direct"; }
}

export function getDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "desktop";
}

// ── TRACK EVENT ───────────────────────────────────────────────────────────────
// Fire-and-forget — never throws, never blocks UI.
export async function trackEvent(data) {
  const db = getDB();
  if (!db) return;
  try {
    await addDoc(collection(db, "analytics"), {
      ...data,
      timestamp: serverTimestamp(),
    });
  } catch { /* intentionally silent */ }
}

// ── FETCH ANALYTICS (admin only) ──────────────────────────────────────────────
export async function fetchAnalytics() {
  const db = getDB();
  if (!db) return [];
  try {
    const q = query(
      collection(db, "analytics"),
      orderBy("timestamp", "desc"),
      limit(2000)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("fetchAnalytics failed:", err.message);
    return [];
  }
}

export { LOCAL_ESSAYS };
