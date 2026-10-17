import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface OrderCancelledEmailProps {
  customerName: string;
  orderNumber: string;
  reason?: string;
  total?: number;
}

export const OrderCancelledEmail = ({
  customerName = 'Valued Patron',
  orderNumber = 'ORD-2026-0001',
  reason = 'Customer request / Inventory adjustment',
  total = 0,
}: OrderCancelledEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Al Umar Perfumes order #{orderNumber} has been cancelled</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={brandLogo}>AL UMAR</Text>
            <Text style={brandSubtitle}>HAUTE PARFUMERIE & ATTARS</Text>
          </Section>

          <Hr style={divider} />

          {/* Cancellation Notice */}
          <Section style={bodySection}>
            <div style={cancelledBadge}>ORDER CANCELLED</div>
            <Heading style={heading}>Order Cancellation Notice</Heading>
            <Text style={text}>Assalamu Alaikum {customerName},</Text>
            <Text style={text}>
              We are writing to confirm that your order <strong style={{ color: '#BA3D3D' }}>#{orderNumber}</strong> has been
              cancelled.
            </Text>
          </Section>

          {/* Details Card */}
          <Section style={cardSection}>
            <Text style={sectionTitle}>Cancellation Details</Text>
            <div style={row}>
              <span style={label}>Order Number:</span>
              <span style={value}>#{orderNumber}</span>
            </div>
            {total > 0 && (
              <div style={row}>
                <span style={label}>Order Value:</span>
                <span style={value}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={row}>
              <span style={label}>Reason:</span>
              <span style={value}>{reason}</span>
            </div>
          </Section>

          <Section style={infoBox}>
            <Text style={infoText}>
              If payment was captured for this order, your refund has either been initiated or will reflect in your original payment account within 3-5 business days via Razorpay.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              If you did not request this cancellation or have any questions, please reach out to us at{' '}
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

export default OrderCancelledEmail;

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

const cancelledBadge: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: '800',
  letterSpacing: '1.5px',
  backgroundColor: '#FFEBEE',
  color: '#BA3D3D',
  padding: '4px 10px',
  borderRadius: '20px',
  marginBottom: '10px',
  border: '1px solid #FFCDD2',
};

const heading: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#BA3D3D',
  margin: '0 0 12px 0',
};

const text: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#553E23',
  margin: '0 0 10px 0',
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
  margin: '0 0 12px 0',
};

const row: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  padding: '4px 0',
};

const label: React.CSSProperties = {
  color: '#7A5B37',
};

const value: React.CSSProperties = {
  color: '#121212',
  fontWeight: '600',
};

const infoBox: React.CSSProperties = {
  backgroundColor: '#F7F7F7',
  borderLeft: '3px solid #7A5B37',
  padding: '12px 16px',
  borderRadius: '4px',
  marginBottom: '20px',
};

const infoText: React.CSSProperties = {
  fontSize: '12px',
  color: '#553E23',
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
