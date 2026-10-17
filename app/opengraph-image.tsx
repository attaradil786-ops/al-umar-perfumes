import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Al Umar Perfumes | Pure Attars & Rare Cambodian Oud';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#362615',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #553E23 0%, #201509 100%)',
          color: '#FFF8EC',
          fontFamily: 'sans-serif',
          position: 'relative',
          padding: '60px',
        }}
      >
        {/* Decorative Gold Border */}
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            border: '2px solid rgba(212, 175, 55, 0.4)',
            borderRadius: '24px',
          }}
        />

        {/* Brand Emblem */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: '#1E6B5C',
            border: '2px solid #D4AF37',
            color: '#FFF8EC',
            fontSize: '38px',
            fontWeight: 'bold',
            marginBottom: '20px',
          }}
        >
          ع
        </div>

        {/* Brand Title */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 800,
            letterSpacing: '6px',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          AL UMAR PERFUMES
        </div>

        {/* Subtitle / Atelier */}
        <div
          style={{
            fontSize: '20px',
            color: '#D4AF37',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            marginBottom: '28px',
            fontWeight: 600,
          }}
        >
          Atelier de Parfums • Mumbai
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255, 248, 236, 0.85)',
            maxWidth: '800px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Pure Cambodian Dehn Al Oud, Rare Floral Attars &amp; Spiritual Essentials
        </div>

        {/* Bottom Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '15px',
            color: '#D4AF37',
            letterSpacing: '2px',
          }}
        >
          <span>ALUMARPERFUMES.COM</span>
          <span>•</span>
          <span>EXPRESS DELIVERY PAN INDIA</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
