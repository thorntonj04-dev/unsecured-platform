import { useState, useEffect, useRef } from "react";
import { LOCAL_ESSAYS } from "./essays";
import { fetchEssays, submitInquiry, subscribeNewsletter, trackEvent, getSessionId, getDevice, getSessionReferrer } from "./firebase";
import SystemAuditPage from "./SystemAuditPage";
import CohortPage from "./CohortPage";

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
  const qfs = quote.length > 130 ? 27 : quote.length > 85 ? 31 : 36;

  return (
    <div ref={wrapRef} style={{ width: "100%", height: Math.round(630 * scale), overflow: "hidden" }}>
      <div style={{ width: 1200, height: 630, transform: `scale(${scale})`, transformOrigin: "top left", display: "flex", background: "#0d1720" }}>
        <div style={{ width: 8, height: "100%", background: "#b8943f", flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "52px 76px 52px 72px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span style={{ padding: "6px 18px", border: `1px solid ${theme.hex}`, background: theme.rgba, color: theme.hex, fontSize: 12, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "sans-serif" }}>
              {essay.theme}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(184,148,63,0.6)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 18, fontFamily: "sans-serif" }}>
              FROM: {label}
            </div>
            <div style={{ height: 1, background: "rgba(184,148,63,0.45)", marginBottom: 32 }} />
            <div style={{ fontSize: qfs, fontWeight: 400, fontStyle: "italic", color: "#f4efe6", lineHeight: 1.5, letterSpacing: "-0.01em", maxWidth: 980, fontFamily: "Georgia,serif" }}>
              &ldquo;{quote}&rdquo;
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#b8943f", letterSpacing: "0.05em", fontFamily: "sans-serif" }}>John Thornton</div>
              <div style={{ fontSize: 14, color: "rgba(244,239,230,0.35)", letterSpacing: "0.1em", fontFamily: "sans-serif" }}>unsecured.info</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "rgba(244,239,230,0.09)", letterSpacing: "0.35em", fontFamily: "sans-serif" }}>UNSECURED</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edge Functions don't run under Vite dev server — point at production origin locally.
