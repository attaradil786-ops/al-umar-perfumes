import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface OrderItem {
  name: string;
  quantity: number;
}

interface OrderShippedEmailProps {
  customerName: string;
  orderNumber: string;
  awbNumber?: string | null;
  trackingUrl?: string | null;
  items?: OrderItem[];
  city?: string;
  state?: string;
}

export const OrderShippedEmail = ({
  customerName = 'Valued Patron',
  orderNumber = 'ORD-2026-0001',
  awbNumber = 'BLUEDART-88291029',
  trackingUrl = 'https://track.shiprocket.in',
  items = [],
  city = '',
  state = '',
}: OrderShippedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your parcel for order #{orderNumber} has been dispatched</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={brandLogo}>AL UMAR</Text>
            <Text style={brandSubtitle}>HAUTE PARFUMERIE & ATTARS</Text>
          </Section>

          <Hr style={divider} />

          {/* Shipment Alert */}
          <Section style={bodySection}>
            <div style={shippedBadge}>PARCEL DISPATCHED</div>
            <Heading style={heading}>Your Order is on the Way</Heading>
            <Text style={text}>Assalamu Alaikum {customerName},</Text>
            <Text style={text}>
              Exciting news! Your bespoke fragrance order <strong style={{ color: '#1E6B5C' }}>#{orderNumber}</strong> has
              been carefully packed and handed over to our premier courier service.
            </Text>
          </Section>

          {/* Tracking Details Box */}
          <Section style={trackingBox}>
            <Text style={trackingTitle}>Shipment & Tracking Information</Text>
            <div style={trackingRow}>
              <span style={trackingLabel}>Courier AWB / Consignment #:</span>
              <span style={trackingValue}>{awbNumber || 'Assigned / In Transit'}</span>
            </div>
            {city && (
              <div style={trackingRow}>
                <span style={trackingLabel}>Destination:</span>
                <span style={trackingValue}>{city}{state ? `, ${state}` : ''}</span>
              </div>
            )}

            {trackingUrl ? (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button href={trackingUrl} style={trackButton}>
                  Track Your Package →
                </Button>
              </div>
            ) : null}
          </Section>

          {/* Packed Items List */}
          {items && items.length > 0 && (
            <Section style={cardSection}>
              <Text style={sectionTitle}>Dispatched Flacons</Text>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#553E23', fontSize: '13px' }}>
                {items.map((it, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>
                    <strong>{it.name}</strong> × {it.quantity}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Fragrance care note */}
          <Section style={careBox}>
            <Text style={careTitle}>A Note from Our Master Perfumer</Text>
            <Text style={careText}>
              Attars and artisanal perfumes may get agitated during transit. We recommend allowing your flacons to rest at room temperature for a few hours before testing to experience their true top, heart, and base notes.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Questions regarding delivery? Email us at{' '}
              <a href="mailto:orders@umarperfumes.com" style={{ color: '#1E6B5C', textDecoration: 'underline' }}>
                orders@umarperfumes.com
              </a>
            </Text>
            <Text style={copyrightText}>
              © {new Date().getFullYear()} Al Umar Perfumes. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderShippedEmail;

const main: React.CSSProperties = {
  backgroundColor: '#FFF8EC',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '24px 0',
  color: '#121212',
};

const container: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E8DCC8',
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '32px 28px',
  boxShadow: '0 2px 8px rgba(85, 62, 35, 0.05)',
};

const headerSection: React.CSSProperties = {
  textAlign: 'center',
  paddingBottom: '16px',
};

const brandLogo: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '800',
  letterSpacing: '3px',
  color: '#553E23',
  margin: '0 0 4px 0',
};

const brandSubtitle: React.CSSProperties = {
  fontSize: '10px',
  letterSpacing: '2px',
  color: '#D4AF37',
  fontWeight: '700',
  margin: '0',
};

const divider: React.CSSProperties = {
  borderColor: '#E8DCC8',
  margin: '16px 0 24px 0',
};

const bodySection: React.CSSProperties = {
  marginBottom: '20px',
};

const shippedBadge: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: '800',
  letterSpacing: '1.5px',
  backgroundColor: '#E8F5E9',
  color: '#1E6B5C',
  padding: '4px 10px',
  borderRadius: '20px',
  marginBottom: '10px',
  border: '1px solid #C8E6C9',
};

const heading: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#1E6B5C',
  margin: '0 0 12px 0',
};

const text: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#553E23',
  margin: '0 0 10px 0',
};

const trackingBox: React.CSSProperties = {
  backgroundColor: '#F4EFE6',
  border: '1px solid #E8DCC8',
  borderRadius: '8px',
  padding: '18px',
  marginBottom: '20px',
};

const trackingTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: '#553E23',
  margin: '0 0 12px 0',
};

const trackingRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  padding: '4px 0',
};

const trackingLabel: React.CSSProperties = {
  color: '#7A5B37',
};

const trackingValue: React.CSSProperties = {
  color: '#121212',
  fontWeight: '700',
  fontFamily: 'monospace',
};

const trackButton: React.CSSProperties = {
  backgroundColor: '#1E6B5C',
  color: '#FFFFFF',
  borderRadius: '8px',
  padding: '10px 22px',
  fontSize: '13px',
  fontWeight: '700',
  textDecoration: 'none',
  display: 'inline-block',
};

const cardSection: React.CSSProperties = {
  backgroundColor: '#FFF8EC',
  border: '1px solid #E8DCC8',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '20px',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: '#553E23',
  margin: '0 0 10px 0',
};

const careBox: React.CSSProperties = {
  backgroundColor: '#FFFDF9',
  borderLeft: '3px solid #D4AF37',
  padding: '12px 16px',
  borderRadius: '4px',
  marginBottom: '20px',
};

const careTitle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#553E23',
  margin: '0 0 4px 0',
};

const careText: React.CSSProperties = {
  fontSize: '12px',
  color: '#7A5B37',
  lineHeight: '1.5',
  margin: '0',
};

const footerSection: React.CSSProperties = {
  textAlign: 'center',
  paddingTop: '16px',
};

const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#7A5B37',
  margin: '0 0 6px 0',
};

const copyrightText: React.CSSProperties = {
  fontSize: '11px',
  color: '#A08264',
  margin: '0',
};
