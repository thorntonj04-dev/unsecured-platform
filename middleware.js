import { LOCAL_ESSAYS } from "./src/essays.js";

export const config = {
  matcher: ["/essay/:id"],
};

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const id = parseInt(url.pathname.split("/")[2], 10);

  const essay = LOCAL_ESSAYS.find((e) => e.id === id);
  if (!essay) return;

  // Fetch the built index.html (static file, won't re-trigger this middleware)
  let html;
  try {
    const res = await fetch(new URL("/index.html", url).toString());
    html = await res.text();
  } catch {
    return; // fall through to normal Vercel handling
  }

  const title = esc(essay.title);
  const desc = esc(essay.hook);
  const canonicalUrl = `${url.origin}/essay/${id}`;

  const tags =
    `<title>${title} — Unsecured</title>\n` +
    `    <meta name="description" content="${desc}" />\n` +
    `    <meta property="og:site_name" content="Unsecured" />\n` +
    `    <meta property="og:type" content="article" />\n` +
    `    <meta property="og:title" content="${title} — Unsecured" />\n` +
    `    <meta property="og:description" content="${desc}" />\n` +
    `    <meta property="og:url" content="${canonicalUrl}" />\n` +
    `    <meta name="twitter:card" content="summary" />\n` +
    `    <meta name="twitter:title" content="${title}" />\n` +
    `    <meta name="twitter:description" content="${desc}" />\n`;

  html = html.replace("<head>", `<head>\n    ${tags}`);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
