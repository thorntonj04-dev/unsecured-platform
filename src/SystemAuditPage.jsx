import { useState } from "react";
import { saveAuditResult } from "./firebase";
import { sendAuditResultEmail } from "./emailjs";
import { LOCAL_ESSAYS } from "./essays";

const C = {
  navy: "#0d1720", navyMid: "#162030", navyLight: "#1e2f42",
  cream: "#f4efe6", creamDark: "#ece5d8",
  gold: "#b8943f", goldLight: "#d4a84b",
  g100: "#f7f5f2", g200: "#e5e0d8", g400: "#9e9489",
  g600: "#68605a", g800: "#2a2420",
};

const TC = {
  Pressure: "#8b6e52", Urgency: "#4e6878",
  "Internal Rules": "#5f7050", Reconfiguration: "#7a6b52",
};

// ─── 20 QUESTIONS (5 per theme, mix of direct + scenario) ─────────────────────
const QUESTIONS = [
  // ── PRESSURE ──────────────────────────────────────────────────────────────────
  { theme: "Pressure", text: "When you're tired at the end of a hard stretch, what does that tiredness mean to you?", answers: [
    { text: "It means I'm doing something right — I earned it.", score: 1 },
    { text: "It's just how things are. I don't read much into it.", score: 2 },
    { text: "It means something probably needs adjusting.", score: 3 },
    { text: "It's a signal I take seriously and respond to.", score: 4 },
  ]},
  { theme: "Pressure", text: "When pressure increases, your first move is usually to:", answers: [
    { text: "Push harder — add more effort until it stabilizes.", score: 1 },
    { text: "Keep going and hope it levels out.", score: 2 },
    { text: "Try to understand what's driving it before responding.", score: 3 },
    { text: "Evaluate what's legitimate and what can be removed.", score: 4 },
  ]},
  { theme: "Pressure", text: "How does your body register pressure?", answers: [
    { text: "I don't notice much until I crash.", score: 1 },
    { text: "I notice the signs — tension, fatigue — but push through.", score: 2 },
    { text: "I've learned to read those signals and slow down.", score: 3 },
    { text: "I catch it early and adjust before it builds.", score: 4 },
  ]},
  // Scenario
  { theme: "Pressure", text: "It's the end of a brutal week. You're behind on two things, someone just added a new ask, and you have dinner plans tonight you've already rescheduled twice. You:", answers: [
    { text: "Push through — dinner can wait again.", score: 1 },
    { text: "Go to dinner but spend most of it thinking about work.", score: 2 },
    { text: "Protect the dinner, then reassess priorities in the morning.", score: 3 },
    { text: "Notice this is a pattern and treat it as a signal something needs to change.", score: 4 },
  ]},
  { theme: "Pressure", text: "The last time you genuinely rested — not just caught up, but actually restored — was:", answers: [
    { text: "I'm honestly not sure what that would feel like.", score: 1 },
    { text: "A while ago — I'm usually managing, not recovering.", score: 2 },
    { text: "Reasonably recent, but only when I deliberately made space for it.", score: 3 },
    { text: "I build real recovery in regularly — I've learned it's not optional.", score: 4 },
  ]},

  // ── URGENCY ───────────────────────────────────────────────────────────────────
  // Scenario
  { theme: "Urgency", text: "A message arrives at 9pm. What actually happens?", answers: [
    { text: "I respond — faster is better.", score: 1 },
    { text: "I feel anxious until I respond, even if I wait.", score: 2 },
    { text: "I decide based on actual importance, not timing.", score: 3 },
    { text: "It waits until morning unless it's a real emergency.", score: 4 },
  ]},
  { theme: "Urgency", text: "In how you actually operate day-to-day, speed and importance are:", answers: [
    { text: "Basically the same thing — fast means it matters.", score: 1 },
    { text: "Different in theory, but hard to separate in practice.", score: 2 },
    { text: "I can usually tell the difference, even when urgency blurs it.", score: 3 },
    { text: "Clearly distinct — I evaluate both before responding.", score: 4 },
  ]},
  { theme: "Urgency", text: "The relief you feel after finishing something urgent is:", answers: [
    { text: "Proof that acting quickly was the right call.", score: 1 },
    { text: "Temporary — something else is usually already waiting.", score: 2 },
    { text: "Just the system settling. Not necessarily proof of correctness.", score: 3 },
    { text: "Something I've learned not to confuse with actual resolution.", score: 4 },
  ]},
  // Scenario
  { theme: "Urgency", text: "A colleague marks a request 'urgent' — but the actual deadline is three days away. You:", answers: [
    { text: "Treat it as urgent because that's how it was labeled.", score: 1 },
    { text: "Feel the pull of urgency even though you know the timeline is flexible.", score: 2 },
    { text: "Note the real deadline and plan accordingly, but acknowledge the tension.", score: 3 },
    { text: "Recognize this as a manufactured urgency and respond to the actual deadline.", score: 4 },
  ]},
  { theme: "Urgency", text: "Your relationship with notifications is:", answers: [
    { text: "On for everything — I don't want to miss something important.", score: 1 },
    { text: "Mostly on; I try to ignore them when focused but usually can't.", score: 2 },
    { text: "I've turned off most alerts and check on my own schedule.", score: 3 },
    { text: "Intentionally managed — I access information when I decide to, not when I'm signaled.", score: 4 },
  ]},

  // ── INTERNAL RULES ────────────────────────────────────────────────────────────
  { theme: "Internal Rules", text: "The rules that shape how you work were mostly:", answers: [
    { text: "Absorbed from environments I was in — I didn't consciously choose them.", score: 1 },
    { text: "A mix. Some chosen, some just happened.", score: 2 },
    { text: "I've identified a few key ones and am examining them.", score: 3 },
    { text: "Largely examined — I know which ones I've kept and which I've released.", score: 4 },
  ]},
  { theme: "Internal Rules", text: "When you fall short of your own standard, it feels like:", answers: [
    { text: "Evidence of something about who I am.", score: 1 },
    { text: "It lingers longer than it probably should.", score: 2 },
    { text: "A problem to understand and solve.", score: 3 },
    { text: "Data — something to learn from without a lot of charge attached.", score: 4 },
  ]},
  { theme: "Internal Rules", text: "Being available when people need you means:", answers: [
    { text: "You're responsible and reliable — it's who you are.", score: 1 },
    { text: "It matters to you even when it costs more than it should.", score: 2 },
    { text: "Something you value but actively set limits around.", score: 3 },
    { text: "One part of reliability — not the whole definition of it.", score: 4 },
  ]},
  // Scenario
  { theme: "Internal Rules", text: "Someone close to you mentions they've started turning off work email after 6pm. Your first honest reaction is:", answers: [
    { text: "That seems risky — what if something important comes up?", score: 1 },
    { text: "I admire it, but I'm not sure I could do it without anxiety.", score: 2 },
    { text: "Honestly interesting — I've thought about something similar.", score: 3 },
    { text: "Familiar — I've made similar decisions or am actively working toward them.", score: 4 },
  ]},
  { theme: "Internal Rules", text: "When you take on more than you have capacity for, the reason is usually:", answers: [
    { text: "Saying no didn't feel like a real option.", score: 1 },
    { text: "I agreed before thinking it through clearly.", score: 2 },
    { text: "I assessed the trade-off and consciously absorbed it.", score: 3 },
    { text: "This happens less now — I've gotten better at reading my own limits.", score: 4 },
  ]},

  // ── RECONFIGURATION ───────────────────────────────────────────────────────────
  { theme: "Reconfiguration", text: "Your current level of alertness and readiness feels:", answers: [
    { text: "This is just how I am — I'm not sure it's something to change.", score: 1 },
    { text: "Higher than it needs to be, but I haven't figured out how to bring it down.", score: 2 },
    { text: "Something I'm actively working on — I can see movement.", score: 3 },
    { text: "Largely calibrated to what's actually in front of me.", score: 4 },
  ]},
  { theme: "Reconfiguration", text: "When you try to rest or fully disconnect, you:", answers: [
    { text: "Can't really — the thinking doesn't stop.", score: 1 },
    { text: "Manage it sometimes, but feel guilty or anxious.", score: 2 },
    { text: "Have gotten better at it, though it still takes intention.", score: 3 },
    { text: "Can do it without much internal resistance.", score: 4 },
  ]},
  { theme: "Reconfiguration", text: "The gap between where you are and where you want to be is mostly:", answers: [
    { text: "I haven't mapped it clearly — I'm not sure what's running.", score: 1 },
    { text: "Visible, but I don't know how to close it.", score: 2 },
    { text: "I have a sense of what needs to happen and I'm moving toward it.", score: 3 },
    { text: "Smaller than it used to be — I'm on the other side of the hardest part.", score: 4 },
  ]},
  // Scenario
  { theme: "Reconfiguration", text: "You notice that you consistently feel depleted by Sunday evening. You:", answers: [
    { text: "Assume it's just part of having a full, demanding life.", score: 1 },
    { text: "Wonder about it briefly but don't know what to do with it.", score: 2 },
    { text: "Try to identify the pattern and experiment with what causes it.", score: 3 },
    { text: "Treat it as diagnostic data — something in the configuration is producing that outcome.", score: 4 },
  ]},
  { theme: "Reconfiguration", text: "The idea of changing how you operate — not just what you do, but the underlying configuration — feels:", answers: [
    { text: "Unclear to me. Behavior is behavior.", score: 1 },
    { text: "Something I understand in theory but struggle to apply.", score: 2 },
    { text: "A distinction I'm actively working with in my own life.", score: 3 },
    { text: "Central to how I think about change — the how is where all the leverage is.", score: 4 },
  ]},
];

