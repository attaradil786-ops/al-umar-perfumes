import type { Metadata } from 'next';
import '@/css/styles.css';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import AnalyticsTracker from '@/components/AnalyticsTracker';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://alumarperfumes.com'),
  title: 'Al Umar | Pure Attars, Cambodian Oud & Islamic Literature',
  description:
    'Discover authentic hand-blended attars, pure Cambodian Dehn Al Oud, White Musk, prayer tasbihs, and classical Islamic books with express delivery across India.',
  icons: {
    icon: '/images/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-[#FFF8EC] text-[#121212]">
        <AnalyticsTracker />
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
