import { useState } from "react";
import { addToWaitlist } from "./firebase";

// ─── DESIGN TOKENS (mirrors App.jsx) ─────────────────────────────────────────
const C = {
  navy: "#0d1720", navyMid: "#162030", navyLight: "#1e2f42",
  cream: "#f4efe6", creamDark: "#ece5d8",
  gold: "#b8943f", goldLight: "#d4a84b",
  g100: "#f7f5f2", g200: "#e5e0d8", g400: "#9e9489",
  g600: "#68605a", g800: "#2a2420",
};

export default function CohortPage({ mobile, px }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      await addToWaitlist({ name: name.trim(), email: email.trim() });
      setDone(true);
    } catch (err) {
      console.warn("addToWaitlist failed:", err.message);
      // Still show confirmation — don't punish the user for a backend issue
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* ── NAVY HERO ── */}
      <div style={{ background: C.navy, padding: mobile ? `72px ${px}` : `96px ${px}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 25% 60%, ${C.navyLight} 0%, transparent 65%)`, opacity: 0.85 }} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* Coming soon badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "6px 14px", border: `1px solid ${C.gold}40`, background: `${C.gold}12` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold }}>
              Coming Soon
            </span>
          </div>

          <div style={{ width: 36, height: 2, background: C.gold, marginBottom: 20 }} />
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold, marginBottom: 18 }}>
            Small Group · Structured Path
          </p>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(32px,9vw,52px)" : "clamp(36px,5vw,60px)", fontWeight: 900, color: C.cream, lineHeight: 1.08, marginBottom: 24, letterSpacing: "-.02em" }}>
            The Reconfiguration Lab
          </h1>
          <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: mobile ? 16 : 19, fontStyle: "italic", color: "rgba(244,239,230,.65)", lineHeight: 1.65, maxWidth: 560 }}>
            A small group. The full book. A structured path through.
          </p>
        </div>
      </div>

      {/* ── WHAT THIS IS ── */}
      <div style={{ background: C.creamDark, borderBottom: `1px solid ${C.g200}`, padding: mobile ? `56px ${px}` : `80px ${px}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold, marginBottom: 20 }}>
            What This Is
          </p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(22px,6vw,32px)" : "clamp(24px,3.5vw,36px)", fontWeight: 700, color: C.navy, lineHeight: 1.2, marginBottom: 32, letterSpacing: "-.01em" }}>
            Going through the book — together, with structure.
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 44 }}>
            {[
              {
                icon: "◈",
                title: "Small by design",
                body: "Limited seats. This is intentional. The conversation that changes how you see something requires enough space to actually happen. A small cohort means everyone's situation gets real attention.",
              },
              {
                icon: "◇",
                title: "8 weeks through Unsecured",
                body: "The cohort moves through the full book together — one framework at a time. Each week builds on the last. By the end, you've done more than read it. You've worked with it.",
              },
              {
                icon: "⊞",
                title: "Live sessions and reflection prompts",
                body: "Weekly live sessions with John. Between sessions: focused reflection prompts designed to surface what the week's material is showing you about your own system.",
              },
              {
                icon: "↻",
                title: "Led by John",
                body: "Not a course. Not a cohort that runs itself. John is in the room — bringing the thinking, holding the conversation, and connecting what the book says to what you're actually experiencing.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ display: "flex", gap: mobile ? 16 : 24, alignItems: "flex-start", padding: mobile ? "20px 18px" : "24px 28px", background: "white", border: `1px solid ${C.g200}`, borderLeft: `3px solid ${C.gold}` }}>
                <span style={{ fontSize: 20, color: C.gold, flexShrink: 0, marginTop: 2 }}>{icon}</span>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? 17 : 19, fontWeight: 700, color: C.navy, marginBottom: 8, lineHeight: 1.2 }}>{title}</h3>
                  <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 14 : 15, lineHeight: 1.82, color: C.g600, margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div style={{ padding: mobile ? "24px 22px" : "32px 36px", background: C.navy, borderLeft: `4px solid ${C.gold}` }}>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(16px,4.5vw,20px)" : "clamp(17px,2.5vw,22px)", fontStyle: "italic", color: C.cream, lineHeight: 1.55, margin: 0 }}>
              "The goal isn't to energize. It's to help you see what you've been operating inside of."
            </p>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400, marginTop: 12, letterSpacing: ".06em" }}>— John Thornton</p>
          </div>
        </div>
      </div>

      {/* ── WAITLIST FORM ── */}
      <div style={{ background: C.g100, padding: mobile ? `56px ${px}` : `80px ${px}` }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold, marginBottom: 12 }}>
            Join the Waitlist
          </p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(22px,6vw,32px)" : "clamp(24px,3vw,34px)", fontWeight: 700, color: C.navy, lineHeight: 1.2, marginBottom: 16, letterSpacing: "-.01em" }}>
            Be the first to know when seats open.
          </h2>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 14 : 15, lineHeight: 1.85, color: C.g600, marginBottom: 36 }}>
            The first cohort will be small. If this is something you want to be part of, get on the list now.
          </p>

          {done ? (
            <div style={{ padding: "36px 32px", background: "white", border: `1px solid ${C.g200}`, borderTop: `3px solid ${C.gold}` }}>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 12 }}>You're on the list.</p>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 15, color: C.g600, lineHeight: 1.8 }}>
                When the first cohort opens, you'll hear about it first. Thank you for your interest.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.g600, marginBottom: 8 }}>
                  Name <span style={{ color: C.g400, fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  style={{ width: "100%", padding: "14px 16px", border: `1.5px solid ${C.g200}`, background: "white", fontFamily: "'Source Sans 3',sans-serif", fontSize: 15, color: C.g800, outline: "none", boxSizing: "border-box", borderRadius: 0, transition: "border-color .22s" }}
                  onFocus={e => e.target.style.borderColor = C.navy}
                  onBlur={e => e.target.style.borderColor = C.g200}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.g600, marginBottom: 8 }}>
                  Email <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{ width: "100%", padding: "14px 16px", border: `1.5px solid ${C.g200}`, background: "white", fontFamily: "'Source Sans 3',sans-serif", fontSize: 15, color: C.g800, outline: "none", boxSizing: "border-box", borderRadius: 0, transition: "border-color .22s" }}
                  onFocus={e => e.target.style.borderColor = C.navy}
                  onBlur={e => e.target.style.borderColor = C.g200}
                />
              </div>
              {error && (
                <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: "#e74c3c", marginBottom: 16 }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                style={{ width: "100%", fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "16px 28px", background: submitting ? C.g400 : C.navy, color: C.cream, border: "none", cursor: submitting ? "not-allowed" : "pointer", transition: "all .22s", minHeight: 52, opacity: submitting ? 0.7 : 1 }}
                onMouseOver={e => { if (!submitting) e.currentTarget.style.background = C.navyLight; }}
                onMouseOut={e => { if (!submitting) e.currentTarget.style.background = C.navy; }}
              >
                {submitting ? "Joining…" : "Join the Waitlist"}
              </button>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400, marginTop: 14, lineHeight: 1.6 }}>
                No spam. You'll only hear when something real is ready.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