// ─── PROFILES ─────────────────────────────────────────────────────────────────
const PROFILES = {
  Pressure: {
    name: "The Endurance System",
    tagline: "You've built a life around what you can carry.",
    color: "#8b6e52",
    body: [
      "Your system reads pressure as a test — and tests are meant to be passed. So you endure. You've gotten very good at carrying things, functioning under weight, and continuing when others would stop. That capability is real.",
      "What isn't being asked often enough: whether the conditions generating the pressure are ones worth continuing inside. Endurance keeps you inside situations that may not deserve to continue. It's a response, not a strategy.",
      "The signal underneath the exhaustion isn't asking you to become stronger. It's asking you to become clearer — about what this pressure means, and whether it's coming through pathways that were ever meant to handle this volume.",
    ],
    insight: "Pressure is a signal, not a test. Tests are meant to be passed. Signals are meant to be read.",
    essayIds: [1, 2, 11, 12],
  },
  Urgency: {
    name: "The High-Frequency System",
    tagline: "Urgency has become the default, not the exception.",
    color: "#4e6878",
    body: [
      "At some point, urgency stopped being a mode you entered and became the frequency you operate at. The fire drill isn't the exception — it's the schedule. And because everything arrives with pressure, everything feels equally critical.",
      "The urgency-action-relief loop has been running long enough that the relief feels like confirmation. It isn't. It's just the nervous system returning to baseline because a rule was satisfied. The quiet that follows action isn't proof of correctness — it's proof of compliance.",
      "The cost isn't just exhaustion. It's discernment. When urgency is the default, you stop choosing what matters and start obeying whatever arrives first.",
    ],
    insight: "Urgency is not truth. It is enforcement. And what it enforces most reliably is compliance — not correctness.",
    essayIds: [3, 4, 15, 16],
  },
  "Internal Rules": {
    name: "The Open Port System",
    tagline: "Some of your most powerful operating instructions were never consciously approved.",
    color: "#5f7050",
    body: [
      "Rules don't announce themselves. They form quietly — in environments where certain behaviors were rewarded, in seasons where particular responses kept you safe. By the time you're an adult, most of the rules are already running. You just don't know it.",
      "The cybersecurity parallel is precise: an open port was created because something once needed access. The access made sense in context. The problem is when no one tracks whether that access is still warranted — when the original use case expired but the port remains open, granting entry automatically.",
      "You're not choosing all of your responses right now. Some of them are being chosen by configurations you didn't consciously adopt and may not have examined.",
    ],
    insight: "You cannot choose whether to keep a rule you cannot see. Visibility isn't action — but nothing changes without it.",
    essayIds: [5, 6, 18, 20],
  },
  Reconfiguration: {
    name: "The Drifted System",
    tagline: "Your baseline shifted while you were surviving something.",
    color: "#7a6b52",
    body: [
      "Baselines don't collapse. They drift. Not dramatically, not with announcement. What once felt unsustainable becomes manageable. What once registered as strain becomes background noise. The reference point for what's actually wrong quietly moves.",
      "You probably can't remember choosing this baseline. You remember surviving something — a hard season, a period where this level of alertness was genuinely necessary. Those settings worked. That's why they stayed.",
      "What the system doesn't do automatically is update when the emergency ends. The conditions that required that posture expired. The posture remains. And the gap between those two facts is where the exhaustion lives.",
    ],
    insight: "Resilience without review eventually becomes entrapment. The system keeps running — just a little less well than before.",
    essayIds: [8, 9, 23, 24],
  },
};

