import { ImageResponse } from '@vercel/og';
import { LOCAL_ESSAYS } from '../../src/essays.js';

export const config = { runtime: 'edge' };

const TC = {
  Pressure: '#8b6e52',
  Urgency: '#4e6878',
  'Internal Rules': '#5f7050',
  Reconfiguration: '#7a6b52',
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
  const essay = LOCAL_ESSAYS.find(e => e.id === id);

  if (!essay) {
    return new Response('Not found', { status: 404 });
  }

  const themeColor = TC[essay.theme] || '#8b6e52';
  const titleSize = essay.title.length > 44 ? '50px' : '62px';
  const subhead = essay.subhead.length > 82
    ? essay.subhead.slice(0, 79) + '…'
    : essay.subhead;

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
          width: '8px',
          height: '100%',
          background: '#b8943f',
          flexShrink: '0',
        },
      }),
      // Main content column
      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: '1',
          padding: '64px 80px 56px 72px',
          justifyContent: 'space-between',
        },
      },
        // Top: theme badge + title
        h('div', {
          style: { display: 'flex', flexDirection: 'column', gap: '24px' },
        },
          h('div', {
            style: {
              display: 'flex',
              width: 'fit-content',
              padding: '6px 16px',
              border: `1px solid ${themeColor}90`,
              color: themeColor,
              fontSize: '13px',
              fontWeight: '700',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            },
          }, essay.theme),
          h('div', {
            style: {
              fontSize: titleSize,
              fontWeight: '900',
              color: '#f4efe6',
              lineHeight: '1.08',
              letterSpacing: '-0.02em',
              maxWidth: '960px',
            },
          }, essay.title),
        ),
        // Bottom: subhead + author/wordmark
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          },
        },
          h('div', {
            style: {
              fontSize: '21px',
              color: 'rgba(244,239,230,0.48)',
              fontStyle: 'italic',
              lineHeight: '1.5',
              maxWidth: '660px',
            },
          }, subhead),
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '6px',
            },
          },
            h('div', {
              style: {
                fontSize: '15px',
                color: '#b8943f',
                fontWeight: '600',
                letterSpacing: '0.08em',
              },
            }, 'John Thornton'),
            h('div', {
              style: {
                fontSize: '19px',
                color: 'rgba(244,239,230,0.16)',
                fontWeight: '900',
                letterSpacing: '0.3em',
              },
            }, 'UNSECURED'),
          ),
        ),
      ),
    ),
    { width: 1200, height: 630 },
  );
}
