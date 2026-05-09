import { useState, useEffect } from "react";
import {
  signIn, signOut, onAuthChange,
  fetchAllEssays, saveEssay, deleteEssay,
  fetchAdminCollection, fetchAnalytics,
} from "./firebase";

// ─── TOKENS (mirrors App.jsx) ─────────────────────────────────────────────────
const C = {
  navy: "#0d1720", navyMid: "#162030", navyLight: "#1e2f42",
  cream: "#f4efe6", creamDark: "#ece5d8",
  gold: "#b8943f", goldLight: "#d4a84b",
  g100: "#f7f5f2", g200: "#e5e0d8", g400: "#9e9489",
  g600: "#68605a", g800: "#2a2420",
  red: "#c0392b", redLight: "#e74c3c",
  green: "#27ae60",
};

const THEMES = ["Pressure", "Urgency", "Internal Rules", "Reconfiguration"];

const BLANK_ESSAY = {
  id: "",
  theme: "Pressure",
  readTime: "6 min",
  title: "",
  hook: "",
  subhead: "",
  body: [],
  bookTie: "",
  related: [],
  published: true,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function bodyToText(body) {
  return Array.isArray(body) ? body.join("\n\n") : "";
}

function textToBody(text) {
  return text
    .split(/\n\s*\n/)
    .map(p => p.replace(/\n/g, " ").trim())
    .filter(p => p.length > 0);
}

function relatedToText(related) {
  return Array.isArray(related) ? related.join(", ") : "";
}

function textToRelated(text) {
  return text
    .split(",")
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n));
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
      onLogin();
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential"
          ? "Incorrect email or password."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: C.navy, padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 400, background: C.navyMid,
        border: `1px solid ${C.navyLight}`, padding: "48px 40px",
      }}>
        <div style={{ width: 32, height: 2, background: C.gold, marginBottom: 24 }} />
        <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700,
          letterSpacing: ".2em", textTransform: "uppercase", color: C.gold, marginBottom: 10 }}>
          Unsecured Platform
        </p>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700,
          color: C.cream, marginBottom: 32, lineHeight: 1.2 }}>
          Admin
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle} autoFocus autoComplete="email"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={inputStyle} autoComplete="current-password"
            />
          </div>
          {error && (
            <p style={{ fontFamily: "sans-serif", fontSize: 13, color: C.redLight, marginBottom: 16 }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} style={{
            ...btnStyle, width: "100%", opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── ESSAY FORM ───────────────────────────────────────────────────────────────
function EssayForm({ initial, allEssays, onSave, onCancel }) {
  const isNew = !initial.id;
  const [form, setForm] = useState({
    ...initial,
    bodyText: bodyToText(initial.body),
    relatedText: relatedToText(initial.related),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.id) {
      setError("Title and ID are required.");
      return;
    }
    const numId = parseInt(form.id, 10);
    if (isNaN(numId) || numId < 1) {
      setError("ID must be a positive number.");
      return;
    }
    if (isNew) {
      const exists = allEssays.find(e => e.id === numId);
      if (exists) { setError(`ID ${numId} is already in use by "${exists.title}".`); return; }
    }
    setSaving(true);
    setError("");
    try {
      const essay = {
        ...form,
        id: numId,
        body: textToBody(form.bodyText),
        related: textToRelated(form.relatedText),
        published: form.published !== false,
      };
      delete essay.bodyText;
      delete essay.relatedText;
      await saveEssay(essay);
      onSave(essay);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "32px 36px", marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.navy }}>
          {isNew ? "New Essay" : `Edit: ${initial.title}`}
        </h2>
        <button onClick={onCancel} style={{ ...outlineBtn, padding: "8px 16px" }}>Cancel</button>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginBottom: 16 }}>
          <div>
            <label style={labelDarkStyle}>ID {isNew && <span style={{ color: C.g400 }}>(unique number)</span>}</label>
            <input style={inputDarkStyle} type="number" min="1" value={form.id}
              onChange={e => set("id", e.target.value)} disabled={!isNew} />
          </div>
          <div>
            <label style={labelDarkStyle}>Theme</label>
            <select style={{ ...inputDarkStyle, cursor: "pointer" }} value={form.theme}
              onChange={e => set("theme", e.target.value)}>
              {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelDarkStyle}>Read Time</label>
            <input style={inputDarkStyle} placeholder="6 min" value={form.readTime}
              onChange={e => set("readTime", e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, paddingBottom: 2 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g600, userSelect: "none" }}>
              <input type="checkbox" checked={form.published !== false}
                onChange={e => set("published", e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }} />
              Published (visible to readers)
            </label>
          </div>
        </div>

        <Field label="Title" required>
          <input style={inputDarkStyle} value={form.title}
            onChange={e => set("title", e.target.value)} placeholder="Why Endurance Is the Wrong Goal" />
        </Field>

        <Field label="Hook" note="One sentence — shown in cards and essay header">
          <textarea style={{ ...inputDarkStyle, ...textareaStyle, height: 72 }}
            value={form.hook} onChange={e => set("hook", e.target.value)}
            placeholder="We've been taught to measure strength by how much we can carry. That measurement is wrong." />
        </Field>

        <Field label="Subhead" note="One sentence subtitle shown under the title">
          <input style={inputDarkStyle} value={form.subhead}
            onChange={e => set("subhead", e.target.value)}
            placeholder="The case against treating pressure like a test of character" />
        </Field>

        <Field label="Body" note="Separate paragraphs with a blank line">
          <textarea
            style={{ ...inputDarkStyle, ...textareaStyle, height: 320, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.7 }}
            value={form.bodyText}
            onChange={e => set("bodyText", e.target.value)}
            placeholder={"First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here."} />
        </Field>

        <Field label="Book Tie" note="e.g. Chapter 5 of Unsecured.">
          <input style={inputDarkStyle} value={form.bookTie}
            onChange={e => set("bookTie", e.target.value)}
            placeholder="This distinction runs through the early chapters of Unsecured." />
        </Field>

        <Field label="Related Essay IDs" note="Comma-separated, e.g. 3, 7">
          <input style={inputDarkStyle} value={form.relatedText}
            onChange={e => set("relatedText", e.target.value)}
            placeholder="3, 7" />
        </Field>

        {error && (
          <p style={{ fontFamily: "sans-serif", fontSize: 13, color: C.redLight, marginBottom: 16 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button type="submit" disabled={saving} style={{
            ...btnStyle, opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "Saving…" : isNew ? "Publish Essay" : "Save Changes"}
          </button>
          <button type="button" onClick={onCancel} style={outlineBtn}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, note, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelDarkStyle}>
        {label}
        {required && <span style={{ color: C.redLight }}> *</span>}
        {note && <span style={{ fontWeight: 400, color: C.g400, marginLeft: 6 }}>— {note}</span>}
      </label>
      {children}
    </div>
  );
}

// ─── ANALYTICS PROCESSOR ─────────────────────────────────────────────────────
function processAnalytics(events) {
  const now = new Date();
  const cutoff30 = new Date(now); cutoff30.setDate(cutoff30.getDate() - 30);

  const valid = events.filter(e => e.timestamp?.toDate);
  const views = valid.filter(e => e.type === "page_view" || e.type === "essay_view");
  const recent30 = views.filter(e => e.timestamp.toDate() >= cutoff30);

  const uniqueSessions = new Set(views.map(e => e.sessionId).filter(Boolean)).size;

  // Top essays
  const essayCounts = {};
  valid.filter(e => e.type === "essay_view").forEach(e => {
    if (e.essayTitle) essayCounts[e.essayTitle] = (essayCounts[e.essayTitle] || 0) + 1;
  });
  const topEssays = Object.entries(essayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([title, count]) => ({ title, count }));

  // Traffic sources
  const refCounts = {};
  views.forEach(e => {
    const r = e.referrer || "Direct";
    refCounts[r] = (refCounts[r] || 0) + 1;
  });
  const trafficSources = Object.entries(refCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([source, count]) => ({ source, count }));

  // Device split
  const devices = { mobile: 0, desktop: 0 };
  views.forEach(e => {
    if (e.device === "mobile") devices.mobile++;
    else devices.desktop++;
  });

  // Share clicks
  const shareCounts = {};
  valid.filter(e => e.type === "share_click").forEach(e => {
    if (e.platform) shareCounts[e.platform] = (shareCounts[e.platform] || 0) + 1;
  });
  const shareClicks = Object.entries(shareCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([platform, count]) => ({ platform, count }));

  // Daily views — last 30 days
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), dateStr: d.toDateString(), count: 0 });
  }
  recent30.forEach(e => {
    const ds = e.timestamp.toDate().toDateString();
    const day = days.find(d => d.dateStr === ds);
    if (day) day.count++;
  });

  return {
    total: views.length,
    recent30: recent30.length,
    uniqueSessions,
    topEssay: topEssays[0]?.title || "—",
    topEssays,
    trafficSources,
    devices,
    shareClicks,
    dailyViews: days,
    recentEvents: valid.slice(0, 40),
  };
}

// ─── ANALYTICS COMPONENTS ─────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "24px 28px", flex: 1, minWidth: 0 }}>
      <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.g400, marginBottom: 10 }}>{label}</p>
      <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900, color: C.navy, lineHeight: 1, marginBottom: sub ? 6 : 0 }}>{value}</p>
      {sub && <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</p>}
    </div>
  );
}