// Brief descriptions shown under the secondary profile
const SECONDARY_READS = {
  Pressure: "Pressure is also running close to the surface — likely as endurance. The question worth asking: is the capacity to carry more actually serving you, or just sustaining the load?",
  Urgency: "Urgency is running close behind your primary pattern. The fast-response loop may be reinforcing the primary configuration — each one feeding the other.",
  "Internal Rules": "Some of the rules governing how you operate are also present here — granting access to your time and attention without evaluation. Worth auditing alongside the primary.",
  Reconfiguration: "Baseline drift is also present. The gap between current settings and what the situation actually requires may be wider than it currently appears.",
};

// ─── PROFILE INTERACTIONS ─────────────────────────────────────────────────────
const PROFILE_INTERACTIONS = {
  "Pressure+Urgency": "When the endurance pattern and high-frequency urgency run together, they form a self-reinforcing loop: pressure builds, urgency fires, action follows, brief relief arrives — then the cycle resets. Endurance keeps you inside the loop; urgency keeps it spinning. Neither one questions whether the loop itself is necessary.",
  "Pressure+Internal Rules": "When endurance and unexamined rules run together, the rules supply the justification for why the pressure has to be carried. 'This is what responsible people do.' 'I can't say no here.' The endurance provides the capacity to keep going; the rules provide the permission structure that makes stopping feel impossible.",
  "Pressure+Reconfiguration": "When endurance and baseline drift run together, the system becomes very good at absorbing what would otherwise register as too much. The drift adjusts the reference point so the load feels normal. The endurance makes the adjusted baseline sustainable. Together, they make the problem invisible — functional on the outside, quietly depleted underneath.",
  "Urgency+Pressure": "When high-frequency urgency and the endurance pattern run together, urgency supplies a constant stream of inputs that feel critical, and endurance provides the stamina to respond to all of them. The result is a high-output, high-cost system that looks like effectiveness but is operating well above its intended load.",
  "Urgency+Internal Rules": "When urgency and unexamined rules run together, the rules are often what keep the urgency channel open. A rule that says 'I have to be available' means every incoming signal gets through automatically — urgency fires, the rule grants access, the response follows without evaluation. Addressing urgency alone won't close the port the rule created.",
  "Urgency+Reconfiguration": "When high-frequency urgency and baseline drift run together, the elevated urgency state has often been running long enough to feel normal. The drift recalibrated around a system that's always reactive. What feels like 'just how I am' is actually a posture that was useful at some point and then became the permanent setting.",
  "Internal Rules+Pressure": "When unexamined rules and endurance run together, the rules define what carrying your weight means — and the endurance ensures you keep meeting that standard regardless of cost. The rules set the threshold; the endurance ensures compliance. What looks like integrity from the outside can be invisible self-depletion from the inside.",
  "Internal Rules+Urgency": "When unexamined rules and high-frequency urgency run together, the rules are often the mechanism that keeps urgency in authority. The rule says respond quickly; urgency provides the pressure to comply. The combination means the system rarely evaluates — it just obeys. The path to change runs through the rules, not just through managing the urgency.",
  "Internal Rules+Reconfiguration": "When unexamined rules and baseline drift run together, you're likely dealing with configurations that have been running the longest and drifted furthest from conscious choice. The rules settled in early; the drift happened gradually around them. This pattern tends to be the most stable — which makes it the hardest to see clearly from the inside.",
  "Reconfiguration+Pressure": "When baseline drift and endurance run together, the drift often explains why the endurance feels necessary. The reference point for 'normal' has shifted to a level that requires significant carrying capacity to sustain. The endurance isn't the root problem — the drifted baseline it's supporting is. Addressing the baseline is the more leveraged intervention.",
  "Reconfiguration+Urgency": "When baseline drift and high-frequency urgency run together, the urgency has likely been absorbed into the baseline itself. What started as a response to genuine pressure has become the pace of life — so urgency no longer feels like an alarm, it just feels like the background. The urgency isn't experienced as exceptional anymore; it's experienced as normal.",
  "Reconfiguration+Internal Rules": "When baseline drift and unexamined rules run together, the rules are often what caused the drift in the first place. Rules about availability, performance, and what's acceptable created the conditions that pushed the baseline over time. The drift is the outcome; the rules are the mechanism. This combination tends to respond well to visibility — not pressure to change, but honest inspection of what's actually running.",
};

