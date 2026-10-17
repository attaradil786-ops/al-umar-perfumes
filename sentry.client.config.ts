import * as Sentry from '@sentry/nextjs';

const publicPrefixes = [
  '/', '/product/', '/collections', '/best-sellers', '/new-arrivals',
  '/bulk-order', '/checkout', '/order-success', '/order-confirmation',
  '/about', '/contact', '/shipping-policy', '/return-policy', '/terms', '/track-order'
];

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://samplePublicKey@o0.ingest.sentry.io/0',
  tracesSampleRate: 0.2,

  // Session Replay (free tier)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      // STRICT REQUIREMENT: Exclude all admin routes from session replay without leaking secret path in bundle
      beforeAddRecordingEvent: (event) => {
        if (typeof window !== 'undefined') {
          if ((window as any).__IS_ADMIN_PORTAL__ || document.documentElement.dataset.admin === 'true') {
            return null;
          }
          const pathname = window.location.pathname;
          if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
            return null;
          }
          const isPublic = pathname === '/' || publicPrefixes.some(p => p !== '/' && pathname.startsWith(p));
          if (!isPublic) {
            // Drop recording completely on secret admin routes
            return null;
          }
        }
        return event;
      },
    }),
  ],

  // Exclude admin route context from session replays
  beforeSend(event) {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const isPublic = pathname === '/' || publicPrefixes.some(p => p !== '/' && pathname.startsWith(p));
      if (!isPublic || pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        if (event.contexts?.replay) {
          delete event.contexts.replay;
        }
      }
    }
    return event;
  },
});
