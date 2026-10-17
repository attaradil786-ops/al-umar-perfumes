'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import { isAdminPath, trackPageView } from '@/lib/analytics';

export default function AnalyticsTracker() {
  const pathname = usePathname();

  // Route-based exclusion: do NOT load or run GA4 / Meta Pixel on any admin path
  const isExcluded = isAdminPath(pathname);

  // Trigger page views on client-side navigation
  useEffect(() => {
    if (!isExcluded && pathname) {
      trackPageView(pathname);
    }
  }, [pathname, isExcluded]);

  if (isExcluded) {
    return null;
  }

  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-ALUMAR2026';
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '123456789012345';

  return (
    <>
      {/* Google Analytics 4 via @next/third-parties */}
      {gaId && <GoogleAnalytics gaId={gaId} />}

      {/* Meta Pixel via next/script */}
      {pixelId && (
        <>
          <Script
            id="meta-pixel-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
    </>
  );
}
