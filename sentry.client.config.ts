import * as Sentry from '@sentry/nextjs';

const adminBase = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/studio-alumar-9f7x2k';
const cleanAdmin = adminBase.replace(/^\//, '').replace(/\/$/, '');

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
      // STRICT REQUIREMENT: Exclude all {ADMIN_BASE_PATH}* routes from session replay
      beforeAddRecordingEvent: (event) => {
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          if (
            pathname.startsWith(`/${cleanAdmin}`) ||
            pathname.startsWith('/admin') ||
            pathname.startsWith('/api/admin')
          ) {
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
      if (
        pathname.startsWith(`/${cleanAdmin}`) ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api/admin')
      ) {
        if (event.contexts?.replay) {
          delete event.contexts.replay;
        }
      }
    }
    return event;
  },
});
