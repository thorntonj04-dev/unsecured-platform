import { ImageResponse } from '@vercel/og';

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
  const { searchParams } = new URL(req.url);
  const quote  = (searchParams.get('quote')  || '').slice(0, 250).trim();
  const theme  = searchParams.get('theme')   || 'Pressure';
  const label  = (searchParams.get('label')  || '').slice(0, 80).trim();
  const author = (searchParams.get('author') || 'John Thornton').slice(0, 60).trim();

  if (!quote) {
    return new Response('Missing quote parameter', { status: 400 });
  }

  const tc = TC[theme] || TC.Pressure;
  const quoteFontSize = quote.length > 130 ? 34 : quote.length > 85 ? 40 : 48;

  // Build middle-section children dynamically so the label row is
  // omitted entirely when not provided (Satori has no display:none).
  const middleKids = [];
  if (label) {
    middleKids.push(
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
      }, label),
    );
  }
  middleKids.push(
    h('div', {
      style: {
        display: 'flex',
        height: 1,
        background: 'rgba(184,148,63,0.45)',
        marginBottom: 32,
      },
    }),
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
  );

  const middleSection = {
    type: 'div',
    key: null,
    props: { style: { display: 'flex', flexDirection: 'column' }, children: middleKids },
  };

  return new ImageResponse(
    h('div', {
      style: { display: 'flex', width: '100%', height: '100%', background: '#0d1720' },
    },
      h('div', {
        style: { display: 'flex', width: 8, height: '100%', background: '#b8943f', flexShrink: 0 },
      }),
      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          padding: '52px 76px 52px 72px',
          justifyContent: 'space-between',
        },
      },
        // TOP: theme badge right-aligned
        h('div', { style: { display: 'flex', justifyContent: 'flex-end' } },
          h('div', {
            style: {
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '6px 18px',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: tc.hex,
              background: tc.rgba,
              color: tc.hex,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            },
          }, theme),
        ),
        // MIDDLE: optional label + gold rule + quote
        middleSection,
        // BOTTOM: author + wordmark
        h('div', {
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
        },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 5 } },
            h('div', {
              style: { display: 'flex', fontSize: 30, fontWeight: 800, color: '#b8943f', letterSpacing: '0.04em' },
            }, author),
            h('div', {
              style: { display: 'flex', fontSize: 19, fontWeight: 400, color: 'rgba(244,239,230,0.35)', letterSpacing: '0.1em' },
            }, 'unsecuredsystem.com'),
          ),
          h('div', {
            style: { display: 'flex', fontSize: 15, fontWeight: 900, color: 'rgba(244,239,230,0.09)', letterSpacing: '0.35em' },
          }, 'UNSECURED'),
        ),
      ),
    ),
    { width: 1200, height: 630 },
  );
}