// ─── NEXT STEPS ───────────────────────────────────────────────────────────────
const NEXT_STEPS = {
  Pressure: {
    heading: "One Thing to Try This Week",
    body: "Notice the next time you push through something instead of stopping. Don't try to change it — just pause for a moment and ask: what would it mean if I didn't push through here? You're not looking for an answer. You're just opening the question.",
  },
  Urgency: {
    heading: "One Thing to Try This Week",
    body: "Before you respond to the next thing that feels urgent, pause for ten seconds and ask: is this actually time-sensitive, or does it just feel that way? You don't have to decide differently. Just notice what urgency actually is — and what it isn't. That gap is where discernment lives.",
  },
  "Internal Rules": {
    heading: "One Thing to Try This Week",
    body: "Pick one recurring obligation — something you do automatically without deciding. Ask: did I consciously choose this, or did it just become expected? You don't have to change it. Just name it. Visibility is the first move, not action.",
  },
  Reconfiguration: {
    heading: "One Thing to Try This Week",
    body: "Think back to a period when you operated differently — less alert, more at ease. What was present then that isn't now? That gap is diagnostic data. It tells you something about what your current settings are compensating for — and whether the thing they were compensating for is still there.",
  },
};

// Per-theme score interpretation (out of 20 max, 5 questions)
const SCORE_READS = {
  Pressure: {
    low:     "Deeply embedded. Pressure has become the operating environment — so normalized it rarely registers as a signal anymore.",
    midLow:  "Active but partially visible. You notice pressure when it's severe, but the baseline level runs without much inspection.",
    midHigh: "Developing awareness. You've started reading the signals — the difficult part, and the necessary one.",
    high:    "Largely calibrated. Pressure mostly registers as information for you, not obligation.",
  },
  Urgency: {
    low:     "Deeply embedded. Your system treats urgency as authority — the signal fires and response follows before you've evaluated whether it should.",
    midLow:  "Active but partially visible. Urgency still moves you faster than necessary, but you're beginning to notice the loop.",
    midHigh: "Developing latency. You've started putting space between urgency and action. That gap is where discernment lives.",
    high:    "Largely calibrated. Urgency no longer runs automatically — you evaluate before acting.",
  },
  "Internal Rules": {
    low:     "Deeply embedded. Rules you didn't consciously choose are operating quietly — granting access to your time and energy without evaluation.",
    midLow:  "Active but partially visible. You've identified some rules, but the deeper ones are still running beneath the surface.",
    midHigh: "Active inspection. You're auditing the rules you operate by. Most people never get this far.",
    high:    "Largely calibrated. You have real visibility into your internal rules and can evaluate which ones still serve you.",
  },
  Reconfiguration: {
    low:     "Deeply embedded. Current settings have been running long enough to feel like personality — the drift is real, but inspection hasn't happened yet.",
    midLow:  "Active but partially visible. You're aware reconfiguration is possible, but the mechanics are still unclear.",
    midHigh: "Active work. You're approaching change as a systems problem, not a willpower problem. That's the right frame.",
    high:    "Largely calibrated. Visibility and inspection are part of how you operate — you treat your own patterns as worth understanding.",
  },
};

function getScoreRead(theme, score) {
  const r = SCORE_READS[theme];
  if (score <= 9)  return r.low;
  if (score <= 13) return r.midLow;
  if (score <= 17) return r.midHigh;
  return r.high;
}

// ─── SCORING ──────────────────────────────────────────────────────────────────
function computeScores(answers) {
  const scores = { Pressure: 0, Urgency: 0, "Internal Rules": 0, Reconfiguration: 0 };
  answers.forEach(({ theme, score }) => { scores[theme] += score; });
  return scores;
}

