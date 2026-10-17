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

interface RefundProcessedEmailProps {
  customerName: string;
  orderNumber: string;
  refundAmount: number;
  refundId?: string | null;
}

export const RefundProcessedEmail = ({
  customerName = 'Valued Patron',
  orderNumber = 'ORD-2026-0001',
  refundAmount = 0,
  refundId = 'rfnd_12345678',
}: RefundProcessedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Refund confirmed for your Al Umar order #{orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={brandLogo}>AL UMAR</Text>
            <Text style={brandSubtitle}>HAUTE PARFUMERIE & ATTARS</Text>
          </Section>

          <Hr style={divider} />

          {/* Refund Notice */}
          <Section style={bodySection}>
            <div style={refundBadge}>REFUND PROCESSED</div>
            <Heading style={heading}>Refund Credited</Heading>
            <Text style={text}>Assalamu Alaikum {customerName},</Text>
            <Text style={text}>
              A refund has been successfully initiated for your order{' '}
              <strong style={{ color: '#1E6B5C' }}>#{orderNumber}</strong> via our payment processor, Razorpay.
            </Text>
          </Section>

          {/* Refund Details */}
          <Section style={cardSection}>
            <Text style={sectionTitle}>Transaction Summary</Text>
            <div style={row}>
              <span style={label}>Order Number:</span>
              <span style={value}>#{orderNumber}</span>
            </div>
            <div style={row}>
              <span style={label}>Refund Amount:</span>
              <span style={{ ...value, color: '#1E6B5C', fontWeight: '700', fontSize: '15px' }}>
                ₹{refundAmount.toLocaleString('en-IN')}
              </span>
            </div>
            {refundId && (
              <div style={row}>
                <span style={label}>Refund Reference ID:</span>
                <span style={{ ...value, fontFamily: 'monospace' }}>{refundId}</span>
              </div>
            )}
          </Section>

          <Section style={infoBox}>
            <Text style={infoText}>
              The funds should reflect back into your original payment method (Bank Account, UPI, or Credit/Debit Card) within <strong>3 to 5 business days</strong> depending on your issuing bank.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              For any payment inquiries, contact our finance desk at{' '}
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

export default RefundProcessedEmail;

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

const refundBadge: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: '800',
  letterSpacing: '1.5px',
  backgroundColor: '#E0F2FE',
  color: '#0369A1',
  padding: '4px 10px',
  borderRadius: '20px',
  marginBottom: '10px',
  border: '1px solid #BAE6FD',
};

const heading: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#0369A1',
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
  backgroundColor: '#F0F9FF',
  borderLeft: '3px solid #0284C7',
  padding: '12px 16px',
  borderRadius: '4px',
  marginBottom: '20px',
};

const infoText: React.CSSProperties = {
  fontSize: '12px',
  color: '#0369A1',
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
