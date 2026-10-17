import { withSentryConfig } from '@sentry/nextjs/config';

/** @type {import('next').NextConfig} */
const adminBasePath = (process.env.ADMIN_BASE_PATH || '/studio-alumar-9f7x2k').replace(/^\//, '');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: `/${adminBasePath}/:path*`,
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: 'al-umar-perfumes',
  project: 'al-umar-next',
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
