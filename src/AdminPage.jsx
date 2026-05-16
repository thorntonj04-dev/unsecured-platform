import { useState, useEffect, useRef } from "react";
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

// Edge Functions don't run under Vite dev server — point at production origin locally.
const OG_ORIGIN = (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
  ? "https://unsecuredsystem.com"
  : "";

const BLANK_ESSAY = {
  id: "",
  theme: "Pressure",
  readTime: "6 min",
  title: "",
  hook: "",
  pullQuote: "",
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

        <Field label="Pull Quote" note="Drives the OG share card — one punchy sentence (falls back to hook if empty)">
          <textarea style={{ ...inputDarkStyle, ...textareaStyle, height: 72 }}
            value={form.pullQuote || ""} onChange={e => set("pullQuote", e.target.value)}
            placeholder="Pressure is a signal, not a test. Tests are meant to be passed. Signals are meant to be read." />
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

        <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
          <button type="submit" disabled={saving} style={{
            ...btnStyle, opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "Saving…" : isNew ? "Publish Essay" : "Save Changes"}
          </button>
          <button type="button" onClick={onCancel} style={outlineBtn}>Cancel</button>
          {!isNew && (
            <a href={`${OG_ORIGIN}/api/og/${initial.id}`} target="_blank" rel="noopener noreferrer"
              style={{ marginLeft: "auto", fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.gold, textDecoration: "none" }}>
              View Card →
            </a>
          )}
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

// ─── BOOK QUOTE LIBRARY DATA ──────────────────────────────────────────────────
const BOOK_QUOTES = [
  { chapter: 1, title: "The Weight That Doesn't Show", theme: "Pressure", quotes: [
    "Normal is the most convincing disguise pressure can wear. It doesn't announce itself as danger. It doesn't demand intervention.",
    "Responsibility has a way of narrowing the future until the present sounds like the only survivable option.",
    "My body noticed before my mind did.",
    "I had been living without margin. Without redundancy. Everything looked secure. Everything functioned. And yet, I was vulnerable.",
  ]},
  { chapter: 2, title: "When Hard Work Stops Working", theme: "Pressure", quotes: [
    "Overload doesn't erase intelligence. It restricts access to it. You can still see clearly for everyone else. You just can't do it for yourself.",
    "Blaming yourself keeps the world orderly. If you are the problem, the solution stays within reach.",
    "Nothing was failing because I was broken. Things were breaking because I was overloaded and blaming myself for it.",
    "When a system slows down, we don't tell it to work harder. We reduce the load, expand capacity, or change how it operates. But when the same thing happens to us, effort becomes the only solution we consider.",
  ]},
  { chapter: 3, title: "The Cost of Being Capable", theme: "Pressure", quotes: [
    "Pressure doesn't teach lessons once. It teaches responses. Once a response works, even temporarily, it becomes the default.",
    "Pressure removes visibility. It narrows your world. The road stops feeling like a highway and starts feeling like a tunnel.",
    "The idea of handling pressure assumes that pressure is something we can control. That assumption is false. We only have control of ourselves.",
    "I realized I couldn't outwork this anymore.",
  ]},
  { chapter: 4, title: "When Everything Feels Urgent", theme: "Pressure", quotes: [
    "Pressure is a signal, not a test. Tests are meant to be passed. Signals are meant to be interpreted.",
    "Confusing the two turns endurance into virtue and exhaustion into evidence of dedication.",
    "What if pressure is not proof of failure, but evidence that something was misaligned?",
    "Awareness alone can change how pressure affects your relationships, your work, and your emotional health.",
  ]},
  { chapter: 5, title: "How Pressure Learns Your Name", theme: "Pressure", quotes: [
    "Pressure itself is neutral. It doesn't tell us what to do. It responds to what we believe about it.",
    "Pressure was not asking me to become stronger. It was asking me to see more clearly.",
    "The danger isn't pressure. The danger is a bad interpretation left unexamined.",
    "I stopped asking how much pressure I could handle and started asking what it was telling me.",
  ]},
  { chapter: 6, title: "The Illusion of Control", theme: "Pressure", quotes: [
    "Control often enters disguised as responsibility.",
    "Visibility alone changes how pressure behaves.",
    "The danger lives in the background processes. These are the inputs we do not choose and rarely question.",
    "Seeing the inputs didn't make the pressure disappear. It didn't simplify my life or give me immediate answers. But it shifted something.",
  ]},
  { chapter: 7, title: "Why Rest Doesn't Fix It", theme: "Urgency", quotes: [
    "Tying your performance to your identity can be the type of self-configuration that will make every part of life harder.",
    "Rest threatened a system I'd spent years building. If I stopped, something I couldn't manage might surface.",
    "There is no finish line for being reliable. No signal that says you've done enough for today.",
    "I was asking the wrong question. Instead of asking why I was exhausted, I kept asking how to keep going.",
  ]},
  { chapter: 8, title: "Carrying More Than You Realize", theme: "Urgency", quotes: [
    "I blended my responsibilities and became a Swiss-army knife for my team. Tools designed to do everything well aren't optimized to do anything exceptionally.",
    "Boundaries are not rules that determine what we can't do. They protect what we value most.",
    "Crafted by time, perseverance, and many failures, your reputation can lead to unspoken expectations.",
    "It was from that inability to say no that I found myself carrying responsibilities that were not mine.",
  ]},
  { chapter: 9, title: "When Everything Feels Important", theme: "Urgency", quotes: [
    "The problem wasn't me. The problem was that everything around me had been arranged in a way that could only produce chaos.",
    "I had built a system that could never function as designed. It was operating over capacity. Its configuration had drifted far off baseline.",
    "This is where I lost focus on my life and my career. Not because I cared too much, but because the system could not sustain that level of care.",
    "I had reached the end. There was no light at the end of a tunnel. No ladder to climb. I was spiraling inward, trapped in a loop I could not exit alone.",
  ]},
  { chapter: 10, title: "The Rules You Never Chose", theme: "Internal Rules", quotes: [
    "The pain was caused by the way I was configured to handle it.",
    "If the inputs didn't change and the outcome didn't change, the only variable worth examining was the system itself.",
    "Rules like these don't stay contained. They don't just shape how you respond to pressure. They determine how and when you give yourself permission to stop.",
    "That ceiling can carry forward for decades without showing itself in daily life.",
  ]},
  { chapter: 11, title: "How Urgency Steals Your Margin", theme: "Internal Rules", quotes: [
    "Urgency doesn't just steal rest. It steals discernment. It collapses reflection into reaction.",
    "Fear is often the architect of our rules, and what fear builds, it builds to last.",
    "Urgency whispers lies that compound over time, like every other misconfiguration built from a bad reading of life's inputs.",
    "Urgency led me to perform at a higher level than my peers.",
  ]},
  { chapter: 12, title: "Interruption Before Inspection", theme: "Internal Rules", quotes: [
    "Urgency is not neutral. It always takes something with it.",
    "The problem isn't pressure itself, but how quickly meaning gets assigned to it.",
    "Visibility was never meant to change the system. It was meant to reveal where authority lives.",
    "Inspection, at this stage, isn't about improvement. It's about curiosity.",
  ]},
  { chapter: 13, title: "Reconfiguring What You Carry", theme: "Reconfiguration", quotes: [
    "Change doesn't begin by fighting urgency. It begins by questioning the rule that gave urgency authority in the first place.",
    "Most people don't live by values alone. They live by rules they no longer remember adopting.",
    "The system doesn't need to be broken, destroyed, or rebuilt from the ground up. It needs to be consulted. And consultation is the beginning of reconfiguration.",
    "Urgency becomes the messenger that carries authority forward. It does not argue or persuade, it merely executes.",
  ]},
  { chapter: 14, title: "The Moment After Awareness", theme: "Reconfiguration", quotes: [
    "You have to stop treating yourself as the faulty component.",
    "Not everything that feels heavy is dangerous. Not everything that hurts needs to be removed. And not every rule that once kept you safe should still have authority.",
    "The goal is not to become less affected by pressure. It's to become more discerning about what pressure is allowed to reach you.",
    "Before you decide what needs to change, you need to understand what you're actually carrying.",
  ]},
  { chapter: 15, title: "What You're Actually Exposed To", theme: "Reconfiguration", quotes: [
    "Some people aren't only overloaded — they are often over-reachable.",
    "Reliability without boundaries turns into exposure.",
    "A system that is always reachable cannot protect its own judgment. And judgment is what keeps pressure from becoming corrosive.",
    "When nothing can wait, urgency becomes the default mode of operation.",
  ]},
  { chapter: 16, title: "When Your Baseline Quietly Changed", theme: "Reconfiguration", quotes: [
    "Baselines don't collapse. They drift.",
    "Resilience without review eventually becomes entrapment.",
    "The strain isn't coming from what you're carrying now. It's coming from what you never put down.",
    "You stop asking whether something is acceptable. You only ask whether it's manageable.",
  ]},
  { chapter: 17, title: "The Rules That Act Like Open Ports", theme: "Reconfiguration", quotes: [
    "Rules are not bad, but unexamined rules are dangerous.",
    "Boundaries aren't moral stances. They're configuration choices.",
    "Urgency will always find its way into these rules. It doesn't need permission of its own. It exploits the permission that already exists.",
    "The risk isn't that a port is open. The risk is when no one remembers why a port is open.",
  ]},
  { chapter: 18, title: "Inspection Without Action", theme: "Reconfiguration", quotes: [
    "Nothing stops running just because it's been seen.",
    "Awareness doesn't close the port — it reveals who has permission to use it.",
    "Inspection doesn't ask you to change behavior. It asks you to notice authority.",
    "Visibility was never meant to change the system. It was meant to reveal where control lives.",
  ]},
  { chapter: 19, title: "Choosing What You Let Reach You", theme: "Reconfiguration", quotes: [
    "Most people think freedom comes from removing pressure. But freedom often begins by choosing what you let reach you, and under what conditions.",
    "Discernment is the ability to pause long enough to interpret what is arriving, instead of reacting automatically to its pressure.",
    "Old authority does not dissolve simply because new intentions are declared.",
    "Urgency becomes information instead of command. Rules become visible instead of absolute. Reachability becomes selective instead of reflexive.",
  ]},
  { chapter: 20, title: "Living with Margin", theme: "Reconfiguration", quotes: [
    "You are not broken. You are not weak. And you are not failing at life. You are responding exactly as a system responds when it has been configured to absorb pressure without question.",
    "Living with margin does not mean doing less. It means doing what matters without letting everything else pretend it does too.",
    "To let some things wait, not because they are unimportant, but because you are.",
    "This is what it means to live securely. Not protected from life. Not insulated from difficulty. But configured with intention.",
  ]},
];

// ─── CUSTOM CARD GENERATOR ───────────────────────────────────────────────────
function CustomCardTab() {
  const [quote, setQuote]       = useState("");
  const [theme, setTheme]       = useState("Pressure");
  const [label, setLabel]       = useState("");
  const [shareLink, setShareLink] = useState("https://unsecuredsystem.com");
  const [previewSrc, setPreviewSrc] = useState(null);
  const [copied, setCopied]     = useState(false);
  const [shareDraft, setShareDraft] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(0);
  const previewRef = useRef(null);

  const themeHashtags = {
    Pressure:         "#Leadership #Burnout #WorkplaceCulture #HighPerformance #Resilience",
    Urgency:          "#Urgency #Productivity #WorkplaceCulture #Leadership #MentalHealth",
    "Internal Rules": "#SelfAwareness #PersonalGrowth #Leadership #WorkplaceCulture #MindsetShift",
    Reconfiguration:  "#PersonalDevelopment #Leadership #WorkplaceCulture #Growth #Reconfiguration",
  };

  function buildCardUrl() {
    const params = new URLSearchParams({ quote, theme });
    if (label.trim()) params.set("label", label.trim());
    return `${OG_ORIGIN}/api/og/custom?${params.toString()}`;
  }

  function generate() {
    if (!quote.trim()) return;
    const hashtags = themeHashtags[theme] || "#Leadership #WorkplaceCulture";
    const draft = [
      `"${quote.trim()}"`,
      "",
      `— John Thornton`,
      label.trim() ? `\nFrom: ${label.trim()}` : "",
      "",
      shareLink !== "https://unsecuredsystem.com" ? shareLink : "https://unsecuredsystem.com",
      "",
      hashtags,
    ].filter(l => l !== undefined).join("\n");
    setShareDraft(draft);
    setPreviewSrc(buildCardUrl());
  }

  function postToLinkedIn() {
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareDraft)}`, "_blank", "noopener,noreferrer");
  }

  function postToX() {
    const xText = `"${quote.trim()}" — John Thornton`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(shareLink)}`, "_blank", "noopener,noreferrer");
  }

  function copyText() {
    navigator.clipboard.writeText(shareDraft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function useQuote(q, th, lbl) {
    setQuote(q);
    setTheme(th);
    setLabel(lbl);
    const params = new URLSearchParams({ quote: q, theme: th });
    if (lbl) params.set("label", lbl);
    const cardUrl = `${OG_ORIGIN}/api/og/custom?${params.toString()}`;
    const hashtags = themeHashtags[th] || "#Leadership #WorkplaceCulture";
    const draft = [`"${q}"`, "", `— John Thornton`, `From: ${lbl}`, "", shareLink, "", hashtags].join("\n");
    setShareDraft(draft);
    setPreviewSrc(cardUrl);
    setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }

  const canGenerate = quote.trim().length > 0;
  const ch = BOOK_QUOTES[selectedChapter];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
          Custom Card Generator
        </h2>
        <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g400, margin: 0 }}>
          Drop any line from the book or anywhere — generate a branded 1200×630 card and share it directly.
        </p>
      </div>

      {/* Book Quote Library */}
      <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "28px 32px", marginBottom: 20 }}>
        <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${C.g200}` }}>
          Book Quote Library — {BOOK_QUOTES.length} Chapters · {BOOK_QUOTES.reduce((n, c) => n + c.quotes.length, 0)} Quotes
        </p>

        {/* Chapter selector */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
          {BOOK_QUOTES.map((c, i) => (
            <button key={i} onClick={() => setSelectedChapter(i)} style={{
              flexShrink: 0, whiteSpace: "nowrap",
              padding: "5px 13px", fontSize: 11, fontWeight: 700, letterSpacing: ".06em",
              fontFamily: "'Source Sans 3',sans-serif", cursor: "pointer", border: "none",
              background: selectedChapter === i ? C.navy : C.g200,
              color: selectedChapter === i ? "white" : C.g600,
            }}>
              Ch {c.chapter}
            </button>
          ))}
        </div>

        {/* Chapter heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: C.navy }}>
            Chapter {ch.chapter} — {ch.title}
          </span>
          <span style={{
            fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700,
            letterSpacing: ".1em", textTransform: "uppercase", padding: "2px 9px",
            background: `${CARD_TC[ch.theme]?.hex}18`, color: CARD_TC[ch.theme]?.hex,
            border: `1px solid ${CARD_TC[ch.theme]?.hex}40`,
          }}>{ch.theme}</span>
        </div>

        {/* Quote rows */}
        {ch.quotes.map((q, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 0", borderTop: `1px solid ${C.g200}`, marginTop: i === 0 ? 14 : 0 }}>
            <p style={{ flex: 1, margin: 0, fontFamily: "Georgia,serif", fontSize: 14, fontStyle: "italic", color: C.navy, lineHeight: 1.65 }}>
              &ldquo;{q}&rdquo;
            </p>
            <button
              onClick={() => useQuote(q, ch.theme, `Chapter ${ch.chapter} — ${ch.title}`)}
              style={{
                flexShrink: 0, padding: "8px 18px", background: C.gold, color: "white",
                border: "none", cursor: "pointer", fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
              Use →
            </button>
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: "28px 32px", marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelDarkStyle}>Quote <span style={{ fontWeight: 400, color: C.g400 }}>— the line you want to share</span></label>
          <textarea
            value={quote}
            onChange={e => setQuote(e.target.value)}
            rows={4}
            placeholder="Enter any line from the book, a talk, or wherever…"
            style={{ ...inputDarkStyle, ...textareaStyle, fontSize: 15, fontFamily: "Georgia,serif", lineHeight: 1.7 }}
          />
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, color: quote.length > 200 ? C.red : C.g400, marginTop: 4, margin: "4px 0 0" }}>
            {quote.length}/250 chars {quote.length > 200 ? "— shorter quotes render larger and more shareable" : ""}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 16 }}>
          <div>
            <label style={labelDarkStyle}>Theme</label>
            <select value={theme} onChange={e => setTheme(e.target.value)} style={{ ...inputDarkStyle, cursor: "pointer" }}>
              {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelDarkStyle}>Label <span style={{ fontWeight: 400, color: C.g400 }}>— optional source (e.g. "From: Unsecured, Ch. 4")</span></label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="From: Unsecured"
              style={inputDarkStyle}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelDarkStyle}>Link to include in post</label>
            <input
              value={shareLink}
              onChange={e => setShareLink(e.target.value)}
              style={inputDarkStyle}
            />
          </div>
        </div>

        <button onClick={generate} disabled={!canGenerate}
          style={{ ...btnStyle, opacity: canGenerate ? 1 : 0.4, cursor: canGenerate ? "pointer" : "not-allowed" }}>
          Generate Preview →
        </button>
      </div>

      {/* Preview + share */}
      {previewSrc && (
        <div ref={previewRef} style={{ background: "white", border: `1px solid ${C.g200}`, padding: "28px 32px" }}>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: C.g400, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${C.g200}` }}>
            Preview
          </p>
          <img
            key={previewSrc}
            src={previewSrc}
            alt="Custom card preview"
            style={{ width: "100%", display: "block", marginBottom: 24, border: `1px solid ${C.g200}` }}
          />

          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: C.g400, marginBottom: 12 }}>
            Post draft
          </p>
          <textarea
            value={shareDraft}
            onChange={e => setShareDraft(e.target.value)}
            rows={7}
            style={{ ...inputDarkStyle, ...textareaStyle, marginBottom: 16 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <button onClick={postToLinkedIn} className="btn-d" style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "11px 0", background: C.navy, color: "white", border: "none", cursor: "pointer" }}>
              Post to LinkedIn
            </button>
            <button onClick={postToX}
              style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "11px 0", background: "#0f1419", color: "white", border: "none", cursor: "pointer" }}>
              Post to X
            </button>
            <a href={previewSrc} download="unsecured-card.png" target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "11px 0", background: C.gold, color: "white", border: "none", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              Download Card
            </a>
            <button onClick={copyText}
              style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "11px 0", background: "transparent", color: C.g600, border: `1px solid ${C.g200}`, cursor: "pointer" }}>
              {copied ? "Copied!" : "Copy Text"}
            </button>
          </div>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, color: C.g400, marginTop: 12, lineHeight: 1.6 }}>
            Edit the quote or theme above and click Generate again to refresh the card.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── CARD PREVIEW (CSS-rendered, no network dependency) ──────────────────────
