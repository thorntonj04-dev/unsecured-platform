// ─── EMAIL DELIVERY VIA EMAILJS ───────────────────────────────────────────────
// Requires a free account at emailjs.com.
// Create one email service (Gmail works) and two templates, then add to .env.local:
//
//   VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
//   VITE_EMAILJS_AUDIT_TEMPLATE_ID=template_xxxxxxx
//   VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
//
// Audit result template variables:
//   {{to_name}}           — recipient first name (or "there")
//   {{to_email}}          — recipient email (set as "To Email" in template)
//   {{primary_profile}}   — e.g. "The Endurance System"
//   {{primary_theme}}     — e.g. "Pressure"
//   {{secondary_profile}} — e.g. "The High-Frequency System"
//   {{secondary_theme}}   — e.g. "Urgency"
//   {{scores_text}}       — e.g. "Pressure: 6 · Urgency: 9 · Internal Rules: 14 · Reconfiguration: 17"
//   {{site_url}}          — site origin for CTA link back to audit

import { send } from "@emailjs/browser";

const SVC  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TPL  = import.meta.env.VITE_EMAILJS_AUDIT_TEMPLATE_ID;
const KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const CONFIGURED = !!(SVC && TPL && KEY);

const PROFILE_NAMES = {
  Pressure:         "The Endurance System",
  Urgency:          "The High-Frequency System",
  "Internal Rules": "The Open Port System",
  Reconfiguration:  "The Drifted System",
};

export async function sendAuditResultEmail({ email, name, profile, secondaryProfile, scores }) {
  if (!CONFIGURED) return;
  const scoresText = Object.entries(scores)
    .sort((a, b) => a[1] - b[1])
    .map(([theme, score]) => `${theme}: ${score}/20`)
    .join(" · ");
  await send(SVC, TPL, {
    to_name:           name || "there",
    to_email:          email,
    primary_profile:   PROFILE_NAMES[profile] || profile,
    primary_theme:     profile,
    secondary_profile: PROFILE_NAMES[secondaryProfile] || secondaryProfile || "",
    secondary_theme:   secondaryProfile || "",
    scores_text:       scoresText,
    site_url:          window.location.origin,
  }, KEY);
}
