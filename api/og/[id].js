import { ImageResponse } from '@vercel/og';
import { LINKEDIN_ARTICLES } from '../../src/essays.js';

export const config = { runtime: 'edge' };

const TC = {
  Pressure:         { hex: '#8b6e52', rgba: 'rgba(139,110,82,0.5)' },
  Urgency:          { hex: '#4e6878', rgba: 'rgba(78,104,120,0.5)' },
  'Internal Rules': { hex: '#5f7050', rgba: 'rgba(95,112,80,0.5)' },
  Reconfiguration:  { hex: '#7a6b52', rgba: 'rgba(122,107,82,0.5)' },
};

function h(type, props, ...children) {
  const c =
    children.length === 0 ? undefined
    : children.length === 1 ? children[0]
    : children;
  return { type, key: null, props: c !== undefined ? { ...props, children: c } : props };
}

export default async function handler(req) {
  const url = new URL(req.url);
  const id = parseInt(url.pathname.split('/').pop(), 10);
  const essay = LINKEDIN_ARTICLES.find(e => e.id === id);

  if (!essay) {
    return new Response('Not found', { status: 404 });
  }

  const theme = TC[essay.theme] || TC.Pressure;

  const rawQuote = essay.pullQuote || essay.hook;
  const quote = rawQuote.length > 185 ? rawQuote.slice(0, 182) + '…' : rawQuote;

  const label = essay.title.length > 65 ? essay.title.slice(0, 62) + '…' : essay.title;

  const quoteFontSize = quote.length > 130 ? 34 : quote.length > 85 ? 40 : 48;

  return new ImageResponse(
    h('div', {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#0d1720',
      },
    },
      // Gold left accent bar
      h('div', {
        style: {
          display: 'flex',
          width: 8,
          height: '100%',
          background: '#b8943f',
          flexShrink: 0,
        },
      }),
      // Main content column
      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          padding: '52px 76px 52px 72px',
          justifyContent: 'space-between',
        },
      },

        // TOP: theme badge, right-aligned
        h('div', {
          style: { display: 'flex', justifyContent: 'flex-end' },
        },
          h('div', {
            style: {
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '6px 18px',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: theme.hex,
              background: theme.rgba,
              color: theme.hex,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            },
          }, essay.theme),
        ),

        // MIDDLE: essay label + gold rule + quote (the hero)
        h('div', {
          style: { display: 'flex', flexDirection: 'column' },
        },
          // "FROM:" label
          h('div', {
            style: {
              display: 'flex',
              fontSize: 17,
              fontWeight: 700,
              color: 'rgba(184,148,63,0.6)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 20,
            },
          }, `FROM: ${label}`),

          // Gold rule
          h('div', {
            style: {
              display: 'flex',
              height: 1,
              background: 'rgba(184,148,63,0.45)',
              marginBottom: 32,
            },
          }),

          // Pull quote — the hero
          h('div', {
            style: {
              display: 'flex',
              fontSize: quoteFontSize,
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#f4efe6',
              lineHeight: 1.5,
              letterSpacing: '-0.01em',
              maxWidth: 980,
            },
          }, `“${quote}”`),
        ),

        // BOTTOM: author left, site + wordmark right
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          },
        },
          // Author block
          h('div', {
            style: { display: 'flex', flexDirection: 'column', gap: 5 },
          },
            h('div', {
              style: {
                display: 'flex',
                fontSize: 30,
                fontWeight: 800,
                color: '#b8943f',
                letterSpacing: '0.04em',
              },
            }, 'John Thornton'),
            h('div', {
              style: {
                display: 'flex',
                fontSize: 19,
                fontWeight: 400,
                color: 'rgba(244,239,230,0.35)',
                letterSpacing: '0.1em',
              },
            }, 'unsecuredsystem.com'),
          ),
          // Faint wordmark
          h('div', {
            style: {
              display: 'flex',
              fontSize: 15,
              fontWeight: 900,
              color: 'rgba(244,239,230,0.09)',
              letterSpacing: '0.35em',
            },
          }, 'UNSECURED'),
        ),
      ),
    ),
    { width: 1200, height: 630 },
  );
}