function computeProfiles(scores) {
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  return {
    primary: sorted[0][0],
    secondary: sorted[1][0],
    isTied: sorted[1][1] - sorted[0][1] <= 1,
  };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function SystemAuditPage({ mobile, px, essays: passedEssays }) {
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [secondaryProfile, setSecondaryProfile] = useState(null);
  const [isTied, setIsTied] = useState(false);
  const [scores, setScores] = useState(null);
  const [fade, setFade] = useState(true);

  const essays = passedEssays || LOCAL_ESSAYS;
  const totalQ = QUESTIONS.length;
  const progress = (qIndex / totalQ) * 100;

  function handleAnswer(score) {
    const q = QUESTIONS[qIndex];
    const newAnswers = [...answers, { theme: q.theme, score }];
    setAnswers(newAnswers);

    if (qIndex < totalQ - 1) {
      setFade(false);
      setTimeout(() => {
        setQIndex(qIndex + 1);
        setFade(true);
      }, 200);
    } else {
      const computed = computeScores(newAnswers);
      const { primary, secondary, isTied: tied } = computeProfiles(computed);
      setScores(computed);
      setProfile(primary);
      setSecondaryProfile(secondary);
      setIsTied(tied);
      setStep("email");
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      await saveAuditResult({
        email: email.trim(),
        name: name.trim(),
        scores,
        profile,
        secondaryProfile,
      });
      sendAuditResultEmail({
        email: email.trim(),
        name: name.trim(),
        profile,
        secondaryProfile,
        scores,
      }).catch(() => {});
    } catch (err) {
      console.warn("saveAuditResult failed:", err.message);
    } finally {
      setSubmitting(false);
      setStep("results");
    }
  }

  function restart() {
    setStep("intro");
    setQIndex(0);
    setAnswers([]);
    setName("");
    setEmail("");
    setError("");
    setProfile(null);
    setSecondaryProfile(null);
    setIsTied(false);
    setScores(null);
    setFade(true);
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div>
        <div style={{ background: C.navy, padding: mobile ? `72px ${px}` : `96px ${px}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 30% 50%, ${C.navyLight} 0%, transparent 65%)`, opacity: 0.8 }} />
          <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ width: 36, height: 2, background: C.gold, marginBottom: 20 }} />
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold, marginBottom: 18 }}>
              System Diagnostic
            </p>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(32px,9vw,52px)" : "clamp(36px,5vw,60px)", fontWeight: 900, color: C.cream, lineHeight: 1.08, marginBottom: 24, letterSpacing: "-.02em" }}>
              Scan Your System
            </h1>
            <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: mobile ? 16 : 18, lineHeight: 1.78, color: "rgba(244,239,230,.72)", marginBottom: 20, fontStyle: "italic" }}>
              Twenty questions. Four frameworks. A primary and secondary profile — a more complete picture of what's actually running.
            </p>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 15 : 16, lineHeight: 1.88, color: "rgba(244,239,230,.55)", marginBottom: 40, maxWidth: 580 }}>
              This audit is built around the four frameworks in <em style={{ color: "rgba(244,239,230,.75)" }}>Unsecured</em> — Pressure, Urgency, Internal Rules, and Reconfiguration. Answer honestly, not aspirationally. The result isn't a score. It's a profile — a picture of where your system is operating and what it may need next.
            </p>
            <button
              onClick={() => setStep("quiz")}
              style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "16px 36px", background: C.gold, color: C.navy, border: "none", cursor: "pointer", transition: "all .22s", minHeight: 52 }}
              onMouseOver={e => { e.currentTarget.style.background = C.goldLight; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = "none"; }}
            >
              Begin the Audit
            </button>
          </div>
        </div>

        <div style={{ background: C.creamDark, borderBottom: `1px solid ${C.g200}`, padding: mobile ? `48px ${px}` : `64px ${px}` }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: mobile ? 28 : 40 }}>
              {[
                { n: "20", label: "Questions", sub: "Five per framework — direct and scenario-based, designed to surface how you actually operate." },
                { n: "4", label: "Frameworks", sub: "Pressure, Urgency, Internal Rules, and Reconfiguration." },
                { n: "2", label: "Profiles", sub: "A primary and secondary configuration — because most systems are running more than one pattern." },
              ].map(({ n, label, sub }) => (
                <div key={label} style={{ textAlign: mobile ? "left" : "center" }}>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? 36 : 40, fontWeight: 900, color: C.navy, lineHeight: 1, marginBottom: 6 }}>{n}</p>
                  <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>{label}</p>
                  <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, lineHeight: 1.75, color: C.g600 }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  if (step === "quiz") {
    const q = QUESTIONS[qIndex];
    const qNum = String(qIndex + 1).padStart(2, "0");
    const totalNum = String(totalQ).padStart(2, "0");

    return (
      <div style={{ minHeight: "80vh", background: C.g100 }}>
        <div style={{ height: 3, background: C.g200, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ height: "100%", background: C.gold, width: `${progress}%`, transition: "width .4s ease" }} />
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: mobile ? `48px ${px}` : `72px ${px}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
            <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 28 : 36, fontWeight: 700, color: C.gold, letterSpacing: "-.01em", lineHeight: 1 }}>
              {qNum}
            </span>
            <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g400, letterSpacing: ".06em" }}>
              / {totalNum}
            </span>
            <span style={{ marginLeft: "auto", fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "4px 10px", background: `${TC[q.theme]}16`, color: TC[q.theme], border: `1px solid ${TC[q.theme]}30` }}>
              {q.theme}
            </span>
          </div>

          <div key={qIndex} style={{ opacity: fade ? 1 : 0, transition: "opacity .2s ease" }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(20px,5vw,28px)" : "clamp(22px,3.5vw,32px)", fontWeight: 700, color: C.navy, lineHeight: 1.35, marginBottom: 36, letterSpacing: "-.01em" }}>
              {q.text}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.answers.map((ans, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(ans.score)}
                  style={{ width: "100%", textAlign: "left", padding: mobile ? "18px 20px" : "20px 28px", background: "white", border: `1.5px solid ${C.g200}`, cursor: "pointer", transition: "all .2s", fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 15 : 16, color: C.g800, lineHeight: 1.55, display: "flex", alignItems: "center", gap: 16 }}
                  onMouseOver={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.color = C.cream; e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.paddingLeft = mobile ? "26px" : "34px"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = C.g800; e.currentTarget.style.borderColor = C.g200; e.currentTarget.style.paddingLeft = mobile ? "20px" : "28px"; }}
                >
                  <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, color: C.gold, flexShrink: 0, letterSpacing: ".06em" }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {ans.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EMAIL GATE ─────────────────────────────────────────────────────────────
  if (step === "email") {
    return (
      <div style={{ minHeight: "80vh", background: C.navy, display: "flex", alignItems: "center", padding: mobile ? `64px ${px}` : `96px ${px}` }}>
        <div style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
          <div style={{ width: 36, height: 2, background: C.gold, marginBottom: 24 }} />
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(26px,7vw,40px)" : "clamp(28px,4vw,44px)", fontWeight: 900, color: C.cream, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-.02em" }}>
            Your results are ready.
          </h1>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 15 : 16, lineHeight: 1.8, color: "rgba(244,239,230,.6)", marginBottom: 36 }}>
            Enter your email to receive your system profile — primary configuration, secondary pattern, and a full score breakdown.
          </p>

          <form onSubmit={handleEmailSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={gateLabel}>First Name <span style={{ color: C.g400, fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                style={gateInput}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.navyLight}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={gateLabel}>Email <span style={{ color: "#c0392b" }}>*</span></label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                style={gateInput}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.navyLight}
              />
            </div>
            {error && <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: "#e74c3c", marginBottom: 16 }}>{error}</p>}
            <button
              type="submit" disabled={submitting}
              style={{ width: "100%", fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "16px 28px", background: submitting ? C.navyLight : C.gold, color: C.navy, border: "none", cursor: submitting ? "not-allowed" : "pointer", transition: "all .22s", minHeight: 52, opacity: submitting ? 0.7 : 1 }}
              onMouseOver={e => { if (!submitting) e.currentTarget.style.background = C.goldLight; }}
              onMouseOut={e => { if (!submitting) e.currentTarget.style.background = C.gold; }}
            >
              {submitting ? "Saving…" : "Get My Results"}
            </button>
          </form>

          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: "rgba(244,239,230,.3)", marginTop: 18, lineHeight: 1.6 }}>
            Your email is used to send your profile. No spam, ever.
          </p>
        </div>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (step === "results" && profile && scores) {
    const p = PROFILES[profile];
    const sp = secondaryProfile ? PROFILES[secondaryProfile] : null;
    const relatedEssays = p.essayIds.map(id => essays.find(e => e.id === id)).filter(Boolean);
    const maxScore = 20;

    return (
      <div>
        {/* Primary profile hero */}
        <div style={{ background: C.navy, padding: mobile ? `72px ${px}` : `96px ${px}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 20% 50%, ${C.navyLight} 0%, transparent 60%)`, opacity: 0.9 }} />
          <div style={{ maxWidth: 760, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ width: 36, height: 2, background: p.color, marginBottom: 20 }} />
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: p.color, marginBottom: 14 }}>
              Primary Configuration
            </p>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(28px,8vw,48px)" : "clamp(32px,5vw,56px)", fontWeight: 900, color: C.cream, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-.02em" }}>
              {p.name}
            </h1>
            <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: mobile ? 17 : 20, fontStyle: "italic", color: "rgba(244,239,230,.65)", lineHeight: 1.55 }}>
              {p.tagline}
            </p>
            {isTied && (
              <div style={{ marginTop: 20, padding: "12px 18px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", display: "inline-flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: "rgba(244,239,230,.6)", lineHeight: 1.5 }}>
                  Your primary and secondary patterns scored within one point of each other — both are worth your full attention.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Score grid — all 4 themes with tier descriptions */}
        <div style={{ background: C.creamDark, borderBottom: `1px solid ${C.g200}`, padding: mobile ? `32px ${px}` : `44px ${px}` }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.g400, marginBottom: 6 }}>
              Full Configuration Scan
            </p>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g600, marginBottom: 18, lineHeight: 1.6 }}>
              Lower scores indicate patterns running most actively. The bar shows pattern depth — fuller means more embedded.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: mobile ? 10 : 14 }}>
              {Object.entries(scores)
                .sort((a, b) => a[1] - b[1])
                .map(([theme, score]) => {
                  const isPrimary = theme === profile;
                  const isSecondary = theme === secondaryProfile;
                  // Bar shows embedded-ness: min score is 5 (5q × 1), max is 20 (5q × 4)
                  const embPct = Math.round(((maxScore - score) / (maxScore - 5)) * 100);
                  return (
                    <div key={theme} style={{ padding: "16px 16px 18px", background: isPrimary ? `${TC[theme]}14` : isSecondary ? `${TC[theme]}08` : "white", border: `1.5px solid ${isPrimary ? TC[theme] : isSecondary ? TC[theme] + "55" : C.g200}`, position: "relative" }}>
                      {isPrimary && (
                        <span style={{ position: "absolute", top: -10, right: 8, fontFamily: "'Source Sans 3',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", background: TC[theme], color: "white", padding: "2px 8px" }}>
                          Primary
                        </span>
                      )}
                      {isSecondary && !isPrimary && (
                        <span style={{ position: "absolute", top: -10, right: 8, fontFamily: "'Source Sans 3',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", background: TC[theme] + "99", color: "white", padding: "2px 8px" }}>
                          Secondary
                        </span>
                      )}
                      <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: TC[theme], marginBottom: 6 }}>{theme}</p>
                      <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: C.navy, lineHeight: 1, marginBottom: 2 }}>{score}</p>
                      <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, color: C.g400, marginBottom: 8 }}>out of {maxScore}</p>
                      {/* Pattern depth bar — fuller = more embedded/active */}
                      <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.g400, marginBottom: 4 }}>Pattern Depth</p>
                      <div style={{ height: 3, background: C.g200, marginBottom: 10 }}>
                        <div style={{ height: "100%", background: TC[theme], width: `${embPct}%` }} />
                      </div>
                      <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, lineHeight: 1.65, color: C.g600 }}>
                        {getScoreRead(theme, score)}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Primary profile body */}
        <div style={{ maxWidth: 760, margin: "0 auto", padding: mobile ? `48px ${px}` : `72px ${px}` }}>
          <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, marginBottom: 20 }}>
            What This Profile Means
          </p>
          {p.body.map((para, i) => (
            <p key={i} style={{ fontFamily: "'Libre Baskerville',serif", fontSize: mobile ? 16 : 17, lineHeight: 1.94, color: C.g800, marginBottom: "1.75em" }}>
              {para}
            </p>
          ))}

          <div style={{ margin: "48px 0", padding: mobile ? "24px 24px" : "32px 40px", border: `2px solid ${C.gold}`, borderLeft: `4px solid ${C.gold}`, background: "#fdfbf7" }}>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(17px,4.5vw,22px)" : "clamp(18px,2.5vw,24px)", fontStyle: "italic", color: C.navy, lineHeight: 1.55, margin: 0 }}>
              "{p.insight}"
            </p>
          </div>

          {/* Secondary profile card */}
          {sp && (
            <div style={{ marginBottom: 56 }}>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.g400, marginBottom: 14 }}>
                Secondary Configuration
              </p>
              <div style={{ background: "white", border: `1px solid ${C.g200}`, borderTop: `3px solid ${sp.color}`, padding: mobile ? "24px 22px" : "28px 32px" }}>
                <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: sp.color, marginBottom: 8 }}>
                  {secondaryProfile}
                </p>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? 20 : 22, fontWeight: 700, color: C.navy, marginBottom: 10, lineHeight: 1.2 }}>
                  {sp.name}
                </h3>
                <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: mobile ? 15 : 16, fontStyle: "italic", color: C.g600, lineHeight: 1.7, marginBottom: 12 }}>
                  {sp.tagline}
                </p>
                <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, lineHeight: 1.82, color: C.g600, margin: 0 }}>
                  {SECONDARY_READS[secondaryProfile]}
                </p>
              </div>
            </div>
          )}

          {/* Profile interaction */}
          {sp && PROFILE_INTERACTIONS[`${profile}+${secondaryProfile}`] && (
            <div style={{ marginBottom: 56 }}>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, marginBottom: 14 }}>
                How These Patterns Work Together
              </p>
              <div style={{ padding: mobile ? "24px 22px" : "28px 36px", background: C.creamDark, borderLeft: `3px solid ${C.gold}` }}>
                <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 14 : 15, lineHeight: 1.9, color: C.g800 }}>
                  {PROFILE_INTERACTIONS[`${profile}+${secondaryProfile}`]}
                </p>
              </div>
            </div>
          )}

          {/* Essay recommendations */}
          <div style={{ marginTop: sp ? 0 : 56 }}>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>
              Start Here
            </p>
            <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 14, color: C.g600, marginBottom: 28, lineHeight: 1.75 }}>
              These pieces connect directly to where your system is right now.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              {relatedEssays.map(essay => (
                <div
                  key={essay.id}
                  style={{ background: "white", border: `1px solid ${C.g200}`, padding: mobile ? "22px 20px" : "28px 26px", transition: "all .26s" }}
                  onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.08)"; e.currentTarget.style.borderColor = C.g400; }}
                  onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.g200; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 10px", background: `${TC[essay.theme]}16`, color: TC[essay.theme], border: `1px solid ${TC[essay.theme]}30` }}>
                      {essay.theme}
                    </span>
                    <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, color: C.g400 }}>{essay.readTime}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? 17 : 19, fontWeight: 700, color: C.navy, lineHeight: 1.3, marginBottom: 10 }}>
                    {essay.title}
                  </h3>
                  <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, lineHeight: 1.75, color: C.g600, margin: 0 }}>
                    {essay.hook}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Next step */}
          {NEXT_STEPS[profile] && (
            <div style={{ marginTop: 56, marginBottom: 0 }}>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>
                {NEXT_STEPS[profile].heading}
              </p>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: C.g600, marginBottom: 20, lineHeight: 1.75 }}>
                Based on your primary configuration — {profile}.
              </p>
              <div style={{ padding: mobile ? "24px 22px" : "28px 36px", background: "white", border: `1px solid ${C.g200}`, borderLeft: `4px solid ${p.color}` }}>
                <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: mobile ? 15 : 16, lineHeight: 1.9, color: C.g800, margin: 0 }}>
                  {NEXT_STEPS[profile].body}
                </p>
              </div>
            </div>
          )}

          {/* Book CTA */}
          <div style={{ marginTop: 64, background: C.navy, padding: mobile ? "32px 28px" : "48px 52px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 80% 50%, ${C.navyLight} 0%, transparent 60%)`, opacity: 0.7 }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: C.gold, marginBottom: 12 }}>
                The Full Picture
              </p>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobile ? "clamp(20px,5vw,28px)" : "clamp(22px,3vw,32px)", fontWeight: 900, color: C.cream, marginBottom: 16, lineHeight: 1.2, letterSpacing: "-.01em" }}>
                Unsecured: Why Pressure Isn't the Problem
              </h3>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: mobile ? 14 : 15, lineHeight: 1.85, color: "rgba(244,239,230,.6)", marginBottom: 28, maxWidth: 520 }}>
                This audit surfaces two patterns. The book maps the full terrain — where these configurations come from, why they persist, and what it actually takes to change them.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <a
                  href="https://a.co/d/0dpaVYPc"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "15px 28px", background: C.gold, color: C.navy, textDecoration: "none", display: "inline-block", transition: "all .22s", minHeight: 48 }}
                  onMouseOver={e => { e.currentTarget.style.background = C.goldLight; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = "none"; }}
                >
                  Get the Book
                </a>
                <button
                  onClick={restart}
                  style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "14px 28px", background: "transparent", color: "rgba(244,239,230,.5)", border: "1.5px solid rgba(244,239,230,.2)", cursor: "pointer", transition: "all .22s", minHeight: 48 }}
                  onMouseOver={e => { e.currentTarget.style.color = C.cream; e.currentTarget.style.borderColor = "rgba(244,239,230,.5)"; }}
                  onMouseOut={e => { e.currentTarget.style.color = "rgba(244,239,230,.5)"; e.currentTarget.style.borderColor = "rgba(244,239,230,.2)"; }}
                >
                  Retake Audit
                </button>
              </div>

              {/* Share results */}
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.1)" }}>
                <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(244,239,230,.3)", marginBottom: 12 }}>
                  Share your results
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    {
                      label: "Twitter / X",
                      onClick: () => {
                        const text = `I just ran the System Diagnostic from Unsecured by @JohnThornton — my primary profile is "${profile}." If you work inside pressure that never quite resolves, this audit is worth 5 minutes.`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin + "/#audit")}`, "_blank", "noopener,noreferrer");
                      },
                    },
                    {
                      label: "LinkedIn",
                      onClick: () => {
                        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + "/#audit")}`, "_blank", "noopener,noreferrer");
                      },
                    },
                    {
                      label: copied ? "Copied!" : "Copy Link",
                      onClick: () => {
                        navigator.clipboard.writeText(window.location.origin + "/#audit").then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2500);
                        });
                      },
                    },
                  ].map(({ label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "9px 16px", background: "transparent", color: "rgba(244,239,230,.45)", border: "1px solid rgba(244,239,230,.15)", cursor: "pointer", transition: "all .2s" }}
                      onMouseOver={e => { e.currentTarget.style.color = C.cream; e.currentTarget.style.borderColor = "rgba(244,239,230,.4)"; }}
                      onMouseOut={e => { e.currentTarget.style.color = "rgba(244,239,230,.45)"; e.currentTarget.style.borderColor = "rgba(244,239,230,.15)"; }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 12, lineHeight: 1.7, color: "rgba(244,239,230,.4)", marginTop: 22, maxWidth: 480 }}>
                This is a snapshot, not a verdict. Patterns can shift — and the shift itself is data. Come back in 30 days and retake the audit to see what's changed.
              </p>
              <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, color: "rgba(244,239,230,.22)", marginTop: 6, letterSpacing: ".06em" }}>
                Taken {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const gateLabel = {
  display: "block",
  fontFamily: "'Source Sans 3',sans-serif",
  fontSize: 11, fontWeight: 700, letterSpacing: ".12em",
  textTransform: "uppercase", color: "#9e9489", marginBottom: 8,
};

const gateInput = {
  width: "100%", padding: "14px 16px",
  border: "1.5px solid #1e2f42",
  background: "#162030", color: "#f4efe6",
  fontFamily: "'Source Sans 3',sans-serif", fontSize: 15,
  outline: "none", boxSizing: "border-box", borderRadius: 0, transition: "border-color .2s",
};
