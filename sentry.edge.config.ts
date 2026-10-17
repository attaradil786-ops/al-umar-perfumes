import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://samplePublicKey@o0.ingest.sentry.io/0',
  tracesSampleRate: 0.2,
});