const CARD_TC = {
  Pressure:         { hex: "#8b6e52", rgba: "rgba(139,110,82,0.5)" },
  Urgency:          { hex: "#4e6878", rgba: "rgba(78,104,120,0.5)" },
  "Internal Rules": { hex: "#5f7050", rgba: "rgba(95,112,80,0.5)" },
  Reconfiguration:  { hex: "#7a6b52", rgba: "rgba(122,107,82,0.5)" },
};

function CardPreview({ essay }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / 1200);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const theme = CARD_TC[essay.theme] || CARD_TC.Pressure;
  const rawQuote = essay.pullQuote || essay.hook || "";
  const quote = rawQuote.length > 185 ? rawQuote.slice(0, 182) + "…" : rawQuote;
  const label = essay.title.length > 65 ? essay.title.slice(0, 62) + "…" : essay.title;
  const qfs = quote.length > 130 ? 34 : quote.length > 85 ? 40 : 48;

  return (
    <div ref={wrapRef} style={{ width: "100%", height: Math.round(630 * scale), overflow: "hidden" }}>
      <div style={{ width: 1200, height: 630, transform: `scale(${scale})`, transformOrigin: "top left", display: "flex", background: "#0d1720" }}>
        {/* Gold bar */}
        <div style={{ width: 8, height: "100%", background: "#b8943f", flexShrink: 0 }} />
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "52px 76px 52px 72px", justifyContent: "space-between" }}>
          {/* Theme badge */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span style={{ padding: "6px 18px", border: `1px solid ${theme.hex}`, background: theme.rgba, color: theme.hex, fontSize: 15, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Source Sans 3',sans-serif" }}>
              {essay.theme}
            </span>
          </div>
          {/* Quote block */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "rgba(184,148,63,0.6)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20, fontFamily: "'Source Sans 3',sans-serif" }}>
              FROM: {label}
            </div>
            <div style={{ height: 1, background: "rgba(184,148,63,0.45)", marginBottom: 32 }} />
            <div style={{ fontSize: qfs, fontWeight: 400, fontStyle: "italic", color: "#f4efe6", lineHeight: 1.5, letterSpacing: "-0.01em", maxWidth: 980, fontFamily: "Georgia,serif" }}>
              &ldquo;{quote}&rdquo;
            </div>
          </div>
          {/* Byline */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: "#b8943f", letterSpacing: "0.04em", fontFamily: "'Source Sans 3',sans-serif" }}>John Thornton</div>
              <div style={{ fontSize: 19, color: "rgba(244,239,230,0.35)", letterSpacing: "0.1em", fontFamily: "'Source Sans 3',sans-serif" }}>unsecuredsystem.com</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "rgba(244,239,230,0.09)", letterSpacing: "0.35em", fontFamily: "'Source Sans 3',sans-serif" }}>UNSECURED</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CARD REVIEW TAB ─────────────────────────────────────────────────────────
function CardNoteItem({ essay, note, onChange }) {
  const hasNote = note.trim().length > 0;

  return (
    <div style={{ background: "white", border: `1.5px solid ${hasNote ? C.gold : C.g200}`, overflow: "hidden", transition: "border-color .2s" }}>
      {/* CSS-rendered card preview — no network dependency */}
      <CardPreview essay={essay} />

      {/* Essay meta */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, color: C.g400, fontWeight: 700 }}>#{essay.id}</span>
          <span style={{
            fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700,
            letterSpacing: ".1em", textTransform: "uppercase", padding: "2px 8px",
            background: `${TC[essay.theme]}15`, color: TC[essay.theme], border: `1px solid ${TC[essay.theme]}30`,
          }}>{essay.theme}</span>
          <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, color: essay.published !== false ? C.green : C.g400 }}>
            {essay.published !== false ? "Live" : "Draft"}
          </span>
          <a href={`${OG_ORIGIN}/api/og/${essay.id}`} target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: "auto", fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.gold, textDecoration: "none" }}>
            View live card →
          </a>
        </div>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.35 }}>{essay.title}</p>
      </div>

      {/* Notes */}
      <div style={{ padding: "0 16px 14px" }}>
        <textarea
          value={note}
          onChange={e => onChange(e.target.value)}
          placeholder="Notes for this card — what needs to change?"
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, lineHeight: 1.65, color: C.g800,
            border: `1px solid ${hasNote ? C.gold : C.g200}`,
            padding: "10px 12px", resize: "vertical", outline: "none",
            background: hasNote ? "#fffdf7" : C.g100, transition: "border-color .2s, background .2s",
          }}
        />
        {hasNote && (
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", margin: "4px 0 0" }}>
            Saved · {note.trim().length} chars
          </p>
        )}
      </div>
    </div>
  );
}