const OG_ORIGIN = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "https://unsecured.info"
  : "";

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
    <div style={{ width:w, height:h, flexShrink:0, boxShadow:`-8px 12px 40px rgba(0,0,0,.55)`,
      transition:"transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease", overflow:"hidden" }}
      onMouseOver={e=>{e.currentTarget.style.transform="translateY(-6px) rotate(-1deg)";e.currentTarget.style.boxShadow="-12px 20px 48px rgba(0,0,0,.65)"}}
      onMouseOut={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="-8px 12px 40px rgba(0,0,0,.55)"}}>
      <img src="/book-cover.jpg" alt="Unsecured: Why Pressure Isn't the Problem by John Thornton"
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
        onError={e => { e.target.style.display = "none"; }}
      />
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
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await subscribeNewsletter(email.trim());
    } catch (err) {
      console.warn("subscribeNewsletter failed:", err.message);
    } finally {
      setLoading(false);
      setDone(true);
    }
  }

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
              <input
                value={email}
                onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleSubscribe()}
                type="email"
                placeholder="Your email"
                style={{ flex:1, minWidth:180 }}
              />
              <button
                onClick={handleSubscribe}
                disabled={loading}
                style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",padding:"14px 22px",background:loading?C.navyLight:C.navy,color:C.cream,border:"none",cursor:loading?"not-allowed":"pointer",whiteSpace:"nowrap",transition:"all .22s",opacity:loading?0.7:1 }}
                onMouseOver={e=>{ if(!loading) e.currentTarget.style.background=C.navyLight; }}
                onMouseOut={e=>{ if(!loading) e.currentTarget.style.background=C.navy; }}>
                {loading ? "…" : "Subscribe"}
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
  const [essays, setEssays] = useState(LOCAL_ESSAYS);
  const scrollY = useScrollY();
  const mobile = useMobile();
  const scrolled = scrollY > 48;
  const scrollTargetRef = useRef(null);

  useEffect(() => {
    fetchEssays().then(data => { if (data && data.length) setEssays(data); });
    // Track initial page load once per session
    trackEvent({
      type: "page_view",
      page: window.location.pathname,
      sessionId: getSessionId(),
      referrer: getSessionReferrer(),
      device: getDevice(),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep link: /essay/{id}
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/essay\/(\d+)/);
    if (match) {
      const id = parseInt(match[1], 10);
      const found = essays.find(e => e.id === id);
      if (found) setEssay(found);
    }
  }, [essays]);

  const openEssay = (e) => {
    setEssay(e);
    window.history.replaceState(null, "", e ? `/essay/${e.id}` : "/");
    if (e) {
      trackEvent({
        type: "essay_view",
        page: `/essay/${e.id}`,
        sessionId: getSessionId(),
        referrer: getSessionReferrer(),
        device: getDevice(),
        essayId: e.id,
        essayTitle: e.title,
        essayTheme: e.theme,
      });
    }
  };

  useEffect(() => {
    if (scrollTargetRef.current) return;
    window.scrollTo({ top:0, behavior:"smooth" });
  }, [page, essay]);
  const go = (p) => { setPage(p); setEssay(null); setMenuOpen(false); window.history.replaceState(null, "", "/"); };
  const goToIdeas = () => { scrollTargetRef.current = "distilled-ideas"; go("thinking"); };

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
            <span className="pf" style={{ fontSize: mobile ? 17 : 19, fontWeight:700, color:C.navy, letterSpacing:".01em" }}>Unsecured</span>
          </div>

          {/* Desktop nav */}
          <div className="desk-only" style={{ display:"flex", gap:32, alignItems:"center" }}>
            {[["Home","home"],["Writing","thinking"],["The Audit","audit"],["Reconfiguration Lab","cohort"],["Work With Me","work"],["About","about"]].map(([l,p])=>(
              <span key={p} className={`ni${page===p?" on":""}`} onClick={()=>go(p)}>{l}</span>
            ))}
          </div>

          {/* Mobile: hamburger */}
          <div className="mob-only" style={{ display:"flex", alignItems:"center", gap:12 }}>
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
            {[["Home","home"],["Writing","thinking"],["The Audit","audit"],["Reconfiguration Lab","cohort"],["Work With Me","work"],["About","about"]].map(([l,p])=>(
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
        ? <EssayPage essay={essay} all={essays} setEssay={openEssay} scrollY={scrollY} mobile={mobile} px={px}/>
        : page==="home"      ? <HomePage go={go} goToIdeas={goToIdeas} essays={essays} setEssay={openEssay} scrollY={scrollY} mobile={mobile} px={px}/>
        : page==="thinking"  ? <ThinkingPage essays={essays} setEssay={openEssay} mobile={mobile} px={px} scrollTargetRef={scrollTargetRef}/>
        : page==="audit"     ? <SystemAuditPage mobile={mobile} px={px} essays={essays}/>
        : page==="cohort"    ? <CohortPage mobile={mobile} px={px}/>
        : page==="work"      ? <WorkPage mobile={mobile} px={px}/>
        : page==="about"     ? <AboutPage go={go} mobile={mobile} px={px}/>
        : null}

      {/* ── IDEAS TICKER ── */}
      <IdeasMarquee />

      {/* ── FOOTER ── */}
      {!essay && (
        <footer style={{ background:C.navy, color:C.cream, padding:`56px ${px} 40px`, position:"relative", overflow:"hidden" }}>
          <CrackPanel blendMode="screen" opacity={0.06} right="0" width="26%" />
          <div style={{ maxWidth:1120, margin:"0 auto", position:"relative" }}>
            <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(auto-fit,minmax(180px,1fr))", gap: mobile ? "32px 24px" : 48, marginBottom:48 }}>
              <div style={{ gridColumn: mobile ? "1/-1" : "auto" }}>
                <p className="pf" style={{ fontSize:20,fontWeight:700,marginBottom:12 }}>John Thornton</p>
                <p className="ss" style={{ fontSize:14,color:C.g400,lineHeight:1.8,marginBottom:20 }}>Thinking about pressure, internal systems, and the rules we never chose.</p>
                <a
                  href="https://www.linkedin.com/in/john-thornton-260b151"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display:"inline-flex", alignItems:"center", gap:8, textDecoration:"none", fontFamily:"'Source Sans 3',sans-serif", fontSize:12, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:C.g400, transition:"color .2s" }}
                  onMouseOver={e=>e.currentTarget.style.color=C.cream}
                  onMouseOut={e=>e.currentTarget.style.color=C.g400}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Connect on LinkedIn
                </a>
              </div>
              <div>
                <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:C.gold,marginBottom:16 }}>Navigate</p>
                {[["Home","home"],["Writing","thinking"],["The Audit","audit"],["Reconfiguration Lab","cohort"],["Work With Me","work"],["About","about"]].map(([l,p])=>(
                  <p key={p} onClick={()=>go(p)} className="ss" style={{ fontSize:14,color:C.g400,marginBottom:10,cursor:"pointer",transition:"color .2s" }}
                    onMouseOver={e=>e.target.style.color=C.cream} onMouseOut={e=>e.target.style.color=C.g400}>{l}</p>
                ))}
              </div>
              <div>
                <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:C.gold,marginBottom:16 }}>The Book</p>
                <p className="lb" style={{ fontSize:14,color:C.g400,lineHeight:1.7,fontStyle:"italic",marginBottom:20 }}>Unsecured: Why Pressure Isn't the Problem</p>
                <a href="https://a.co/d/0dpaVYPc" target="_blank" rel="noopener noreferrer" className="btn-oc" style={{ fontSize:10.5, textDecoration:"none" }}>Get the Book</a>
              </div>
            </div>
            <div style={{ width:"100%",height:1,background:`linear-gradient(to right, transparent, ${C.navyMid}, transparent)`,marginBottom:24 }}/>
            <div style={{ display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
              <p className="ss" style={{ fontSize:12,color:C.g600 }}>© 2026 John Thornton. All rights reserved.</p>
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
function HomePage({ go, goToIdeas, essays, setEssay, scrollY, mobile, px }) {
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
              { icon:"⊞", label:"A Quick Shift", sub:"Single concepts and reframes. The kind of thing that takes two minutes to read and stays with you longer than it should.", action:goToIdeas, badge:"Ideas Lab" },
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
            {[1,3,8].map(id=>essays.find(e=>e.id===id)).filter(Boolean).map((e,i) => (
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
              <a href="https://a.co/d/0dpaVYPc" target="_blank" rel="noopener noreferrer" className="btn-d mob-full" style={{ textAlign:"center", textDecoration:"none" }}>Get the Book</a>
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
      <EmailCapture />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// THINKING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function ThinkingPage({ essays, setEssay, mobile, px, scrollTargetRef }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    if (scrollTargetRef?.current === "distilled-ideas") {
      scrollTargetRef.current = null;
      setTimeout(() => {
        document.getElementById("distilled-ideas")?.scrollIntoView({ behavior:"smooth", block:"start" });
      }, 80);
    }
  }, []);
  const searchLow = search.toLowerCase().trim();
  const filtered = essays
    .filter(e => filter === "All" || e.theme === filter)
    .filter(e => !searchLow || e.title.toLowerCase().includes(searchLow) || e.hook.toLowerCase().includes(searchLow));
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div style={{ maxWidth:1120, margin:"0 auto", padding:`56px ${px}` }}>
      <Reveal style={{ marginBottom:48 }}>
        <div style={{ width:36,height:2,background:C.gold,marginBottom:18 }}/>
        <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:C.gold,marginBottom:10 }}>Thinking Out Loud</p>
        <h1 className="pf" style={{ fontSize:"clamp(32px,7vw,56px)",fontWeight:900,color:C.navy,lineHeight:1.05,marginBottom:20,letterSpacing:"-.02em" }}>Thinking</h1>
        <p className="ss" style={{ fontSize:16,lineHeight:1.85,color:C.g600,maxWidth:520 }}>Extended explorations on the same territory as the book — not lessons, not summaries. Different angles on the same question: what's actually running underneath the way you operate.</p>
      </Reveal>
      {/* Search */}
      <div style={{ marginBottom:20 }}>
        <input
          type="search"
          value={search}
          onChange={e=>{ setSearch(e.target.value); setVisibleCount(6); }}
          placeholder="Search essays…"
          style={{ maxWidth:380, padding:"11px 16px", border:`1.5px solid ${C.g200}`, background:"white", fontFamily:"'Source Sans 3',sans-serif", fontSize:14, color:C.g800, outline:"none", borderRadius:0, width:"100%", transition:"border-color .2s" }}
          onFocus={e=>e.target.style.borderColor=C.navy}
          onBlur={e=>e.target.style.borderColor=C.g200}
        />
      </div>
      {/* Scrollable filters on mobile */}
      <div style={{ overflowX:"auto", marginBottom:44, paddingBottom:4, scrollbarWidth:"none" }}>
        <div style={{ display:"flex", gap:8, width:"max-content" }}>
          {THEMES.map(t => (
            <button key={t} onClick={()=>{ setFilter(t); setVisibleCount(6); }} style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"8px 14px",background:filter===t?C.navy:"white",color:filter===t?C.cream:C.g600,border:`1px solid ${filter===t?C.navy:C.g200}`,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",minHeight:40 }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr", gap: mobile ? 0 : 72, alignItems:"start" }}>
        <div>
          {visible.map((e,i) => (
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
          {hasMore && (
            <div style={{ paddingTop:32, paddingBottom:8 }}>
              <button
                onClick={()=>setVisibleCount(c=>c+6)}
                style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",padding:"14px 32px",background:"white",color:C.navy,border:`1.5px solid ${C.navy}`,cursor:"pointer",transition:"all .22s" }}
                onMouseOver={e=>{e.currentTarget.style.background=C.navy;e.currentTarget.style.color=C.cream}}
                onMouseOut={e=>{e.currentTarget.style.background="white";e.currentTarget.style.color=C.navy}}
              >
                Load More ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
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
                <a href="https://a.co/d/0dpaVYPc" target="_blank" rel="noopener noreferrer" className="btn-d" style={{ width:"100%", textDecoration:"none", display:"block", textAlign:"center" }}>Get the Book</a>
              </div>
            </div>
          </Reveal>
        )}
      </div>

      {/* ── DISTILLED IDEAS ── */}
      {(() => {
        const filteredIdeas = IDEAS
          .filter(idea => filter === "All" || idea.theme === filter)
          .filter(idea => !searchLow || idea.title.toLowerCase().includes(searchLow) || idea.body.toLowerCase().includes(searchLow));
        if (filteredIdeas.length === 0) return null;
        return (
          <div id="distilled-ideas" style={{ marginTop:80, paddingTop:64, borderTop:`1px solid ${C.g200}` }}>
            <Reveal style={{ marginBottom:36 }}>
              <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".2em",textTransform:"uppercase",color:C.gold,marginBottom:10 }}>Distilled Ideas</p>
              <h2 className="pf" style={{ fontSize:"clamp(22px,4vw,32px)",fontWeight:700,color:C.navy,marginBottom:12,lineHeight:1.1 }}>Concepts &amp; Reframes</h2>
              <p className="ss" style={{ fontSize:14,lineHeight:1.85,color:C.g600,maxWidth:480 }}>Quick concepts. Two minutes to read. Designed to shift one thing about how you're seeing a situation.</p>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit,minmax(290px,1fr))", gap:14 }}>
              {filteredIdeas.map((idea,i) => (
                <Reveal key={idea.id} delay={i*.03}>
                  <div style={{ background:"white",border:`1px solid ${C.g200}`,padding: mobile ? "24px 20px" : "28px 30px",transition:"all .26s" }}
                    onMouseOver={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 22px rgba(0,0,0,.07)"}}
                    onMouseOut={e=>{e.currentTarget.style.borderColor=C.g200;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
                      <span className="ss" style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"4px 10px",background:`${TC[idea.theme]}14`,color:TC[idea.theme],border:`1px solid ${TC[idea.theme]}30` }}>{idea.theme}</span>
                      <span className="ss" style={{ fontSize:9.5,color:C.g400,letterSpacing:".1em",textTransform:"uppercase",fontWeight:700,padding:"4px 10px",border:`1px solid ${C.g200}` }}>{idea.type}</span>
                    </div>
                    <h3 className="pf" style={{ fontSize: mobile ? 17 : 18,fontWeight:700,color:C.navy,marginBottom:10,lineHeight:1.3 }}>{idea.title}</h3>
                    <p className="ss" style={{ fontSize:13,lineHeight:1.85,color:C.g600 }}>{idea.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESSAY PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function EssayPage({ essay, all, setEssay, scrollY, mobile, px }) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareDraft, setShareDraft] = useState("");

  function shareUrl() {
    return window.location.origin + "/essay/" + essay.id;
  }

  const themeHashtags = {
    Pressure:         "#Leadership #Burnout #WorkplaceCulture #HighPerformance #Resilience #Pressure",
    Urgency:          "#Urgency #Productivity #WorkplaceCulture #Leadership #MentalHealth #Burnout",
    "Internal Rules": "#SelfAwareness #PersonalGrowth #Leadership #WorkplaceCulture #MindsetShift",
    Reconfiguration:  "#PersonalDevelopment #Leadership #WorkplaceCulture #Growth #Reconfiguration",
  };

  function openShare() {
    const url = shareUrl();
    const hashtags = themeHashtags[essay.theme] || "#Leadership #WorkplaceCulture #PersonalGrowth";
    const quote = essay.pullQuote || essay.hook;
    const draft = [
      essay.hook,
      "",
      `"${quote}"`,
      "",
      `Full essay → ${url}`,
      "",
      hashtags,
    ].join("\n");
    setShareDraft(draft);
    setShareOpen(true);
  }

  function postToLinkedIn() {
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareDraft)}`, "_blank", "noopener,noreferrer");
    trackEvent({ type: "share_click", platform: "LinkedIn", essayId: essay.id, essayTitle: essay.title, sessionId: getSessionId(), device: getDevice() });
  }

  function postToX() {
    const quote = essay.pullQuote || essay.hook;
    const xText = `"${quote}"\n\n— ${essay.title}`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(shareUrl())}`,
      "_blank", "noopener,noreferrer"
    );
    trackEvent({ type: "share_click", platform: "X", essayId: essay.id, essayTitle: essay.title, sessionId: getSessionId(), device: getDevice() });
  }

  function postToFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl())}`,
      "_blank", "noopener,noreferrer"
    );
    trackEvent({ type: "share_click", platform: "Facebook", essayId: essay.id, essayTitle: essay.title, sessionId: getSessionId(), device: getDevice() });
  }

  function copyText() {
    navigator.clipboard.writeText(shareDraft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      trackEvent({ type: "share_click", platform: "Copy Text", essayId: essay.id, essayTitle: essay.title, sessionId: getSessionId(), device: getDevice() });
    });
  }
  const related = essay.related.map(id=>all.find(e=>e.id===id)).filter(Boolean);
  const totalH = typeof document!=="undefined" ? document.body?.scrollHeight - window.innerHeight : 1;
  const prog = Math.min(100, (scrollY / Math.max(totalH, 1)) * 100);

  return (
    <div style={{ background:C.g100 }}>
      {/* Unified share modal */}
      {shareOpen && (
        <div style={{ position:"fixed",inset:0,zIndex:500,background:"rgba(13,23,32,.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
          onClick={() => setShareOpen(false)}>
          <div style={{ background:"white",maxWidth:560,width:"100%",padding: mobile ? "24px 20px" : "32px 36px",boxShadow:"0 24px 64px rgba(0,0,0,.35)",maxHeight:"92vh",overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <p className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:C.gold,margin:0 }}>Share This Essay</p>
              <button onClick={() => setShareOpen(false)}
                style={{ background:"none",border:"none",cursor:"pointer",fontSize:20,color:C.g400,lineHeight:1,padding:"0 4px" }}>×</button>
            </div>
            {/* Card preview — CSS-rendered, no network dependency */}
            <div style={{ marginBottom:20, border:`1px solid ${C.g200}` }}>
              <CardPreview essay={essay} />
            </div>
            {/* Editable post blurb */}
            <p className="ss" style={{ fontSize:11,color:C.g400,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8 }}>Your post</p>
            <textarea
              autoFocus
              value={shareDraft}
              onChange={e => setShareDraft(e.target.value)}
              rows={8}
              style={{ width:"100%",boxSizing:"border-box",fontFamily:"'Source Sans 3',sans-serif",fontSize:13,lineHeight:1.75,color:C.g800,border:`1px solid ${C.g200}`,padding:"14px 16px",resize:"vertical",outline:"none",background:C.g100,marginBottom:6 }}
            />
            <p className="ss" style={{ fontSize:11,color:C.g400,lineHeight:1.6,marginBottom:20 }}>
              Edit freely · X post uses a condensed version · Facebook uses the article preview image
            </p>
            {/* Platform buttons */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              <button onClick={postToLinkedIn} className="btn-d" style={{ fontSize:11,justifySelf:"stretch" }}>
                Post to LinkedIn
              </button>
              <button onClick={postToX}
                style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"11px 18px",background:C.navy,color:"white",border:"none",cursor:"pointer" }}>
                Post to X
              </button>
              <button onClick={postToFacebook}
                style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"11px 18px",background:"#1877f2",color:"white",border:"none",cursor:"pointer" }}>
                Share on Facebook
              </button>
              <button onClick={copyText}
                style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"11px 18px",background:"transparent",color:C.g600,border:`1px solid ${C.g200}`,cursor:"pointer" }}>
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <a href="https://a.co/d/0dpaVYPc" target="_blank" rel="noopener noreferrer" className="btn-d" style={{ fontSize:10.5, textDecoration:"none" }}>Get Unsecured</a>
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

        {/* Share */}
        <Reveal>
          <div style={{ marginTop:48, paddingTop:28, borderTop:`1px solid ${C.g200}`, display:"flex", alignItems:"center", gap:10 }}>
            <span className="ss" style={{ fontSize:11,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:C.g400,marginRight:4 }}>Share</span>
            <button onClick={openShare}
              style={{ fontFamily:"'Source Sans 3',sans-serif",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",padding:"8px 18px",background:C.navy,color:"white",border:"none",cursor:"pointer",transition:"all .2s" }}
              onMouseOver={e=>e.currentTarget.style.opacity=".85"}
              onMouseOut={e=>e.currentTarget.style.opacity="1"}>
              Share This Essay →
            </button>
          </div>
        </Reveal>
      </div>

      {/* Newsletter */}
      <EmailCapture />
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

// ─── IDEAS MARQUEE ────────────────────────────────────────────────────────────
function IdeasMarquee() {
  const items = [...IDEAS, ...IDEAS];
  return (
    <div style={{ background:C.navyMid, borderTop:`1px solid ${C.navyLight}`, overflow:"hidden", padding:"13px 0" }}>
      <style>{`@keyframes iq{from{transform:translateX(0)}to{transform:translateX(-50%)}} .iq-t{display:flex;width:max-content;animation:iq 80s linear infinite}.iq-t:hover{animation-play-state:paused}`}</style>
      <div className="iq-t">
        {items.map((idea, i) => (
          <span key={i} style={{ fontFamily:"'Source Sans 3',sans-serif", fontSize:10.5, fontWeight:600, letterSpacing:".15em", textTransform:"uppercase", whiteSpace:"nowrap", padding:"0 28px", color: i % 2 === 0 ? C.goldLight : "rgba(244,239,230,.22)" }}>
            {idea.title}{i % 2 !== 0 ? " ·" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORK PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function WorkPage({ mobile, px }) {
  const offerings = [
    { title: "Speaking", icon: "◈", color: TC.Pressure, status: "Available", statusColor: "#4a7a5a", desc: "Keynotes on pressure, urgency, and internal configuration for leadership teams and conferences.", topics: ["Why burnout is a systems problem", "Urgency as a cultural default", "Reconfiguring how teams carry pressure"] },
    { title: "Workshops", icon: "⊞", color: TC.Urgency, status: "In Development", statusColor: C.g400, desc: "Half-day and full-day workshops that move teams from awareness to practical reconfiguration.", topics: ["Identifying invisible internal rules", "Building latency back", "Margin by design"] },
    { title: "Advisory", icon: "◇", color: TC.Reconfiguration, status: "Limited", statusColor: C.gold, desc: "Working directly with leaders operating under configurations that no longer serve them.", topics: ["One-on-one sessions", "Leadership team alignment", "Pressure assessment"] },
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{ background: C.navy, padding: mobile ? `72px ${px} 80px` : `96px ${px} 104px`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 25% 60%, ${C.navyLight} 0%, transparent 65%)`, opacity: 0.85 }} />
        <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ width: 36, height: 2, background: C.gold, marginBottom: 20 }} />
            <p className="ss" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: C.gold, marginBottom: 14 }}>
              Collaboration
            </p>
            <h1 className="pf" style={{ fontSize: mobile ? "clamp(32px,9vw,52px)" : "clamp(36px,5vw,60px)", fontWeight: 900, color: C.cream, lineHeight: 1.08, marginBottom: 20, letterSpacing: "-.02em" }}>
              Work With Me
            </h1>
            <p className="lb" style={{ fontSize: mobile ? 16 : 19, lineHeight: 1.72, color: "rgba(244,239,230,.65)", fontStyle: "italic", marginBottom: 16 }}>
              The goal is never to energize — it's to help you see what you've been operating inside of.
            </p>
            <p className="ss" style={{ fontSize: mobile ? 14 : 15, lineHeight: 1.85, color: "rgba(244,239,230,.48)", maxWidth: 520 }}>
              The framing is systems-based, not motivational. I work best with people who are already high-functioning and want to understand why the system they've built is costing more than it should.
            </p>
          </div>
        </div>
      </div>

      {/* Offerings */}
      <div style={{ background: C.g100, padding: mobile ? `56px ${px}` : `72px ${px}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: mobile ? 16 : 6 }}>
            {offerings.map((item, i) => (
              <Reveal key={item.title} delay={i * .08}>
                <div style={{ background: "white", borderTop: `3px solid ${item.color}`, padding: mobile ? "28px 24px" : "40px 36px", transition: "all .26s", height: "100%", display: "flex", flexDirection: "column" }}
                  onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.08)"; }}
                  onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div style={{ fontSize: 26, color: item.color }}>{item.icon}</div>
                    <span className="ss" style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700, color: item.statusColor, padding: "4px 10px", border: `1px solid ${item.statusColor}40`, background: `${item.statusColor}0d` }}>
                      {item.status}
                    </span>
                  </div>
                  <h2 className="pf" style={{ fontSize: mobile ? 24 : 26, fontWeight: 900, color: C.navy, marginBottom: 12, letterSpacing: "-.01em" }}>{item.title}</h2>
                  <p className="ss" style={{ fontSize: 14, lineHeight: 1.82, color: C.g600, marginBottom: 22 }}>{item.desc}</p>
                  <div style={{ flex: 1 }}>
                    {item.topics.map(t => (
                      <div key={t} style={{ display: "flex", gap: 10, marginBottom: 9 }}>
                        <span style={{ color: C.gold, marginTop: 4, fontSize: 9, flexShrink: 0 }}>▸</span>
                        <span className="ss" style={{ fontSize: 14, color: C.g600, lineHeight: 1.55 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* How I work */}
      <div style={{ background: C.creamDark, borderTop: `1px solid ${C.g200}`, borderBottom: `1px solid ${C.g200}`, padding: mobile ? `48px ${px}` : `56px ${px}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: mobile ? 36 : 52 }}>
          {[
            { label: "Systems-Based", body: "Not motivational. Not prescriptive. The work is understanding what's running and why — before doing anything about it." },
            { label: "High-Functioning Clients", body: "I work best with people who are already capable and want to understand why their system is costing more than it should." },
            { label: "No Performance Theater", body: "The goal isn't a framework you can explain. It's clarity about what's actually driving how you operate." },
          ].map(({ label, body }) => (
            <Reveal key={label}>
              <div style={{ borderLeft: `2px solid ${C.gold}`, paddingLeft: 20 }}>
                <h3 className="pf" style={{ fontSize: mobile ? 18 : 20, fontWeight: 700, color: C.navy, marginBottom: 10 }}>{label}</h3>
                <p className="ss" style={{ fontSize: 14, lineHeight: 1.85, color: C.g600 }}>{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Inquiry form */}
      <div style={{ background: C.g100, padding: mobile ? `56px ${px}` : `72px ${px}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <InquiryForm mobile={mobile} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INQUIRY FORM
// ═══════════════════════════════════════════════════════════════════════════════
function InquiryForm({ mobile }) {
  const [form, setForm] = useState({
    name: "", email: "", organization: "", role: "", teamSize: "",
    interests: [], message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function toggleInterest(interest) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        organization: form.organization.trim(),
        role: form.role.trim(),
        teamSize: form.teamSize,
        interests: form.interests,
        message: form.message.trim(),
      });
      setDone(true);
    } catch (err) {
      setError("Something went wrong. Please try again or email directly.");
      console.error("submitInquiry failed:", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle = {
    width: "100%", padding: "13px 15px",
    border: `1.5px solid ${C.g200}`, background: "white", color: C.g800,
    fontFamily: "'Source Sans 3',sans-serif", fontSize: 14,
    outline: "none", boxSizing: "border-box", borderRadius: 0,
    transition: "border-color .22s",
  };

  const labelStyle = {
    display: "block", fontFamily: "'Source Sans 3',sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: ".12em",
    textTransform: "uppercase", color: C.g600, marginBottom: 8,
  };

  return (
    <div style={{ background: "white", border: `1px solid ${C.g200}`, padding: mobile ? "32px 28px" : "48px 52px", borderTop: `3px solid ${C.navy}` }}>
      <div style={{ width: 36, height: 2, background: C.gold, marginBottom: 20 }} />
      <h2 className="pf" style={{ fontSize: mobile ? 24 : 28, fontWeight: 700, color: C.navy, marginBottom: 12, letterSpacing: "-.01em" }}>
        Start a Conversation
      </h2>
      <p className="ss" style={{ fontSize: 15, lineHeight: 1.85, color: C.g600, marginBottom: 32, maxWidth: 560 }}>
        If something here is relevant to your organization or leadership team, use this form to reach out. I'll follow up directly.
      </p>

      {done ? (
        <div style={{ padding: "32px 36px", background: C.creamDark, border: `1px solid ${C.g200}`, borderLeft: `3px solid ${C.gold}` }}>
          <p className="pf" style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Message received.</p>
          <p className="ss" style={{ fontSize: 15, color: C.g600, lineHeight: 1.8 }}>
            I'll follow up within a few days. Thank you for reaching out.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: "16px 24px", marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Name <span style={{ color: "#c0392b" }}>*</span></label>
              <input
                style={fieldStyle} type="text" value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="Your full name"
                onFocus={e => e.target.style.borderColor = C.navy}
                onBlur={e => e.target.style.borderColor = C.g200}
              />
            </div>
            <div>
              <label style={labelStyle}>Email <span style={{ color: "#c0392b" }}>*</span></label>
              <input
                style={fieldStyle} type="email" value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="you@example.com"
                onFocus={e => e.target.style.borderColor = C.navy}
                onBlur={e => e.target.style.borderColor = C.g200}
              />
            </div>
            <div>
              <label style={labelStyle}>Organization</label>
              <input
                style={fieldStyle} type="text" value={form.organization}
                onChange={e => set("organization", e.target.value)}
                placeholder="Company or team name"
                onFocus={e => e.target.style.borderColor = C.navy}
                onBlur={e => e.target.style.borderColor = C.g200}
              />
            </div>
            <div>
              <label style={labelStyle}>Your Role</label>
              <input
                style={fieldStyle} type="text" value={form.role}
                onChange={e => set("role", e.target.value)}
                placeholder="e.g. VP of Engineering"
                onFocus={e => e.target.style.borderColor = C.navy}
                onBlur={e => e.target.style.borderColor = C.g200}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Team Size</label>
            <select
              value={form.teamSize}
              onChange={e => set("teamSize", e.target.value)}
              style={{ ...fieldStyle, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2368605a' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
              onFocus={e => e.target.style.borderColor = C.navy}
              onBlur={e => e.target.style.borderColor = C.g200}
            >
              <option value="">Select team size</option>
              <option value="1–10">1–10</option>
              <option value="11–50">11–50</option>
              <option value="51–200">51–200</option>
              <option value="200+">200+</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Areas of Interest</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["Speaking", "Workshops", "Advisory"].map(interest => {
                const selected = form.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "9px 16px", background: selected ? C.navy : "white", color: selected ? C.cream : C.g600, border: `1.5px solid ${selected ? C.navy : C.g200}`, cursor: "pointer", transition: "all .2s" }}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Message</label>
            <textarea
              value={form.message}
              onChange={e => set("message", e.target.value)}
              placeholder="What's the context? What are you working on or thinking about?"
              rows={5}
              style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.65 }}
              onFocus={e => e.target.style.borderColor = C.navy}
              onBlur={e => e.target.style.borderColor = C.g200}
            />
          </div>

          {error && (
            <p className="ss" style={{ fontSize: 13, color: "#e74c3c", marginBottom: 16 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-d"
            style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Sending…" : "Send Inquiry"}
          </button>
        </form>
      )}
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
        <div style={{ maxWidth:1120,margin:"0 auto",display:"grid",gridTemplateColumns: mobile ? "1fr" : "1fr auto",gap: mobile ? 40 : 80,alignItems:"center",position:"relative",zIndex:2 }}>
          <div>
            {/* Mobile portrait */}
            {mobile && (
              <div style={{ position:"relative", width:140, marginBottom:32 }}>
                <div style={{ position:"absolute", top:-8, left:-8, width:"100%", height:"100%", border:`2px solid ${C.gold}`, opacity:0.5, zIndex:0 }} />
                <img src="/About2.PNG" alt="John Thornton"
                  style={{ position:"relative", zIndex:1, width:140, height:168, objectFit:"cover", objectPosition:"center top", display:"block", boxShadow:"0 12px 36px rgba(0,0,0,.5)" }}
                />
              </div>
            )}
            <div style={{ width:36,height:2,background:C.gold,marginBottom:20 }}/>
            <h1 className="pf" style={{ fontSize: mobile ? "clamp(32px,9vw,52px)" : "clamp(36px,5.5vw,60px)",fontWeight:900,color:C.cream,marginBottom:18,lineHeight:1.05,letterSpacing:"-.02em" }}>John Thornton</h1>
            <p className="lb" style={{ fontSize: mobile ? 17 : 19,fontStyle:"italic",color:"rgba(244,239,230,.65)",marginBottom:16,lineHeight:1.65 }}>Cybersecurity professional. Author.<br/>Observer of invisible systems.</p>
            <p className="ss" style={{ fontSize:15,color:"rgba(244,239,230,.45)",lineHeight:1.8 }}>Writing about the intersection of how systems work and how people fail to see themselves as worth troubleshooting.</p>
          </div>

          {/* Desktop portrait */}
          {!mobile && (
            <div style={{ position:"relative", flexShrink:0, width:300 }}>
              {/* Offset gold frame behind photo */}
              <div style={{ position:"absolute", bottom:-14, right:-14, width:"100%", height:"100%", border:`2px solid ${C.gold}`, opacity:0.35, zIndex:0 }} />
              {/* Photo */}
              <img src="/About2.PNG" alt="John Thornton"
                style={{ position:"relative", zIndex:1, display:"block", width:"100%", height:390, objectFit:"cover", objectPosition:"center top", boxShadow:"0 24px 64px rgba(0,0,0,.55)" }}
              />
              {/* Caption gradient overlay */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:2, background:"linear-gradient(to top, rgba(13,23,32,.92) 50%, transparent)", padding:"44px 20px 20px", pointerEvents:"none" }}>
                <p className="ss" style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:C.gold, marginBottom:4 }}>John Thornton</p>
                <p className="ss" style={{ fontSize:12, color:"rgba(244,239,230,.45)", letterSpacing:".06em" }}>Author</p>
              </div>
            </div>
          )}
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
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