function HBar({ label, count, max, color = C.gold }) {
  const pct = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{ width: 110, fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g600, textAlign: "right", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ flex: 1, background: C.g200, height: 12, position: "relative" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width .4s ease" }} />
      </div>
      <div style={{ width: 28, fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g600, textAlign: "right", flexShrink: 0 }}>{count}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${C.g200}` }}>
      {children}
    </p>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function Dashboard({ onSignOut }) {
  const [activeTab, setActiveTab] = useState("analytics"); // default to analytics
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState("");

  // Collection tabs state
  const [audits, setAudits] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(false);

  // Analytics state
  const [analyticsRaw, setAnalyticsRaw] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  useEffect(() => {
    loadEssays();
    loadAnalytics(); // load analytics on mount
  }, []);

  async function loadEssays() {
    setLoading(true);
    const data = await fetchAllEssays();
    setEssays(data);
    setLoading(false);
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const data = await fetchAnalytics();
      setAnalyticsRaw(data);
      setAnalyticsLoaded(true);
    } catch (err) {
      showToast(`Analytics failed: ${err.message}`);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function loadCollection(name) {
    setCollectionLoading(true);
    try {
      const data = await fetchAdminCollection(name);
      if (name === "audits") setAudits(data);
      else if (name === "waitlist") setWaitlist(data);
      else if (name === "inquiries") setInquiries(data);
      else if (name === "subscribers") setSubscribers(data);
    } catch (err) {
      showToast(`Failed to load ${name}: ${err.message}`);
    } finally {
      setCollectionLoading(false);
    }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setEditing(null);
    if (tab === "audits" && audits.length === 0) loadCollection("audits");
    if (tab === "waitlist" && waitlist.length === 0) loadCollection("waitlist");
    if (tab === "inquiries" && inquiries.length === 0) loadCollection("inquiries");
    if (tab === "subscribers" && subscribers.length === 0) loadCollection("subscribers");
  }

  const analytics = analyticsLoaded ? processAnalytics(analyticsRaw) : null;

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function handleSaved(essay) {
    setEssays(prev => {
      const exists = prev.find(e => e.id === essay.id);
      return exists
        ? prev.map(e => e.id === essay.id ? essay : e).sort((a, b) => a.id - b.id)
        : [...prev, essay].sort((a, b) => a.id - b.id);
    });
    setEditing(null);
    showToast(`"${essay.title}" saved.`);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEssay(deleteTarget.id);
      setEssays(prev => prev.filter(e => e.id !== deleteTarget.id));
      showToast(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  }

  function formatTS(ts) {
    if (!ts) return "—";
    if (ts.toDate) return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return String(ts);
  }

  const displayed = filter === "All" ? essays : essays.filter(e => e.theme === filter);

  const tabStyle = (t) => ({
    fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700,
    letterSpacing: ".12em", textTransform: "uppercase", padding: "12px 20px",
    background: "transparent", color: activeTab === t ? C.cream : "rgba(244,239,230,.4)",
    border: "none", borderBottom: `2px solid ${activeTab === t ? C.gold : "transparent"}`,
    cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap",
  });

  const thStyle = {
    fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700,
    letterSpacing: ".12em", textTransform: "uppercase", color: C.g400,
    padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${C.g200}`,
    background: C.g100,
  };

  const tdStyle = {
    fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g800,
    padding: "14px 16px", borderBottom: `1px solid ${C.g200}`, verticalAlign: "top",
    lineHeight: 1.5,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.g100 }}>

      {/* ── Header ── */}
      <div style={{ background: C.navy, padding: "0 32px", borderBottom: `1px solid ${C.navyLight}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
            <div>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700,
                color: C.cream, marginRight: 16 }}>Admin Panel</span>
              <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700,
                letterSpacing: ".18em", textTransform: "uppercase", color: C.gold }}>Unsecured Platform</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400 }}>
                {essays.length} essays
              </span>
              <button onClick={onSignOut} style={{ ...outlineBtn, borderColor: "rgba(244,239,230,.2)",
                color: "rgba(244,239,230,.6)", padding: "8px 16px" }}>
                Sign Out
              </button>
            </div>
          </div>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none" }}>
            {[["Analytics","analytics"],["Essays","essays"],["Audits","audits"],["Waitlist","waitlist"],["Inquiries","inquiries"],["Subscribers","subscribers"]].map(([label, t]) => (
              <button key={t} onClick={() => handleTabChange(t)} style={tabStyle(t)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: C.navy, color: C.cream,
          padding: "12px 20px", fontFamily: "'Source Sans 3',sans-serif", fontSize: 13,
          boxShadow: "0 8px 24px rgba(0,0,0,.3)", zIndex: 999, borderLeft: `3px solid ${C.gold}` }}>
          {toast}
        </div>
      )}

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 998 }}>
          <div style={{ background: "white", padding: "40px 44px", maxWidth: 440, width: "100%",
            borderTop: `3px solid ${C.red}` }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700,
              color: C.navy, marginBottom: 12 }}>Delete Essay?</h3>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g600,
              lineHeight: 1.7, marginBottom: 28 }}>
              This will permanently remove <strong>"{deleteTarget.title}"</strong> from Firestore.
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={confirmDelete} disabled={deleting}
                style={{ ...btnStyle, background: C.red, opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} style={outlineBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "analytics" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.navy }}>
                Who's Been Watching
              </h2>
              <button onClick={loadAnalytics} disabled={analyticsLoading} style={{ ...outlineBtn, padding: "8px 16px", fontSize: 11, opacity: analyticsLoading ? 0.5 : 1 }}>
                {analyticsLoading ? "Loading…" : "Refresh"}
              </button>
            </div>

            {analyticsLoading && !analyticsLoaded && (
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g600 }}>Loading analytics…</p>
            )}

            {analytics && (
              <>
                {/* ── STAT CARDS ── */}
                <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
                  <StatCard label="Total Views" value={analytics.total.toLocaleString()} />
                  <StatCard label="Last 30 Days" value={analytics.recent30.toLocaleString()} />
                  <StatCard label="Unique Sessions" value={analytics.uniqueSessions.toLocaleString()} />
                  <StatCard label="Most Read Essay" value={analytics.topEssays[0]?.count ?? "—"} sub={analytics.topEssay} />
                </div>

                {/* ── DAILY BAR CHART ── */}
                <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "28px 28px 20px", marginBottom: 20 }}>
                  <SectionTitle>Views — Last 30 Days</SectionTitle>
                  {analytics.dailyViews.every(d => d.count === 0) ? (
                    <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g400, padding: "20px 0" }}>No data yet. Views will appear here once visitors arrive.</p>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80, marginBottom: 6 }}>
                        {(() => {
                          const max = Math.max(...analytics.dailyViews.map(d => d.count), 1);
                          return analytics.dailyViews.map((d, i) => (
                            <div key={i} title={`${d.label}: ${d.count} view${d.count !== 1 ? "s" : ""}`}
                              style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", cursor: "default" }}>
                              <div style={{ background: d.count > 0 ? C.gold : C.g200, height: `${Math.max(2, (d.count / max) * 100)}%`, transition: "height .3s ease", minHeight: d.count > 0 ? 4 : 2 }} />
                            </div>
                          ));
                        })()}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, color: C.g400 }}>{analytics.dailyViews[0]?.label}</span>
                        <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, color: C.g400 }}>{analytics.dailyViews[analytics.dailyViews.length - 1]?.label}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* ── ESSAYS + SOURCES ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {/* Top essays */}
                  <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "24px 24px" }}>
                    <SectionTitle>Top Essays</SectionTitle>
                    {analytics.topEssays.length === 0 ? (
                      <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g400 }}>No essay views yet.</p>
                    ) : (
                      analytics.topEssays.map((e, i) => (
                        <HBar key={i} label={e.title.length > 28 ? e.title.slice(0, 25) + "…" : e.title} count={e.count} max={analytics.topEssays[0].count} />
                      ))
                    )}
                  </div>

                  {/* Traffic sources */}
                  <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "24px 24px" }}>
                    <SectionTitle>Traffic Sources</SectionTitle>
                    {analytics.trafficSources.length === 0 ? (
                      <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g400 }}>No data yet.</p>
                    ) : (
                      analytics.trafficSources.map((s, i) => (
                        <HBar key={i} label={s.source} count={s.count} max={analytics.trafficSources[0].count} color={C.navyLight} />
                      ))
                    )}
                  </div>
                </div>

                {/* ── DEVICE + SHARES ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {/* Device split */}
                  <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "24px 24px" }}>
                    <SectionTitle>Device Split</SectionTitle>
                    {analytics.total === 0 ? (
                      <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g400 }}>No data yet.</p>
                    ) : (() => {
                      const total = analytics.devices.mobile + analytics.devices.desktop || 1;
                      const mobPct = Math.round((analytics.devices.mobile / total) * 100);
                      const desPct = 100 - mobPct;
                      return (
                        <>
                          <div style={{ display: "flex", height: 16, marginBottom: 16, gap: 2 }}>
                            <div style={{ width: `${desPct}%`, background: C.navy, transition: "width .4s" }} title={`Desktop ${desPct}%`} />
                            <div style={{ width: `${mobPct}%`, background: C.gold, transition: "width .4s" }} title={`Mobile ${mobPct}%`} />
                          </div>
                          {[["Desktop", analytics.devices.desktop, desPct, C.navy], ["Mobile", analytics.devices.mobile, mobPct, C.gold]].map(([label, count, pct, color]) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                              <div style={{ width: 10, height: 10, background: color, flexShrink: 0 }} />
                              <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g800, flex: 1 }}>{label}</span>
                              <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g400 }}>{count} ({pct}%)</span>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>

                  {/* Share clicks */}
                  <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "24px 24px" }}>
                    <SectionTitle>Share Clicks</SectionTitle>
                    {analytics.shareClicks.length === 0 ? (
                      <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g400 }}>No shares yet.</p>
                    ) : (
                      analytics.shareClicks.map((s, i) => (
                        <HBar key={i} label={s.platform} count={s.count} max={analytics.shareClicks[0].count} color="#5f7050" />
                      ))
                    )}
                  </div>
                </div>

                {/* ── RECENT ACTIVITY ── */}
                <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "24px 24px" }}>
                  <SectionTitle>Recent Activity</SectionTitle>
                  {analytics.recentEvents.length === 0 ? (
                    <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g400 }}>No activity yet.</p>
                  ) : (
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {analytics.recentEvents.map((e, i) => {
                        const ts = e.timestamp?.toDate?.();
                        const timeStr = ts ? ts.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
                        const isShare = e.type === "share_click";
                        const isEssay = e.type === "essay_view";
                        return (
                          <div key={e.id || i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "10px 0", borderBottom: `1px solid ${C.g200}` }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                              background: isShare ? "#5f7050" : isEssay ? C.gold : C.navyLight }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g800, lineHeight: 1.4, margin: 0 }}>
                                {isShare ? `Shared on ${e.platform}` : isEssay ? "Essay view" : "Page view"}
                                {(isShare || isEssay) && e.essayTitle && (
                                  <span style={{ color: C.g400 }}> · "{e.essayTitle.length > 40 ? e.essayTitle.slice(0, 38) + "…" : e.essayTitle}"</span>
                                )}
                              </p>
                              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, color: C.g400, margin: "2px 0 0", lineHeight: 1.3 }}>
                                {timeStr}{e.referrer && e.referrer !== "Direct" ? ` · via ${e.referrer}` : ""}{e.device ? ` · ${e.device}` : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ESSAYS TAB ── */}
        {activeTab === "essays" && (
          <>
            {!editing && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["All", ...THEMES].map(t => (
                    <button key={t} onClick={() => setFilter(t)} style={{
                      fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700,
                      letterSpacing: ".1em", textTransform: "uppercase", padding: "7px 14px",
                      background: filter === t ? C.navy : "white",
                      color: filter === t ? C.cream : C.g600,
                      border: `1px solid ${filter === t ? C.navy : C.g200}`,
                      cursor: "pointer", transition: "all .2s",
                    }}>
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={() => setEditing({ ...BLANK_ESSAY })} style={btnStyle}>
                  + New Essay
                </button>
              </div>
            )}

            {editing && (
              <EssayForm
                initial={editing}
                allEssays={essays}
                onSave={handleSaved}
                onCancel={() => setEditing(null)}
              />
            )}

            {!editing && (
              loading ? (
                <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g600 }}>
                  Loading essays…
                </p>
              ) : (
                <div>
                  {displayed.map(essay => (
                    <EssayRow
                      key={essay.id}
                      essay={essay}
                      onEdit={() => setEditing({ ...essay })}
                      onDelete={() => setDeleteTarget(essay)}
                    />
                  ))}
                  {displayed.length === 0 && (
                    <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g400,
                      padding: "40px 0", textAlign: "center" }}>
                      No essays in this theme.
                    </p>
                  )}
                </div>
              )
            )}
          </>
        )}

        {/* ── AUDITS TAB ── */}
        {activeTab === "audits" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.navy }}>
                System Audit Submissions
              </h2>
              <button onClick={() => loadCollection("audits")} style={{ ...outlineBtn, padding: "8px 16px", fontSize: 11 }}>
                Refresh
              </button>
            </div>
            {collectionLoading ? (
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g600 }}>Loading…</p>
            ) : audits.length === 0 ? (
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g400, padding: "40px 0", textAlign: "center" }}>No audit submissions yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Profile</th>
                      <th style={thStyle}>Scores</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map(row => (
                      <tr key={row.id} onMouseOver={e => e.currentTarget.style.background = C.g100} onMouseOut={e => e.currentTarget.style.background = "white"}>
                        <td style={tdStyle}>{row.email || "—"}</td>
                        <td style={tdStyle}>{row.name || "—"}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: C.navy }}>{row.profile || "—"}</td>
                        <td style={{ ...tdStyle, fontSize: 12, color: C.g600 }}>
                          {row.scores ? Object.entries(row.scores).map(([k, v]) => `${k.split(" ")[0]}: ${v}`).join(" · ") : "—"}
                        </td>
                        <td style={{ ...tdStyle, color: C.g400, whiteSpace: "nowrap" }}>{formatTS(row.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400, marginTop: 12 }}>{audits.length} submission{audits.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        )}

        {/* ── WAITLIST TAB ── */}
        {activeTab === "waitlist" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.navy }}>
                Reconfiguration Lab Waitlist
              </h2>
              <button onClick={() => loadCollection("waitlist")} style={{ ...outlineBtn, padding: "8px 16px", fontSize: 11 }}>
                Refresh
              </button>
            </div>
            {collectionLoading ? (
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g600 }}>Loading…</p>
            ) : waitlist.length === 0 ? (
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g400, padding: "40px 0", textAlign: "center" }}>No waitlist signups yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map(row => (
                      <tr key={row.id} onMouseOver={e => e.currentTarget.style.background = C.g100} onMouseOut={e => e.currentTarget.style.background = "white"}>
                        <td style={tdStyle}>{row.email || "—"}</td>
                        <td style={tdStyle}>{row.name || "—"}</td>
                        <td style={{ ...tdStyle, color: C.g400, whiteSpace: "nowrap" }}>{formatTS(row.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400, marginTop: 12 }}>{waitlist.length} signup{waitlist.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        )}

        {/* ── INQUIRIES TAB ── */}
        {activeTab === "inquiries" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.navy }}>
                Corporate Inquiries
              </h2>
              <button onClick={() => loadCollection("inquiries")} style={{ ...outlineBtn, padding: "8px 16px", fontSize: 11 }}>
                Refresh
              </button>
            </div>
            {collectionLoading ? (
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g600 }}>Loading…</p>
            ) : inquiries.length === 0 ? (
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g400, padding: "40px 0", textAlign: "center" }}>No inquiries yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Organization</th>
                      <th style={thStyle}>Message</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map(row => (
                      <tr key={row.id} onMouseOver={e => e.currentTarget.style.background = C.g100} onMouseOut={e => e.currentTarget.style.background = "white"}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{row.name || "—"}</td>
                        <td style={tdStyle}>{row.email || "—"}</td>
                        <td style={tdStyle}>{row.organization || "—"}</td>
                        <td style={{ ...tdStyle, maxWidth: 300, color: C.g600 }}>
                          {row.message ? (row.message.length > 120 ? row.message.slice(0, 120) + "…" : row.message) : "—"}
                        </td>
                        <td style={{ ...tdStyle, color: C.g400, whiteSpace: "nowrap" }}>{formatTS(row.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400, marginTop: 12 }}>{inquiries.length} inquir{inquiries.length !== 1 ? "ies" : "y"}</p>
              </div>
            )}
          </div>
        )}

        {/* ── SUBSCRIBERS TAB ── */}
        {activeTab === "subscribers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.navy }}>
                Newsletter Subscribers
              </h2>
              <button onClick={() => loadCollection("subscribers")} style={{ ...outlineBtn, padding: "8px 16px", fontSize: 11 }}>
                Refresh
              </button>
            </div>
            {collectionLoading ? (
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g600 }}>Loading…</p>
            ) : subscribers.length === 0 ? (
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g400, padding: "40px 0", textAlign: "center" }}>No subscribers yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map(row => (
                      <tr key={row.id} onMouseOver={e => e.currentTarget.style.background = C.g100} onMouseOut={e => e.currentTarget.style.background = "white"}>
                        <td style={tdStyle}>{row.email || row.id || "—"}</td>
                        <td style={{ ...tdStyle, color: C.g400, whiteSpace: "nowrap" }}>{formatTS(row.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400, marginTop: 12 }}>{subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── ESSAY ROW ────────────────────────────────────────────────────────────────
const TC = {
  Pressure: "#8b6e52", Urgency: "#4e6878",
  "Internal Rules": "#5f7050", Reconfiguration: "#7a6b52",
};

function EssayRow({ essay, onEdit, onDelete }) {
  return (
    <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "20px 24px",
      marginBottom: 8, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700,
        color: C.g400, width: 32, flexShrink: 0, textAlign: "right" }}>
        {essay.id}
      </span>
      <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700,
        letterSpacing: ".1em", textTransform: "uppercase", padding: "3px 10px",
        background: `${TC[essay.theme]}15`, color: TC[essay.theme],
        border: `1px solid ${TC[essay.theme]}30`, flexShrink: 0 }}>
        {essay.theme}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700,
          color: C.navy, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {essay.title}
        </p>
        <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400, margin: 0 }}>
          {essay.readTime} · {essay.body?.length || 0} paragraphs
        </p>
      </div>
      <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700,
        letterSpacing: ".1em", textTransform: "uppercase", flexShrink: 0,
        color: essay.published !== false ? C.green : C.g400 }}>
        {essay.published !== false ? "Published" : "Draft"}
      </span>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={onEdit} style={{ ...outlineBtn, padding: "7px 16px", fontSize: 11 }}>Edit</button>
        <button onClick={onDelete} style={{ ...outlineBtn, padding: "7px 16px", fontSize: 11,
          borderColor: `${C.red}50`, color: C.red }}>Delete</button>
      </div>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const labelStyle = {
  display: "block",
  fontFamily: "'Source Sans 3',sans-serif",
  fontSize: 11, fontWeight: 700, letterSpacing: ".12em",
  textTransform: "uppercase", color: C.g400, marginBottom: 8,
};

const labelDarkStyle = {
  ...labelStyle,
  color: C.g600,
};

const inputStyle = {
  width: "100%", padding: "12px 14px",
  border: `1.5px solid ${C.navyLight}`,
  background: C.navyLight, color: C.cream,
  fontFamily: "'Source Sans 3',sans-serif", fontSize: 14,
  outline: "none", boxSizing: "border-box",
  borderRadius: 0,
};

const inputDarkStyle = {
  width: "100%", padding: "10px 12px",
  border: `1.5px solid ${C.g200}`,
  background: "white", color: C.g800,
  fontFamily: "'Source Sans 3',sans-serif", fontSize: 14,
  outline: "none", boxSizing: "border-box",
  borderRadius: 0, transition: "border-color .2s",
};

const textareaStyle = {
  resize: "vertical",
  lineHeight: 1.6,
};

const btnStyle = {
  fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700,
  letterSpacing: ".14em", textTransform: "uppercase",
  padding: "12px 22px", background: C.navy, color: C.cream,
  border: "none", cursor: "pointer",
};

const outlineBtn = {
  fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700,
  letterSpacing: ".14em", textTransform: "uppercase",
  padding: "12px 22px", background: "transparent", color: C.navy,
  border: `1.5px solid ${C.navy}`, cursor: "pointer",
};

// ─── ROOT EXPORT ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsub = onAuthChange(u => setUser(u));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: C.navy, display: "flex",
        alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${C.gold}`,
          borderTopColor: "transparent", borderRadius: "50%",
          animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={() => {}} />;

  return <Dashboard onSignOut={signOut} />;
}
