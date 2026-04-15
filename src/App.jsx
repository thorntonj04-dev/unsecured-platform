import { useState, useEffect, useRef } from "react";

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  navy: "#0d1720", navyMid: "#162030", navyLight: "#1e2f42",
  cream: "#f4efe6", creamDark: "#ece5d8", creamDeep: "#e2d9c8",
  gold: "#b8943f", goldLight: "#d4a84b",
  g100: "#f7f5f2", g200: "#e5e0d8", g400: "#9e9489",
  g600: "#68605a", g800: "#2a2420",
};

const TC = {
  Pressure: "#8b6e52", Urgency: "#4e6878",
  "Internal Rules": "#5f7050", Reconfiguration: "#7a6b52",
};

const THEMES = ["All","Pressure","Urgency","Internal Rules","Reconfiguration"];

const MARQUEE_ITEMS = [
  "Pressure is a signal, not a test",
  "You are not broken — you are configured",
  "Urgency is not truth, it is enforcement",
  "Visibility before change",
  "Baseline drift is not a character flaw",
  "The loop can be interrupted",
  "Authority, not willpower",
  "Margin is where judgment lives",
];

// ─── ESSAYS ───────────────────────────────────────────────────────────────────
const ESSAYS = [
  { id:1, theme:"Pressure", readTime:"6 min", title:"Why Endurance Is the Wrong Goal", hook:"We've been taught to measure strength by how much we can carry. That measurement is wrong.", subhead:"The case against treating pressure like a test of character", body:["There's a quiet belief most high-performers carry into every difficult season: if I can just hold on long enough, things will stabilize. The endurance itself becomes the strategy. The suffering becomes the proof of commitment.","But endurance is a response, not a solution. It keeps you upright inside conditions that may not deserve to continue. When we treat pressure as something to survive, we stop asking whether the conditions creating it are ones we should accept.","The cybersecurity principle that reframes this: a system under sustained load doesn't need more endurance. It needs an assessment. Why is this load here? Is it legitimate? Is it coming through a pathway that was ever meant to handle this volume?","Pressure is a signal, not a test. Tests are meant to be passed. Signals are meant to be read. The moment you confuse the two, endurance becomes a form of avoidance.","You stop asking what the pressure means and start asking how much more you can take. That's the wrong question. And it leads somewhere you don't want to go."], bookTie:"This distinction between signal and test runs through the early chapters of Unsecured.", related:[2,4] },
  { id:2, theme:"Pressure", readTime:"5 min", title:"Normal Is a Disguise", hook:"The most dangerous pressure doesn't announce itself. It settles in and starts looking like your life.", subhead:"On how sustained load becomes invisible", body:["Normal is the most convincing disguise pressure can wear. A life that functions on the outside can be running well past its limits on the inside. The performance continues. The deliverables land. The cost accumulates in places no one is measuring.","If everything is working, how do you argue that something is wrong? The absence of failure gets misread as evidence of health. But a system running over capacity doesn't always crash loudly. It degrades quietly.","Pressure normalizes. That's its most effective trick. It doesn't need you to accept it — it just needs you to stop questioning it. And most of us stop questioning a long time before we stop feeling it."], bookTie:"Chapter 1 of Unsecured opens here.", related:[1,5] },
  { id:3, theme:"Urgency", readTime:"7 min", title:"The Loop That Teaches Urgency to Lie", hook:"Every time urgency fires and you act and feel relief — the loop gets stronger. The relief isn't proof the action was necessary.", subhead:"How the urgency-action-relief cycle rewires what feels true", body:["Urgency feels like truth. That's the problem. It arrives before thinking, before evaluation, before any question of whether the signal is accurate. By the time you're aware of it, you're already in motion.","The cycle: urgency fires, you act, relief follows. The chest loosens. The scanning stops. That relief feels like confirmation — proof that the action was necessary.","It wasn't. The relief was just the nervous system returning to baseline because a rule was satisfied. The quiet that follows action isn't evidence of correctness. It's evidence of compliance.","Interrupting the loop doesn't mean becoming unresponsive. It means introducing one small question before the action: is this urgency telling the truth right now, or is it enforcing a rule that no longer deserves authority?"], bookTie:"The urgency loop is mapped in Chapters 11 and 13 of Unsecured.", related:[4,6] },
  { id:4, theme:"Urgency", readTime:"5 min", title:"Speed Is Not the Same as Importance", hook:"When urgency becomes the default, everything feels equally critical. That's not clarity — that's noise.", subhead:"On how urgency collapses the difference between what's fast and what matters", body:["Urgency has one move: it makes things feel immediate. It doesn't evaluate importance. It doesn't weigh consequences. It compresses every signal into a single instruction: act now.","The problem is that speed and importance are different things. A message arriving at 10pm is not more important because it arrived at 10pm.","The antidote isn't slowing down. It's building latency back into the system — intentional space between signal and response where evaluation can happen. That space isn't laziness. It's the only place where real judgment occurs."], bookTie:"This sits at the center of the urgency chapters in Unsecured.", related:[3,7] },
  { id:5, theme:"Internal Rules", readTime:"6 min", title:"The Rules You Didn't Choose", hook:"Most of the rules you live by weren't decided. They were absorbed. And they've been making decisions ever since.", subhead:"On the configurations we carry from earlier seasons of life", body:["Rules don't announce themselves. They form quietly — in moments of necessity, in patterns we watched growing up. By the time we're adults, most of the rules are already running. We just don't know it.","A rule might sound like: being available means being responsible. Or: if I don't respond quickly, I become a liability. These rules feel like identity. They feel like who you are. But they're configurations.","The cybersecurity parallel: open ports. A port is opened because something once needed access. The risk is when no one remembers why it's still open — when the original need is long gone and the access remains.","Seeing a rule clearly doesn't mean closing it immediately. It means asking: does this still require this level of authority?"], bookTie:"Chapters 10 and 17 of Unsecured.", related:[6,8] },
  { id:6, theme:"Internal Rules", readTime:"5 min", title:"When Identity Gets Tied to Output", hook:"When performance becomes who you are, every missed deadline is a verdict about your worth.", subhead:"The specific cost of building yourself around what you deliver", body:["There's a version of work ethic that tips into something else. It starts as responsibility and sharpens into identity — the point where what you produce becomes the answer to who you are.","A missed deadline is no longer a scheduling problem. It's evidence of inadequacy. The system can no longer rest, because the threat isn't workload — it's exposure.","One system can absorb a hard week without crisis. The other can't afford to have one. And you don't always know which one you're running until a hard week arrives."], bookTie:"Chapter 7 of Unsecured.", related:[5,7] },
  { id:7, theme:"Internal Rules", readTime:"6 min", title:"Why Rest Doesn't Fix It", hook:"If rest were the solution, you'd feel better by now. The fact that you don't is useful information.", subhead:"On what rest can't reach — and what actually needs attention", body:["The advice is everywhere: rest more, disconnect. But for a certain kind of exhaustion, rest doesn't touch it. You take the vacation and come back just as depleted.","What rest can't fix is a misconfiguration. If the system is running rules that keep it in low-grade alertness — always scanning, always available — then rest is a pause in that state, not a change to it.","That question points somewhere rest can't reach — to the configuration underneath the exhaustion. Not a productivity problem. A systems problem. Systems problems don't respond to rest. They respond to inspection."], bookTie:"Chapter 7 of Unsecured.", related:[6,8] },
  { id:8, theme:"Reconfiguration", readTime:"7 min", title:"Visibility Before Change", hook:"You can't reconfigure what you can't see. And most people skip straight to trying to change.", subhead:"Why inspection — not action — is the first move", body:["There's a sequence that matters here, and most people collapse it. They feel something wrong and move immediately to correction. New habits. New commitments. The energy goes into change before the problem is understood.","In security work, the first step when a system shows strain isn't reconfiguration. It's visibility. See what's actually running. Understand what's consuming resources before deciding what to change.","Visibility was never meant to change the system. It was meant to show you where authority lives. That's what has to move before behavior can change sustainably. Not effort. Not willpower. Authority."], bookTie:"Chapters 12 and 14 of Unsecured.", related:[5,9] },
  { id:9, theme:"Reconfiguration", readTime:"5 min", title:"Baselines Don't Drift — They're Pulled", hook:"You didn't choose your current baseline. It formed while you were surviving something.", subhead:"On how survival settings outlast the emergencies that created them", body:["No one decides to make chronic alertness their default state. Those settings form in response to real conditions — real seasons where survival required a different posture.","The problem isn't that the settings were wrong. They were right for that moment. The problem is that moments end and settings don't update automatically.","Baselines don't drift randomly. They get pulled into place by the heaviest seasons and stay there. Recognizing that isn't self-pity. It's the beginning of an honest audit."], bookTie:"Chapter 16 of Unsecured.", related:[8,10] },
  { id:10, theme:"Reconfiguration", readTime:"6 min", title:"What It Means to Live with Margin", hook:"Margin isn't emptiness. It's the space where judgment lives.", subhead:"On building a system that can absorb pressure without being defined by it", body:["Margin gets misread as leisure — the buffer responsible people can't afford. But margin isn't what's left over when the real work is done. It's what makes the real work possible.","Living with margin doesn't mean doing less. It means operating inside a system deliberately designed to absorb pressure — one where not everything can reach you immediately.","The goal isn't protection from difficulty. The goal is a system configured to encounter difficulty without being destabilized by it. That's what it means to live securely. Not insulated from the world. Configured for it."], bookTie:"The final chapter of Unsecured.", related:[8,9] },
];

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return y;
}

function useMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 760);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

// ─── REVEAL ───────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, y = 20, style = {} }) {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : `translateY(${y}px)`,
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}s`,
      ...style
    }}>
      {children}
    </div>
  );
}

// ─── CRACK IMAGE ──────────────────────────────────────────────────────────────
//
// Uses the actual book cover crack photograph at /public/crack.png
//
// How it works:
//   mix-blend-mode: multiply  → on light backgrounds, white disappears,
//                                only the dark crack line stays visible
//   mix-blend-mode: screen    → on dark/navy backgrounds, dark disappears,
//                                the crack reads as a light fracture
//
// The image file lives at /public/crack.png in your project.
// Drop the photo there and it appears automatically — no other changes needed.
// If the file doesn't exist yet, the space stays clean (img fails silently).
//
// The photo is positioned so the crack threads through the right side of
// each section, matching how it appears on the book cover.
//
function CrackImage({
  // "multiply" for cream/light sections, "screen" for navy/dark sections
  blendMode = "multiply",
  // opacity — subtle by default so it doesn't overwhelm content
  opacity = 0.7,
  // How the image is positioned within its container
  style = {},
}) {
  return (
    <img
      src="/crack.png"
      alt=""
      aria-hidden="true"
      onError={e => { e.target.style.display = "none"; }} // graceful fallback
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "60% center", // keeps the crack in frame
        mixBlendMode: blendMode,
        opacity,
        pointerEvents: "none",
        userSelect: "none",
        ...style,
      }}
    />
  );
}

// ─── CRACK WRAPPER ────────────────────────────────────────────────────────────
// Positions the crack image within a section.
// Always absolute, always behind content (zIndex: 0).
// Parent section must have position: relative and overflow: hidden.
function CrackPanel({
  blendMode = "multiply",
  opacity = 0.7,
  // Right-side positioning — crack lives on the right like the book cover
  right = "0",
  width = "50%",   // how much of the section width the crack occupies
  top = "0",
  bottom = "0",
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top, bottom, right,
        width,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <CrackImage blendMode={blendMode} opacity={opacity} />
    </div>
  );
}

// ─── BOOK COVER ───────────────────────────────────────────────────────────────
function BookCoverDark({ size = 220 }) {
  const w = Math.round(size * 0.7); const h = size;
  return (
    <div style={{ width:w, height:h, background:`linear-gradient(155deg,${C.navyLight},${C.navy})`,
      position:"relative", boxShadow:`-8px 12px 40px rgba(0,0,0,.55)`, overflow:"hidden",
      flexShrink:0, transition:"transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease" }}
      onMouseOver={e=>{e.currentTarget.style.transform="translateY(-6px) rotate(-1deg)";e.currentTarget.style.boxShadow="-12px 20px 48px rgba(0,0,0,.65)"}}
      onMouseOut={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="-8px 12px 40px rgba(0,0,0,.55)"}}>
      <div style={{ position:"absolute",top:"43%",left:0,right:0,height:Math.round(h*.034),background:"linear-gradient(180deg,#5c3d1e,#8b6535 35%,#7a5a30 65%,#5c3d1e)",opacity:.85 }}/>
      <div style={{ position:"absolute",top:"6%",left:0,right:0,textAlign:"center",padding:`0 ${Math.round(w*.1)}px` }}>
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:Math.round(w*.128),fontWeight:700,letterSpacing:".03em",color:C.creamDark,lineHeight:1.05,marginBottom:Math.round(h*.016) }}>UNSECURED</div>
        <div style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:Math.round(w*.054),color:C.goldLight,letterSpacing:".1em",textTransform:"uppercase",lineHeight:1.45 }}>Why Pressure<br/>Isn't the Problem</div>
      </div>
      <div style={{ position:"absolute",bottom:"6%",left:0,right:0,textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:Math.round(w*.094),color:C.creamDark,letterSpacing:".02em",lineHeight:1.25 }}>JOHN<br/>THORNTON</div>
      </div>
    </div>
  );
}

// ─── MARQUEE ──────────────────────────────────────────────────────────────────
function Marquee() {
  const items = [...MARQUEE_ITEMS,...MARQUEE_ITEMS];
  return (
    <div style={{ background:C.navy,borderTop:`1px solid ${C.navyLight}`,borderBottom:`1px solid ${C.navyLight}`,overflow:"hidden",padding:"12px 0" }}>
      <style>{`@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}} .mq-t{display:flex;width:max-content;animation:mq 44s linear infinite}.mq-t:hover{animation-play-state:paused}`}</style>
      <div className="mq-t">
        {items.map((t,i) => (
          <span key={i} style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:10.5,fontWeight:600,letterSpacing:".18em",textTransform:"uppercase",color:i%2===0?C.goldLight:"rgba(244,239,230,.28)",whiteSpace:"nowrap",padding:"0 28px" }}>
            {t}{i%2!==0?" ·":""}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── EMAIL CAPTURE ────────────────────────────────────────────────────────────
function EmailCapture({ compact = false }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <section style={{ background:compact?"transparent":C.creamDark, padding:compact?"0":"64px 24px", borderTop:compact?"none":`1px solid ${C.g200}` }}>
      <Reveal>
        <div style={{ maxWidth:480, margin:"0 auto", textAlign:"center" }}>
          {!compact && <div style={{ width:40,height:2,background:C.gold,margin:"0 auto 20px" }}/>}
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:compact?20:"clamp(22px,3.5vw,30px)", fontWeight:700, color:C.navy, marginBottom:12, lineHeight:1.25, letterSpacing:"-.01em" }}>
            Get new thinking when it's released.
          </h2>
          {!compact && <p style={{ fontFamily:"'Source Sans 3',sans-serif", fontSize:15, lineHeight:1.8, color:C.g600, marginBottom:28 }}>New thinking, ideas, and perspectives. No noise in between.</p>}
          {done ? (
            <p style={{ fontFamily:"'Source Sans 3',sans-serif", fontSize:15, color:C.g600, padding:"16px 20px", background:"white", border:`1px solid ${C.g200}` }}>You're subscribed.</p>
          ) : (
            <div style={{ display:"flex", gap:8, maxWidth:380, margin:compact?"14px auto 0":"0 auto", flexWrap:"wrap" }}>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Your email" style={{ flex:1, minWidth:180 }}/>
              <button onClick={()=>email&&setDone(true)} style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",padding:"14px 22px",background:C.navy,color:C.cream,border:"none",cursor:"pointer",whiteSpace:"nowrap",transition:"all .22s" }}
                onMouseOver={e=>e.currentTarget.style.background=C.navyLight}
                onMouseOut={e=>e.currentTarget.style.background=C.navy}>
                Subscribe
              </button>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [essay, setEssay] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollY = useScrollY();
  const mobile = useMobile();
  const scrolled = scrollY > 48;

  useEffect(() => { window.scrollTo({ top:0, behavior:"smooth" }); }, [page, essay]);
  const go = (p) => { setPage(p); setEssay(null); setMenuOpen(false); };

  // Global styles
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-font-smoothing: antialiased; }
    body { overflow-x: hidden; }
    .pf { font-family: 'Playfair Display', Georgia, serif; }
    .lb { font-family: 'Libre Baskerville', Georgia, serif; }
    .ss { font-family: 'Source Sans 3', system-ui, sans-serif; }

    /* ── BUTTONS ── */
    .btn-d { font-family:'Source Sans 3',sans-serif; font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; padding:15px 28px; background:${C.navy}; color:${C.cream}; border:none; cursor:pointer; transition:all .22s; display:inline-block; min-height:48px; }
    .btn-d:hover { background:${C.navyLight}; transform:translateY(-2px); }
    .btn-g { font-family:'Source Sans 3',sans-serif; font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; padding:15px 28px; background:${C.gold}; color:${C.navy}; border:none; cursor:pointer; transition:all .22s; display:inline-block; min-height:48px; }
    .btn-g:hover { background:${C.goldLight}; transform:translateY(-2px); }
    .btn-o { font-family:'Source Sans 3',sans-serif; font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; padding:14px 28px; background:transparent; color:${C.navy}; border:1.5px solid ${C.navy}; cursor:pointer; transition:all .22s; display:inline-block; min-height:48px; }
    .btn-o:hover { background:${C.navy}; color:${C.cream}; }
    .btn-oc { font-family:'Source Sans 3',sans-serif; font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; padding:14px 28px; background:transparent; color:${C.cream}; border:1.5px solid rgba(244,239,230,.3); cursor:pointer; transition:all .22s; display:inline-block; min-height:48px; }
    .btn-oc:hover { background:rgba(255,255,255,.08); }

    /* ── NAV ITEMS ── */
    .ni { font-family:'Source Sans 3',sans-serif; font-size:12px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:${C.g600}; cursor:pointer; padding:5px 0; border-bottom:1.5px solid transparent; transition:all .22s; white-space:nowrap; }
    .ni:hover, .ni.on { color:${C.navy}; border-bottom-color:${C.gold}; }

    /* ── ESSAY ROW ── */
    .erow { padding:24px 0; border-bottom:1px solid ${C.g200}; cursor:pointer; transition:all .2s; }
    .erow:hover { padding-left:10px; }
    .erow:hover .et { color:${C.navy}; }
    .et { color:${C.g800}; transition:color .2s; font-family:'Playfair Display',serif; }

    /* ── CARDS ── */
    .card { background:white; border:1px solid ${C.g200}; transition:all .26s; cursor:pointer; }
    .card:hover { transform:translateY(-4px); box-shadow:0 14px 36px rgba(0,0,0,.09); border-color:${C.g400}; }

    /* ── INPUT ── */
    input { font-family:'Source Sans 3',sans-serif; width:100%; padding:14px 16px; border:1.5px solid ${C.g200}; background:white; font-size:15px; color:${C.g800}; outline:none; transition:border-color .22s; border-radius:0; -webkit-appearance:none; }
    input:focus { border-color:${C.navy}; }

    /* ── ANIMATIONS ── */
    @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
    @keyframes scaleX { from{transform:scaleX(0)} to{transform:scaleX(1)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }

    /* ── MOBILE OVERRIDES ── */
    @media (max-width: 759px) {
      .desk-only { display:none !important; }
      .mob-stack { flex-direction:column !important; }
      .mob-full { width:100% !important; }
      .mob-center { text-align:center !important; }
    }
    @media (min-width: 760px) {
      .mob-only { display:none !important; }
    }
  `;

  const px = mobile ? "20px" : "48px";

  return (
    <div style={{ fontFamily:"Georgia,serif", background:C.g100, color:C.g800, minHeight:"100vh" }}>
      <style>{globalStyles}</style>

      {/* ── STICKY NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:300,
        background: scrolled ? "rgba(247,245,242,.97)" : "transparent",
        backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        borderBottom: `1px solid ${scrolled ? C.g200 : "transparent"}`,
        transition:"all .3s cubic-bezier(.22,1,.36,1)",
        padding:`0 ${px}` }}>
        <div style={{ maxWidth:1120, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height: mobile ? 60 : 68 }}>
          {/* Logo */}
          <div onClick={()=>go("home")} style={{ cursor:"pointer", display:"flex", alignItems:"baseline", gap:10, flexShrink:0 }}>
            <span className="pf" style={{ fontSize: mobile ? 17 : 19, fontWeight:700, color:C.navy, letterSpacing:".01em" }}>John Thornton</span>
            {!mobile && <span className="ss" style={{ fontSize:9.5, color:C.gold, letterSpacing:".2em", textTransform:"uppercase", fontWeight:700 }}>Unsecured</span>}
          </div>

          {/* Desktop nav */}
          <div className="desk-only" style={{ display:"flex", gap:32, alignItems:"center" }}>
            {[["Writing","thinking"],["Ideas Lab","ideas"],["Work With Me","work"],["About","about"]].map(([l,p])=>(
              <span key={p} className={`ni${page===p?" on":""}`} onClick={()=>go(p)}>{l}</span>
            ))}
            <button className="btn-d" style={{ padding:"10px 20px", fontSize:11 }} onClick={()=>go("subscribe")}>Subscribe</button>
          </div>

          {/* Mobile: subscribe + hamburger */}
          <div className="mob-only" style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button className="btn-d" style={{ padding:"9px 16px", fontSize:10 }} onClick={()=>go("subscribe")}>Subscribe</button>
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{ background:"none", border:"none", cursor:"pointer", padding:"8px 4px", display:"flex", flexDirection:"column", gap:5, minWidth:44, minHeight:44, alignItems:"center", justifyContent:"center" }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ display:"block", width:22, height:1.5, background:C.navy, transition:"all .25s",
                  transform: menuOpen ? (i===0?"rotate(45deg) translate(4px,5px)":i===2?"rotate(-45deg) translate(4px,-5px)":"none"):"none",
                  opacity: menuOpen && i===1 ? 0 : 1 }}/>
              ))}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div style={{ background:"white", borderTop:`1px solid ${C.g200}`, padding:"8px 0", boxShadow:`0 8px 24px rgba(0,0,0,.1)` }}>
            {[["Writing","thinking"],["Ideas Lab","ideas"],["Work With Me","work"],["About","about"]].map(([l,p])=>(
              <div key={p} onClick={()=>go(p)} style={{ padding:"16px 24px", borderBottom:`1px solid ${C.g200}`, cursor:"pointer", transition:"background .15s" }}
                onMouseOver={e=>e.currentTarget.style.background=C.g100}
                onMouseOut={e=>e.currentTarget.style.background="white"}>
                <span className="ni" style={{ fontSize:13 }}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── PAGES ── */}
      {essay
        ? <EssayPage essay={essay} all={ESSAYS} setEssay={setEssay} scrollY={scrollY} mobile={mobile} px={px}/>
        : page==="home"      ? <HomePage go={go} setEssay={setEssay} scrollY={scrollY} mobile={mobile} px={px}/>
        : page==="thinking"  ? <ThinkingPage essays={ESSAYS} setEssay={setEssay} mobile={mobile} px={px}/>
        : page==="ideas"     ? <IdeasPage mobile={mobile} px={px}/>
        : page==="work"      ? <WorkPage mobile={mobile} px={px}/>
        : page==="about"     ? <AboutPage go={go} mobile={mobile} px={px}/>
        : page==="subscribe" ? <SubscribePage/>
        : null}

      {/* ── FOOTER ── */}
      {!essay && (
        <footer style={{ background:C.navy, color:C.cream, padding:`56px ${px} 40px`, position:"relative", overflow:"hidden" }}>
          <CrackPanel blendMode="screen" opacity={0.06} right="0" width="26%" />
          <div style={{ maxWidth:1120, margin:"0 auto", position:"relative" }}>
            <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(auto-fit,minmax(180px,1fr))", gap: mobile ? "32px 24px" : 48, marginBottom:48 }}>
              <div style={{ gridColumn: mobile ? "1/-1" : "auto" }}>
                <p className="pf" style={{ fontSize:20,fontWeight:700,marginBottom:12 }}>John Thornton</p>
                <p className="ss" style={{ fontSize:14,color:C.g400,lineHeight:1.8,marginBottom:20 }}>Thinking about pressure, internal systems, and the rules we never chose.</p>
              </div>
              <div>
                <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:C.gold,marginBottom:16 }}>Navigate</p>
                {[["Writing","thinking"],["Ideas Lab","ideas"],["Work With Me","work"],["About","about"]].map(([l,p])=>(
                  <p key={p} onClick={()=>go(p)} className="ss" style={{ fontSize:14,color:C.g400,marginBottom:10,cursor:"pointer",transition:"color .2s" }}
                    onMouseOver={e=>e.target.style.color=C.cream} onMouseOut={e=>e.target.style.color=C.g400}>{l}</p>
                ))}
              </div>
              <div>
                <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:C.gold,marginBottom:16 }}>The Book</p>
                <p className="lb" style={{ fontSize:14,color:C.g400,lineHeight:1.7,fontStyle:"italic",marginBottom:20 }}>Unsecured: Why Pressure Isn't the Problem</p>
                <button className="btn-oc" style={{ fontSize:10.5 }}>Get the Book</button>
              </div>
            </div>
            <div style={{ width:"100%",height:1,background:`linear-gradient(to right, transparent, ${C.navyMid}, transparent)`,marginBottom:24 }}/>
            <div style={{ display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
              <p className="ss" style={{ fontSize:12,color:C.g600 }}>© 2026 John Thornton. All rights reserved.</p>
              <p className="ss" style={{ fontSize:12,color:C.g600 }}>Ideas Lab powered by NotebookLM</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME PAGE — mobile-first, clear visitor flow
// ═══════════════════════════════════════════════════════════════════════════════
function HomePage({ go, setEssay, scrollY, mobile, px }) {
  // Parallax only on desktop — disabled on mobile to prevent scroll conflict
  const parallax = mobile ? 0 : scrollY * 0.15;

  return (
    <div>

      {/* ── HERO ── */}
      <section style={{ position:"relative", minHeight: mobile ? "100svh" : "96vh",
        background:C.creamDark, overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"center" }}>

        {/* Crack photo — the real thing from the book cover */}
        <div style={{
          position:"absolute",
          right: 0,
          top: 0,
          width: mobile ? "75%" : "52%",
          height: "100%",
          transform: `translateY(${parallax}px)`,
          willChange:"transform",
          zIndex: 1,
          pointerEvents:"none",
        }}>
          {/* Left-side gradient fade so crack doesn't cut into headline text */}
          <div style={{ position:"absolute", inset:0, background:`linear-gradient(to right, ${C.creamDark} ${mobile?"35%":"22%"}, transparent 55%)`, zIndex:2 }}/>
          {/* Bottom fade */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"20%", background:`linear-gradient(to top, ${C.creamDark}, transparent)`, zIndex:2 }}/>
          <CrackImage blendMode="multiply" opacity={mobile ? 0.55 : 0.82} />
        </div>

        {/* Content */}
        <div style={{ maxWidth:1120, width:"100%", margin:"0 auto", padding: mobile ? `80px ${px} 64px` : `80px ${px}`, position:"relative", zIndex:2 }}>
          <div style={{ maxWidth: mobile ? "100%" : 580 }}>

            {/* Animated gold bar */}
            <div style={{ width:36, height:2, background:C.gold, marginBottom:20, animation:"scaleX .7s ease .2s both", transformOrigin:"left" }}/>

            {/* Eyebrow */}
            <p className="ss" style={{ fontSize:11, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:C.gold, marginBottom: mobile ? 16 : 20, opacity:0, animation:"fadeUp .6s ease .3s forwards" }}>
              A platform for original thinking
            </p>

            {/* Main headline — big on mobile, bigger on desktop */}
            <h1 className="pf" style={{ fontSize: mobile ? "clamp(36px,10vw,52px)" : "clamp(40px,5.5vw,62px)",
              fontWeight:900, lineHeight:1.08, color:C.navy, marginBottom: mobile ? 20 : 24,
              letterSpacing:"-.02em", opacity:0, animation:"fadeUp .7s ease .4s forwards" }}>
              You don't need<br/>
              <em style={{ fontStyle:"italic", fontWeight:600, color:C.g600 }}>to escape your life</em><br/>
              to improve it.
            </h1>

            {/* Subline */}
            <p className="lb" style={{ fontSize: mobile ? 17 : 19, lineHeight:1.75, color:C.g600, fontStyle:"italic",
              marginBottom: mobile ? 16 : 20, opacity:0, animation:"fadeUp .7s ease .55s forwards" }}>
              You need to change how you're operating inside it.
            </p>

            {/* Body */}
            <p className="ss" style={{ fontSize: mobile ? 15 : 16, lineHeight:1.85, color:C.g600,
              marginBottom: mobile ? 36 : 44, maxWidth:480, opacity:0, animation:"fadeUp .7s ease .7s forwards" }}>
              For people who are capable, responsible, and chronically tired in a way rest doesn't fix.
            </p>

            {/* CTAs — stacked on mobile */}
            <div style={{ display:"flex", gap:12, flexDirection: mobile ? "column" : "row",
              flexWrap:"wrap", opacity:0, animation:"fadeUp .7s ease .85s forwards" }}>
              <button className="btn-d mob-full" onClick={()=>go("thinking")} style={{ textAlign:"center" }}>
                Explore the Writing
              </button>
              <button className="btn-o mob-full" onClick={()=>go("about")} style={{ textAlign:"center" }}>
                About John
              </button>
            </div>
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:100,
          background:`linear-gradient(to top, ${C.g100} 0%, transparent 100%)`, zIndex:3 }}/>
      </section>

      {/* ── MARQUEE ── */}
      <Marquee/>

      {/* ── WHERE TO START — new visitor navigator ── */}
      <section style={{ background:C.navy, padding:`0 ${px}` }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          {/* Section header */}
          <div style={{ padding: mobile ? "36px 0 0" : "52px 0 0", marginBottom: mobile ? 8 : 12 }}>
            <p className="ss" style={{ fontSize:11, fontWeight:700, letterSpacing:".2em", textTransform:"uppercase", color:C.gold }}>
              Find your way in
            </p>
          </div>
          <div style={{ paddingBottom: mobile ? 0 : 8, marginBottom: mobile ? 20 : 28 }}>
            <p className="lb" style={{ fontSize: mobile ? 14 : 15, fontStyle:"italic", color:"rgba(244,239,230,.38)", lineHeight:1.7, maxWidth:520 }}>
              There's no right starting point. Start wherever something already feels familiar.
            </p>
          </div>
          {/* Three paths */}
          <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap:2 }}>
            {[
              { icon:"◈", label:"Start with the Book", sub:"Something brought you here. The book is where this thinking lives in full — every pattern named, every framework grounded in real experience.", action:()=>{}, badge:"The full picture" },
              { icon:"◇", label:"Explore the Writing", sub:"If something specific is pulling at you — pressure, urgency, the rules you never chose — start there. Each piece is a different angle on the same question.", action:()=>go("thinking"), badge:"Original thinking" },
              { icon:"⊞", label:"A Quick Shift", sub:"Single concepts and reframes. The kind of thing that takes two minutes to read and stays with you longer than it should.", action:()=>go("ideas"), badge:"Ideas Lab" },
            ].map(({ icon, label, sub, action, badge }, i) => (
              <div key={label} onClick={action} style={{ padding: mobile ? "24px 0" : "36px 28px",
                borderTop: mobile ? `1px solid ${C.navyMid}` : "none",
                borderLeft: !mobile && i > 0 ? `1px solid ${C.navyMid}` : "none",
                cursor:"pointer", transition:"background .2s", display:"flex",
                alignItems: mobile ? "center" : "flex-start",
                gap: mobile ? 20 : 16,
                flexDirection: mobile ? "row" : "column",
                position:"relative" }}
                onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"}
                onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ fontSize: mobile ? 20 : 24, color:C.gold, flexShrink:0 }}>{icon}</div>
                <div style={{ flex:1 }}>
                  <p className="pf" style={{ fontSize: mobile ? 17 : 19, fontWeight:700, color:C.cream, lineHeight:1.2, marginBottom:6 }}>{label}</p>
                  <p className="ss" style={{ fontSize: mobile ? 13 : 13, color:"rgba(244,239,230,.45)", lineHeight:1.7, marginBottom: mobile ? 0 : 14 }}>{sub}</p>
                  {!mobile && <span className="ss" style={{ fontSize:10, color:C.gold, letterSpacing:".12em", textTransform:"uppercase", fontWeight:700, borderBottom:`1px solid ${C.gold}50`, paddingBottom:1 }}>{badge} →</span>}
                </div>
                {mobile && <span style={{ color:C.gold, fontSize:18, flexShrink:0, alignSelf:"center" }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE THESIS ── */}
      <section style={{ padding: mobile ? `64px ${px}` : `88px ${px}` }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          <Reveal>
            <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:C.gold,marginBottom:14 }}>The core idea</p>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 40 : 72, alignItems:"start" }}>
            <Reveal delay={.05}>
              <h2 className="pf" style={{ fontSize: mobile ? "clamp(28px,7vw,40px)" : "clamp(28px,4vw,44px)",
                fontWeight:900, lineHeight:1.1, color:C.navy, letterSpacing:"-.02em" }}>
                Burnout isn't a workload problem.<br/>
                <em style={{ fontWeight:400, color:C.g600 }}>It's a configuration problem.</em>
              </h2>
            </Reveal>
            <Reveal delay={.12}>
              <div>
                <p className="lb" style={{ fontSize: mobile ? 16 : 17, lineHeight:1.88, color:C.g800, marginBottom:24 }}>
                  You didn't develop bad habits. You developed a functional system — one configured in response to real pressure at real moments. Those configurations worked. Then they outlasted their usefulness.
                </p>
                <p className="lb" style={{ fontSize: mobile ? 16 : 17, lineHeight:1.88, color:C.g800, marginBottom:28 }}>
                  The work isn't to push harder. It's to understand what's running — and decide whether it still deserves authority.
                </p>
                <button className="btn-d" onClick={()=>go("thinking")}>Explore the Thinking</button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── THEMES — horizontal scroll on mobile ── */}
      <section style={{ background:C.creamDark, padding:`64px 0`, borderTop:`1px solid ${C.g200}`, borderBottom:`1px solid ${C.g200}` }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:`0 ${px}` }}>
          <Reveal style={{ marginBottom: mobile ? 28 : 40 }}>
            <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:C.gold,marginBottom:10 }}>Four lenses</p>
            <h2 className="pf" style={{ fontSize: mobile ? "clamp(24px,7vw,34px)" : "clamp(26px,3.5vw,38px)", fontWeight:700, color:C.navy, lineHeight:1.15 }}>
              How the thinking is organized
            </h2>
          </Reveal>
        </div>
        {/* Horizontally scrollable on mobile */}
        <div style={{ overflowX: mobile ? "auto" : "visible", paddingLeft: mobile ? px : 0, paddingBottom: mobile ? 4 : 0, scrollbarWidth:"none" }}>
          <div style={{ display:"flex", gap: mobile ? 12 : 3, flexDirection: mobile ? "row" : "row",
            width: mobile ? "max-content" : "auto",
            padding: mobile ? `0 ${px} 0 0` : `0 ${px}`,
            maxWidth: mobile ? "none" : 1120,
            margin: mobile ? "0" : "0 auto",
            flexWrap: mobile ? "nowrap" : "nowrap",
            gridTemplateColumns: "repeat(4,1fr)" }}>
            {[
              {t:"Pressure",icon:"◈",d:"Why treating pressure like a test keeps you exactly where you are."},
              {t:"Urgency",icon:"◇",d:"How urgency becomes a default setting and what it costs."},
              {t:"Internal Rules",icon:"⊞",d:"The configurations we absorbed without choosing."},
              {t:"Reconfiguration",icon:"↻",d:"Visibility and authority — not force, not willpower."},
            ].map(({t,icon,d},i) => (
              <Reveal key={t} delay={i*.07}>
                <div onClick={()=>go("thinking")} style={{ width: mobile ? 220 : "auto",
                  flexShrink: mobile ? 0 : 1,
                  padding: mobile ? "24px 20px" : "36px 28px",
                  background:"white", borderTop:`3px solid ${TC[t]}`, cursor:"pointer",
                  transition:"all .26s", height:"100%", minHeight: mobile ? "auto" : 180 }}
                  onMouseOver={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.09)"}}
                  onMouseOut={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
                  <div style={{ fontSize:22,color:TC[t],marginBottom:14 }}>{icon}</div>
                  <h3 className="pf" style={{ fontSize: mobile ? 17 : 19, fontWeight:700, color:C.navy, marginBottom:10 }}>{t}</h3>
                  <p className="ss" style={{ fontSize:13, lineHeight:1.75, color:C.g600 }}>{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED WRITING ── */}
      <section style={{ padding:`64px ${px}` }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          <Reveal style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: mobile ? 28 : 40 }}>
            <div>
              <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:C.gold,marginBottom:8 }}>From the Writing</p>
              <h2 className="pf" style={{ fontSize: mobile ? "clamp(24px,7vw,32px)" : "clamp(24px,3.5vw,36px)", fontWeight:700, color:C.navy }}>Where to Begin</h2>
            </div>
            <span className="ss" onClick={()=>go("thinking")} style={{ fontSize:13,color:C.g600,cursor:"pointer",paddingBottom:3,borderBottom:`1px solid ${C.g400}` }}>All →</span>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: mobile ? 12 : 2 }}>
            {[ESSAYS[0],ESSAYS[2],ESSAYS[7]].map((e,i) => (
              <Reveal key={e.id} delay={i*.08}>
                <div className="card" style={{ padding: mobile ? "24px 20px" : "32px 28px" }} onClick={()=>setEssay(e)}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14, alignItems:"flex-start" }}>
                    <span className="ss" style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",
                      padding:"4px 10px",background:`${TC[e.theme]}16`,color:TC[e.theme],border:`1px solid ${TC[e.theme]}30` }}>
                      {e.theme}
                    </span>
                    <span className="ss" style={{ fontSize:12,color:C.g400 }}>{e.readTime}</span>
                  </div>
                  <h3 className="pf" style={{ fontSize: mobile ? 19 : 20, fontWeight:700, color:C.navy, marginBottom:12, lineHeight:1.25 }}>{e.title}</h3>
                  <p className="ss" style={{ fontSize:14, lineHeight:1.8, color:C.g600, marginBottom:20 }}>{e.hook}</p>
                  <span className="ss" style={{ fontSize:12,color:C.gold,fontWeight:600,letterSpacing:".08em" }}>Read →</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE BREAK ── */}
      <section style={{ background:C.navy, padding: mobile ? `72px ${px}` : `100px ${px}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,backgroundImage:`radial-gradient(ellipse at 30% 50%, ${C.navyLight} 0%, transparent 65%)`,opacity:.8 }}/>
        <CrackPanel blendMode="screen" opacity={0.07} right="0" width="30%" />
        <Reveal>
          <div style={{ maxWidth:740, margin:"0 auto", textAlign:"center", position:"relative" }}>
            <div style={{ width:1,height:48,background:`linear-gradient(to bottom, transparent, ${C.gold})`,margin:"0 auto 24px" }}/>
            <p className="pf" style={{ fontSize: mobile ? "clamp(22px,6vw,32px)" : "clamp(24px,3.8vw,44px)",
              fontWeight:400, fontStyle:"italic", color:C.cream, lineHeight:1.4, letterSpacing:"-.01em" }}>
              "Normal is the most convincing disguise pressure can wear."
            </p>
            <p className="ss" style={{ fontSize:12,color:C.g400,marginTop:20,letterSpacing:".1em" }}>— Unsecured, Chapter 1</p>
            <div style={{ width:1,height:48,background:`linear-gradient(to top, transparent, ${C.gold})`,margin:"24px auto 0" }}/>
          </div>
        </Reveal>
      </section>

      {/* ── BOOK SECTION ── */}
      <section style={{ background:C.creamDeep, padding:`64px ${px}`, borderTop:`1px solid ${C.g200}`, position:"relative", overflow:"hidden" }}>
        <CrackPanel blendMode="multiply" opacity={0.18} right="0" width="22%" top="10%" bottom="10%" />
        <div style={{ maxWidth:1120, margin:"0 auto", display:"grid",
          gridTemplateColumns: mobile ? "1fr" : "1fr auto",
          gap: mobile ? 40 : 72, alignItems:"center" }}>
          <Reveal>
            <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:C.gold,marginBottom:16 }}>The Book</p>
            <h2 className="pf" style={{ fontSize: mobile ? "clamp(26px,7vw,38px)" : "clamp(26px,4vw,48px)",
              fontWeight:900, color:C.navy, lineHeight:1.1, marginBottom:20, letterSpacing:"-.02em" }}>
              Unsecured<span style={{ color:C.g400,fontWeight:400 }}>:</span><br/>
              <span style={{ fontWeight:400,fontStyle:"italic",fontSize:"80%" }}>Why Pressure Isn't the Problem</span>
            </h2>
            <p className="ss" style={{ fontSize: mobile ? 15 : 16, lineHeight:1.85, color:C.g600, marginBottom:20 }}>
              Drawing from cybersecurity thinking and lived experience, John explores how internal rules we never consciously chose quietly shape how pressure lands in our lives.
            </p>
            <p className="lb" style={{ fontSize: mobile ? 16 : 17, fontStyle:"italic", color:C.g600, marginBottom:32, paddingLeft:18, borderLeft:`2px solid ${C.gold}` }}>
              "The problem may not be how much pressure you carry. It may be how your system was configured to carry it."
            </p>
            <div style={{ display:"flex", gap:12, flexDirection: mobile ? "column" : "row" }}>
              <button className="btn-d mob-full" style={{ textAlign:"center" }}>Get the Book</button>
              <button className="btn-o mob-full" style={{ textAlign:"center" }} onClick={()=>go("thinking")}>Explore the Writing</button>
            </div>
          </Reveal>
          {!mobile && <Reveal delay={.15}><BookCoverDark size={300}/></Reveal>}
          {mobile && (
            <Reveal style={{ display:"flex", justifyContent:"center" }}>
              <BookCoverDark size={220}/>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── ABOUT STRIP ── */}
      <section style={{ padding:`64px ${px}` }}>
        <div style={{ maxWidth:1120, margin:"0 auto" }}>
          <Reveal>
            <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 32 : 72, alignItems:"center" }}>
              <div>
                <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:C.gold,marginBottom:14 }}>About John</p>
                <h2 className="pf" style={{ fontSize: mobile ? "clamp(22px,6vw,30px)" : "clamp(22px,3vw,32px)", fontWeight:700, color:C.navy, marginBottom:20, lineHeight:1.2 }}>
                  A cybersecurity lens<br/><em style={{ fontWeight:400, color:C.g600 }}>applied to human systems</em>
                </h2>
                <p className="ss" style={{ fontSize: mobile ? 15 : 15, lineHeight:1.85, color:C.g600, marginBottom:28 }}>
                  Systems behave exactly as they're configured to behave. Most failure is predictable once you understand the configuration. John started applying that lens to everything else — including himself.
                </p>
                <button className="btn-o" onClick={()=>go("about")}>Read the Full Story</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[["10+","Years in cybersecurity"],["20","Book chapters"],["4","Core frameworks"],["1","Book that started it all"]].map(([n,l])=>(
                  <div key={l} style={{ padding: mobile ? "20px 16px" : "24px 20px", background:C.creamDark, borderLeft:`2px solid ${C.gold}` }}>
                    <p className="pf" style={{ fontSize: mobile ? 28 : 32, fontWeight:900, color:C.navy, lineHeight:1, marginBottom:6 }}>{n}</p>
                    <p className="ss" style={{ fontSize:12, color:C.g600, lineHeight:1.5 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── EMAIL ── */}
      <EmailCapture/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// THINKING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function ThinkingPage({ essays, setEssay, mobile, px }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter==="All" ? essays : essays.filter(e=>e.theme===filter);
  return (
    <div style={{ maxWidth:1120, margin:"0 auto", padding:`56px ${px}` }}>
      <Reveal style={{ marginBottom:48 }}>
        <div style={{ width:36,height:2,background:C.gold,marginBottom:18 }}/>
        <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:C.gold,marginBottom:10 }}>Thinking Out Loud</p>
        <h1 className="pf" style={{ fontSize:"clamp(32px,7vw,56px)",fontWeight:900,color:C.navy,lineHeight:1.05,marginBottom:20,letterSpacing:"-.02em" }}>Thinking</h1>
        <p className="ss" style={{ fontSize:16,lineHeight:1.85,color:C.g600,maxWidth:520 }}>Extended explorations on the same territory as the book — not lessons, not summaries. Different angles on the same question: what's actually running underneath the way you operate.</p>
      </Reveal>
      {/* Scrollable filters on mobile */}
      <div style={{ overflowX:"auto", marginBottom:44, paddingBottom:4, scrollbarWidth:"none" }}>
        <div style={{ display:"flex", gap:8, width:"max-content" }}>
          {THEMES.map(t => (
            <button key={t} onClick={()=>setFilter(t)} style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"8px 14px",background:filter===t?C.navy:"white",color:filter===t?C.cream:C.g600,border:`1px solid ${filter===t?C.navy:C.g200}`,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",minHeight:40 }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr", gap: mobile ? 0 : 72, alignItems:"start" }}>
        <div>
          {filtered.map((e,i) => (
            <Reveal key={e.id} delay={i*.04}>
              <div className="erow" onClick={()=>setEssay(e)}>
                <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:10,flexWrap:"wrap" }}>
                  <span className="ss" style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 10px",background:`${TC[e.theme]}15`,color:TC[e.theme],border:`1px solid ${TC[e.theme]}30` }}>{e.theme}</span>
                  <span className="ss" style={{ fontSize:12,color:C.g400 }}>{e.readTime}</span>
                </div>
                <h2 className="et" style={{ fontSize:"clamp(18px,4vw,23px)",fontWeight:700,lineHeight:1.25,marginBottom:10 }}>{e.title}</h2>
                <p className="ss" style={{ fontSize:14,lineHeight:1.8,color:C.g600,maxWidth:480 }}>{e.hook}</p>
              </div>
            </Reveal>
          ))}
        </div>
        {!mobile && (
          <Reveal>
            <div style={{ position:"sticky", top:100 }}>
              <div style={{ background:C.creamDark,padding:"28px 32px",marginBottom:18,borderLeft:`3px solid ${C.gold}` }}>
                <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:C.gold,marginBottom:12 }}>What This Is</p>
                <p className="ss" style={{ fontSize:14,lineHeight:1.85,color:C.g600 }}>One ongoing exploration, not a content archive. Each piece stands alone. All of it connects.</p>
              </div>
              <div style={{ background:"white",border:`1px solid ${C.g200}`,padding:"26px 30px" }}>
                <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:C.gold,marginBottom:12 }}>The Book</p>
                <p className="lb" style={{ fontSize:15,fontStyle:"italic",color:C.navy,marginBottom:10,lineHeight:1.4 }}>Unsecured: Why Pressure Isn't the Problem</p>
                <p className="ss" style={{ fontSize:13,color:C.g600,marginBottom:18 }}>Where all of this thinking started.</p>
                <button className="btn-d" style={{ width:"100%" }}>Get the Book</button>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESSAY PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function EssayPage({ essay, all, setEssay, scrollY, mobile, px }) {
  const related = essay.related.map(id=>all.find(e=>e.id===id)).filter(Boolean);
  const totalH = typeof document!=="undefined" ? document.body?.scrollHeight - window.innerHeight : 1;
  const prog = Math.min(100, (scrollY / Math.max(totalH, 1)) * 100);

  return (
    <div style={{ background:C.g100 }}>
      {/* Reading progress */}
      <div style={{ position:"fixed",top: mobile ? 60 : 68,left:0,right:0,height:2,background:`rgba(184,148,63,.15)`,zIndex:200 }}>
        <div style={{ height:"100%",background:C.gold,width:`${prog}%`,transition:"width .1s linear" }}/>
      </div>

      {/* Header */}
      <div style={{ background:C.navy,padding:`64px ${px} 56px`,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",right:0,top:0,bottom:0,width:"28%",opacity:.06 }}>
          <CrackImage blendMode="screen" opacity={0.08} style={{ objectPosition:"60% center" }} />
        </div>
        <div style={{ maxWidth:760,margin:"0 auto",position:"relative",zIndex:2 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:28,flexWrap:"wrap" }}>
            <span onClick={()=>setEssay(null)} className="ss" style={{ fontSize:12,color:C.goldLight,cursor:"pointer",letterSpacing:".1em",minHeight:44,display:"flex",alignItems:"center" }}>
              ← Writing
            </span>
            <span style={{ color:C.navyMid }}>·</span>
            <span className="ss" style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 10px",background:`${TC[essay.theme]}35`,color:C.goldLight,border:`1px solid ${TC[essay.theme]}50` }}>{essay.theme}</span>
          </div>
          <h1 className="pf" style={{ fontSize: mobile ? "clamp(26px,7vw,42px)" : "clamp(28px,5vw,50px)", fontWeight:900,lineHeight:1.1,color:C.cream,marginBottom:18,letterSpacing:"-.02em" }}>{essay.title}</h1>
          <p className="lb" style={{ fontSize: mobile ? 16 : 18,fontStyle:"italic",color:"rgba(244,239,230,.6)",marginBottom:20,lineHeight:1.65 }}>{essay.subhead}</p>
          <p className="ss" style={{ fontSize:13,color:C.g400,letterSpacing:".06em" }}>John Thornton · {essay.readTime} read</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth:720,margin:"0 auto",padding:`56px ${px}` }}>
        <Reveal>
          <div style={{ borderLeft:`3px solid ${C.gold}`,paddingLeft: mobile ? 20 : 28,marginBottom:44 }}>
            <p className="lb" style={{ fontSize: mobile ? 17 : "clamp(18px,2.5vw,23px)",fontStyle:"italic",color:C.navy,lineHeight:1.65 }}>{essay.hook}</p>
          </div>
        </Reveal>
        {essay.body.map((para,i) => (
          <Reveal key={i} delay={i*.04}>
            <p className="lb" style={{ fontSize: mobile ? 16 : "clamp(15px,1.8vw,18px)",lineHeight:1.94,color:C.g800,marginBottom:"1.75em" }}>{para}</p>
          </Reveal>
        ))}

        {/* Book tie */}
        <Reveal>
          <div style={{ display:"flex",gap: mobile ? 16 : 24,alignItems:"flex-start",background:C.creamDark,padding: mobile ? "24px 20px" : "30px 34px",margin:"48px 0",borderTop:`2px solid ${C.navy}`,flexWrap: mobile ? "wrap" : "nowrap" }}>
            {!mobile && <div style={{ flexShrink:0 }}><BookCoverDark size={110}/></div>}
            <div>
              <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:C.gold,marginBottom:10 }}>In the Book</p>
              <p className="ss" style={{ fontSize:14,lineHeight:1.85,color:C.g600,marginBottom:18 }}>{essay.bookTie}</p>
              <button className="btn-d" style={{ fontSize:10.5 }}>Get Unsecured</button>
            </div>
          </div>
        </Reveal>

        {/* Related */}
        {related.length > 0 && (
          <Reveal>
            <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:C.gold,marginBottom:18 }}>Keep Exploring</p>
            <div style={{ display:"grid",gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",gap:12 }}>
              {related.map(r => (
                <div key={r.id} className="card" style={{ padding:"22px 24px" }} onClick={()=>setEssay(r)}>
                  <span className="ss" style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 10px",background:`${TC[r.theme]}15`,color:TC[r.theme],border:`1px solid ${TC[r.theme]}30`,marginBottom:12,display:"inline-block" }}>{r.theme}</span>
                  <h3 className="pf" style={{ fontSize:17,fontWeight:700,color:C.navy,lineHeight:1.3 }}>{r.title}</h3>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IDEAS PAGE (simplified — full version in v4)
// ═══════════════════════════════════════════════════════════════════════════════
const IDEAS = [
  {id:1,theme:"Pressure",type:"Reframe",title:"Pressure Is a Signal, Not a Test",body:"Tests are meant to be passed. Signals are meant to be interpreted. Confusing the two turns endurance into virtue and exhaustion into proof you're doing something right."},
  {id:2,theme:"Urgency",type:"Framework",title:"The Urgency Loop",body:"Urgency fires. You act. Relief follows. The relief gets misread as proof the action was necessary. Over time, the loop trains urgency to feel like truth."},
  {id:3,theme:"Internal Rules",type:"Concept",title:"Open Ports",body:"Some internal rules don't guide behavior. They grant access. They allow pressure and demands to reach you automatically — without evaluation, without consent."},
  {id:4,theme:"Pressure",type:"Observation",title:"The Body Notices First",body:"Tension behind the eyes. The jaw. Across the shoulders. The body records what the mind is still explaining away. Physical signals are the first diagnostic data available."},
  {id:5,theme:"Internal Rules",type:"Distinction",title:"Configuration vs. Character",body:"You didn't develop bad habits. You developed a functional system. Systems can be inspected and reconfigured. Character can only be judged."},
  {id:6,theme:"Urgency",type:"Distinction",title:"Overload vs. Over-Reachability",body:"Overload is a volume problem. Over-reachability is an access problem. Most people treat the second like the first — adding capacity when the system needs a gate."},
  {id:7,theme:"Reconfiguration",type:"Principle",title:"Visibility Before Change",body:"You can't reconfigure what you can't see. Inspection isn't delay — it's the step most people skip."},
  {id:8,theme:"Reconfiguration",type:"Observation",title:"Baseline Drift",body:"Survival settings don't expire automatically. What was calibrated for a hard season hardens into default. The emergency ends. The posture remains."},
  {id:9,theme:"Internal Rules",type:"Observation",title:"Identity-Based Performance",body:"When output becomes identity, every missed deadline is a verdict. The system can never rest because the threat is never just workload — it's exposure."},
  {id:10,theme:"Urgency",type:"Reframe",title:"Latency Is Not Laziness",body:"Latency is the space between signal and response where interpretation happens. Without it, reaction replaces choice."},
  {id:11,theme:"Pressure",type:"Concept",title:"The Illusion of Coverage",body:"Systems — and people — can appear covered long after the redundancy is gone. Nothing crashes loudly. Everything degrades quietly."},
  {id:12,theme:"Reconfiguration",type:"Principle",title:"Authority, Not Willpower",body:"The goal isn't suppressing urgency through discipline. It's withdrawing the unquestioned authority urgency inherited."},
];

function IdeasPage({ mobile, px }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter==="All" ? IDEAS : IDEAS.filter(i=>i.theme===filter);
  return (
    <div style={{ maxWidth:1120, margin:"0 auto", padding:`56px ${px}` }}>
      <Reveal style={{ marginBottom:48 }}>
        <div style={{ width:36,height:2,background:C.gold,marginBottom:18 }}/>
        <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:C.gold,marginBottom:10 }}>Distilled Thinking</p>
        <h1 className="pf" style={{ fontSize:"clamp(32px,7vw,56px)",fontWeight:900,color:C.navy,lineHeight:1.05,marginBottom:20,letterSpacing:"-.02em" }}>Ideas Lab</h1>
        <p className="ss" style={{ fontSize:16,lineHeight:1.85,color:C.g600,maxWidth:520,marginBottom:28 }}>Concepts, distinctions, and frameworks. Quick to read. Designed to shift one thing about how you're seeing a situation.</p>
        <div style={{ background:C.navy,padding:"18px 24px",display:"inline-flex",gap:14,alignItems:"center",borderLeft:`3px solid ${C.gold}` }}>
          <div style={{ width:7,height:7,borderRadius:"50%",background:C.gold,flexShrink:0 }}/>
          <p className="ss" style={{ fontSize:13,color:"rgba(244,239,230,.7)" }}>Audio, briefings, and deep dives generated via <em style={{ color:C.goldLight }}>NotebookLM</em> — coming soon.</p>
        </div>
      </Reveal>
      <div style={{ overflowX:"auto",marginBottom:44,paddingBottom:4,scrollbarWidth:"none" }}>
        <div style={{ display:"flex",gap:8,width:"max-content" }}>
          {THEMES.map(t=>(
            <button key={t} onClick={()=>setFilter(t)} style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"8px 14px",background:filter===t?C.navy:"white",color:filter===t?C.cream:C.g600,border:`1px solid ${filter===t?C.navy:C.g200}`,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",minHeight:40 }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit,minmax(300px,1fr))", gap:14 }}>
        {filtered.map((idea,i) => (
          <Reveal key={idea.id} delay={i*.04}>
            <div style={{ background:"white",border:`1px solid ${C.g200}`,padding: mobile ? "24px 20px" : "28px 30px",transition:"all .26s" }}
              onMouseOver={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 22px rgba(0,0,0,.07)"}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=C.g200;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
                <span className="ss" style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 10px",background:`${TC[idea.theme]}14`,color:TC[idea.theme],border:`1px solid ${TC[idea.theme]}30` }}>{idea.theme}</span>
                <span className="ss" style={{ fontSize:9.5,color:C.g400,letterSpacing:".1em",textTransform:"uppercase",fontWeight:700,padding:"4px 10px",border:`1px solid ${C.g200}` }}>{idea.type}</span>
              </div>
              <h3 className="pf" style={{ fontSize: mobile ? 18 : 19,fontWeight:700,color:C.navy,marginBottom:12,lineHeight:1.3 }}>{idea.title}</h3>
              <p className="ss" style={{ fontSize:14,lineHeight:1.85,color:C.g600 }}>{idea.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <div style={{ marginTop:64 }}><EmailCapture compact/></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORK PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function WorkPage({ mobile, px }) {
  return (
    <div style={{ maxWidth:1120, margin:"0 auto", padding:`56px ${px}` }}>
      <Reveal style={{ marginBottom:56 }}>
        <div style={{ width:36,height:2,background:C.gold,marginBottom:18 }}/>
        <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:C.gold,marginBottom:10 }}>Collaboration</p>
        <h1 className="pf" style={{ fontSize:"clamp(32px,7vw,56px)",fontWeight:900,color:C.navy,lineHeight:1.05,marginBottom:20,letterSpacing:"-.02em" }}>Work With Me</h1>
        <p className="ss" style={{ fontSize:16,lineHeight:1.85,color:C.g600,maxWidth:500 }}>The goal is never to energize — it's to help you see what you've been operating inside of.</p>
      </Reveal>
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: mobile ? 12 : 4, marginBottom:56 }}>
        {[
          {title:"Speaking",icon:"◈",status:"Available",sc:"#4a7a5a",desc:"Keynotes on pressure, urgency, and internal configuration for leadership teams and conferences.",topics:["Why burnout is a systems problem","Urgency as a cultural default","Reconfiguring how teams carry pressure"],cta:"Inquire About Speaking"},
          {title:"Workshops",icon:"⊞",status:"In Development",sc:C.g400,desc:"Half-day and full-day workshops that move teams from awareness to practical reconfiguration.",topics:["Identifying invisible internal rules","Building latency back","Margin by design"],cta:"Join the Waitlist"},
          {title:"Advisory",icon:"◇",status:"Limited",sc:C.gold,desc:"Working directly with leaders operating under configurations that no longer serve them.",topics:["One-on-one sessions","Leadership team alignment","Pressure assessment"],cta:"Start a Conversation"},
        ].map((item,i) => (
          <Reveal key={item.title} delay={i*.08}>
            <div style={{ background:"white",borderTop:`3px solid ${Object.values(TC)[i]}`,padding: mobile ? "28px 24px" : "40px 36px",transition:"all .26s",height:"100%" }}
              onMouseOver={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.08)"}}
              onMouseOut={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
                <div style={{ fontSize:26,color:C.navy }}>{item.icon}</div>
                <span className="ss" style={{ fontSize:10,letterSpacing:".1em",textTransform:"uppercase",fontWeight:700,color:item.sc,padding:"4px 10px",border:`1px solid ${item.sc}40` }}>{item.status}</span>
              </div>
              <h2 className="pf" style={{ fontSize: mobile ? 24 : 26,fontWeight:900,color:C.navy,marginBottom:14,letterSpacing:"-.01em" }}>{item.title}</h2>
              <p className="ss" style={{ fontSize:14,lineHeight:1.82,color:C.g600,marginBottom:22 }}>{item.desc}</p>
              <div style={{ marginBottom:28 }}>
                {item.topics.map(t=>(
                  <div key={t} style={{ display:"flex",gap:10,marginBottom:9 }}>
                    <span style={{ color:C.gold,marginTop:4,fontSize:9,flexShrink:0 }}>▸</span>
                    <span className="ss" style={{ fontSize:14,color:C.g600,lineHeight:1.55 }}>{t}</span>
                  </div>
                ))}
              </div>
              <button className="btn-d" style={{ width:"100%" }}>{item.cta}</button>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <div style={{ background:C.creamDark,padding: mobile ? "32px 28px" : "48px 52px",borderLeft:`4px solid ${C.gold}` }}>
          <h3 className="pf" style={{ fontSize: mobile ? 22 : 26,fontWeight:700,color:C.navy,marginBottom:16 }}>A Note on How I Work</h3>
          <p className="ss" style={{ fontSize:15,lineHeight:1.9,color:C.g600,maxWidth:600 }}>The framing is systems-based, not motivational. I work best with people who are already high-functioning and want to understand why the system they've built is costing more than it should.</p>
        </div>
      </Reveal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABOUT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function AboutPage({ go, mobile, px }) {
  return (
    <div>
      <div style={{ background:C.navy,padding:`72px ${px}`,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",right:"4%",top:0,bottom:0,width:"26%",opacity:.06 }}>
          <CrackImage blendMode="screen" opacity={0.07} />
        </div>
        <div style={{ maxWidth:1120,margin:"0 auto",display:"grid",gridTemplateColumns: mobile ? "1fr" : "1fr auto",gap: mobile ? 32 : 64,alignItems:"center",position:"relative",zIndex:2 }}>
          <div>
            <div style={{ width:36,height:2,background:C.gold,marginBottom:20 }}/>
            <h1 className="pf" style={{ fontSize: mobile ? "clamp(32px,9vw,52px)" : "clamp(36px,5.5vw,60px)",fontWeight:900,color:C.cream,marginBottom:18,lineHeight:1.05,letterSpacing:"-.02em" }}>John Thornton</h1>
            <p className="lb" style={{ fontSize: mobile ? 17 : 19,fontStyle:"italic",color:"rgba(244,239,230,.65)",marginBottom:16,lineHeight:1.65 }}>Cybersecurity professional. Author.<br/>Observer of invisible systems.</p>
            <p className="ss" style={{ fontSize:15,color:"rgba(244,239,230,.45)",lineHeight:1.8 }}>Writing about the intersection of how systems work and how people fail to see themselves as worth troubleshooting.</p>
          </div>
          {!mobile && <BookCoverDark size={240}/>}
        </div>
      </div>
      <div style={{ maxWidth:760,margin:"0 auto",padding:`64px ${px}` }}>
        {[
          {h:"How I Think",b:"I'm drawn to the gap between how things appear to work and how they actually function. Cybersecurity gave me a lens for that — systems behave exactly as they're configured to behave, and most failure is predictable once you understand the configuration."},
          {h:"What I've Observed",b:"Most people carrying pressure are not broken or weak. They're running configurations that made sense at some point and were never updated. The work is finding those rules and deciding whether they still deserve authority."},
          {h:"Why Cybersecurity",b:"The field gave me a vocabulary for things I had felt but couldn't name. Open ports. Baseline drift. The cost of over-reachability. That language maps onto human experience in ways that feel more honest than most frameworks."},
          {h:"Who This Is For",b:"If you're capable, responsible, and chronically tired in a way that rest doesn't fix — this work was written for you. Not to tell you what to do. To help you see what's already running."},
        ].map((item,i) => (
          <Reveal key={item.h} delay={i*.07} style={{ marginBottom:48 }}>
            <div style={{ width:36,height:2,background:C.gold,marginBottom:18 }}/>
            <h2 className="pf" style={{ fontSize: mobile ? 22 : 26,fontWeight:700,color:C.navy,marginBottom:16,letterSpacing:"-.01em" }}>{item.h}</h2>
            <p className="lb" style={{ fontSize: mobile ? 16 : 17,lineHeight:1.94,color:C.g800 }}>{item.b}</p>
          </Reveal>
        ))}
        <Reveal>
          <div style={{ background:C.creamDark,padding: mobile ? "32px 28px" : "40px 44px",borderTop:`3px solid ${C.navy}` }}>
            <p className="pf" style={{ fontSize: mobile ? "clamp(17px,4.5vw,22px)" : "clamp(18px,2.5vw,24px)",fontStyle:"italic",color:C.navy,marginBottom:24,lineHeight:1.5 }}>
              "You are not failing. You are not weak. You are responding exactly as a system responds when configured to absorb pressure without question."
            </p>
            <div style={{ display:"flex",gap:12,flexDirection: mobile ? "column" : "row" }}>
              <button className="btn-d mob-full" style={{ textAlign:"center" }} onClick={()=>go("thinking")}>Explore the Writing</button>
              <button className="btn-o mob-full" style={{ textAlign:"center" }} onClick={()=>go("subscribe")}>Subscribe</button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBE
// ═══════════════════════════════════════════════════════════════════════════════
function SubscribePage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div style={{ minHeight:"80vh", display:"flex", alignItems:"center", padding:"64px 24px" }}>
      <div style={{ maxWidth:500, margin:"0 auto", width:"100%", textAlign:"center" }}>
        <div style={{ width:36,height:2,background:C.gold,margin:"0 auto 24px" }}/>
        <h1 className="pf" style={{ fontSize:"clamp(26px,7vw,42px)",fontWeight:900,color:C.navy,marginBottom:16,lineHeight:1.1,letterSpacing:"-.02em" }}>
          Get new thinking<br/><em style={{ fontWeight:400,color:C.g600 }}>when it's released.</em>
        </h1>
        <p className="ss" style={{ fontSize:16,lineHeight:1.85,color:C.g600,marginBottom:36 }}>
          No noise. No marketing language. When there's something worth reading, you'll get it.
        </p>
        {done ? (
          <div style={{ padding:"32px 36px",background:C.creamDark,border:`1px solid ${C.g200}` }}>
            <p className="pf" style={{ fontSize:22,color:C.navy,marginBottom:10,fontWeight:700 }}>You're in.</p>
            <p className="ss" style={{ fontSize:15,color:C.g600 }}>New thinking and ideas will come to you directly.</p>
          </div>
        ) : (
          <div>
            <div style={{ display:"flex",gap:8,maxWidth:420,margin:"0 auto",flexWrap:"wrap" }}>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Your email address" style={{ flex:1,minWidth:200 }}/>
              <button onClick={()=>email&&setDone(true)} style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",padding:"14px 22px",background:C.navy,color:C.cream,border:"none",cursor:"pointer",minHeight:48,whiteSpace:"nowrap" }}>
                Subscribe
              </button>
            </div>
            <p className="ss" style={{ fontSize:12,color:C.g400,marginTop:14 }}>No spam. Unsubscribe any time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