function CardReviewTab({ essays }) {
  const [notes, setNotes] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loaded = {};
    essays.forEach(e => {
      const saved = localStorage.getItem(`unsecured_card_note_${e.id}`);
      if (saved) loaded[e.id] = saved;
    });
    setNotes(loaded);
  }, [essays.length]);

  function updateNote(id, text) {
    setNotes(prev => ({ ...prev, [id]: text }));
    if (text.trim()) {
      localStorage.setItem(`unsecured_card_note_${id}`, text);
    } else {
      localStorage.removeItem(`unsecured_card_note_${id}`);
    }
  }

  function copyAllNotes() {
    const flagged = essays.filter(e => notes[e.id]?.trim());
    if (flagged.length === 0) return;
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const lines = [
      `CARD REVIEW NOTES — ${date}`,
      "",
      ...flagged.map(e =>
        `Essay ${e.id} — ${e.title} [${e.theme}]\n→ ${notes[e.id].trim()}`
      ),
    ];
    navigator.clipboard.writeText(lines.join("\n\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const noteCount = Object.values(notes).filter(n => n?.trim()).length;
  const published = essays.filter(e => e.published !== false);
  const drafts = essays.filter(e => e.published === false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
            OG Card Review
          </h2>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g400, margin: 0 }}>
            {essays.length} cards · {noteCount > 0 ? `${noteCount} flagged` : "no notes yet"} · Notes saved in your browser
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          {noteCount > 0 && (
            <button onClick={copyAllNotes} style={{ ...btnStyle, padding: "10px 20px" }}>
              {copied ? "Copied!" : `Copy ${noteCount} Note${noteCount !== 1 ? "s" : ""} →`}
            </button>
          )}
        </div>
      </div>

      {essays.length === 0 && (
        <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g400, padding: "40px 0", textAlign: "center" }}>
          No essays loaded yet.
        </p>
      )}

      {published.length > 0 && (
        <>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: C.g400, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${C.g200}` }}>
            Published ({published.length})
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 20, marginBottom: 32 }}>
            {published.map(essay => (
              <CardNoteItem
                key={essay.id}
                essay={essay}
                note={notes[essay.id] || ""}
                onChange={text => updateNote(essay.id, text)}
              />
            ))}
          </div>
        </>
      )}

      {drafts.length > 0 && (
        <>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: C.g400, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${C.g200}` }}>
            Drafts ({drafts.length})
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 20 }}>
            {drafts.map(essay => (
              <CardNoteItem
                key={essay.id}
                essay={essay}
                note={notes[essay.id] || ""}
                onChange={text => updateNote(essay.id, text)}
              />
            ))}
          </div>
        </>
      )}
    </div>
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
            {[["Analytics","analytics"],["Cards","cards"],["Custom","custom"],["Essays","essays"],["Audits","audits"],["Waitlist","waitlist"],["Inquiries","inquiries"],["Subscribers","subscribers"]].map(([label, t]) => (
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

        {/* ── CARDS TAB ── */}
        {activeTab === "cards" && (
          <CardReviewTab essays={essays} />
        )}

        {/* ── CUSTOM CARD TAB ── */}
        {activeTab === "custom" && (
          <CustomCardTab />
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
