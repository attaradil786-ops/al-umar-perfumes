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

interface OrderDeliveredEmailProps {
  customerName: string;
  orderNumber: string;
  city?: string;
}

export const OrderDeliveredEmail = ({
  customerName = 'Valued Patron',
  orderNumber = 'ORD-2026-0001',
  city = '',
}: OrderDeliveredEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Al Umar Perfumes order #{orderNumber} has been delivered</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={brandLogo}>AL UMAR</Text>
            <Text style={brandSubtitle}>HAUTE PARFUMERIE & ATTARS</Text>
          </Section>

          <Hr style={divider} />

          {/* Delivered Notice */}
          <Section style={bodySection}>
            <div style={deliveredBadge}>PACKAGE DELIVERED</div>
            <Heading style={heading}>Delivered with Compliments</Heading>
            <Text style={text}>Assalamu Alaikum {customerName},</Text>
            <Text style={text}>
              Your parcel for order <strong style={{ color: '#1E6B5C' }}>#{orderNumber}</strong> has been successfully delivered
              {city ? ` to ${city}` : ''}.
            </Text>
            <Text style={text}>
              We hope our artisanal concoctions transport your senses. May your experience with Al Umar fragrances be a source of timeless grace and elegance.
            </Text>
          </Section>

          {/* Review prompt card */}
          <Section style={reviewCard}>
            <Text style={reviewTitle}>Share Your Olfactory Journey</Text>
            <Text style={reviewText}>
              Your appreciation and feedback inspire our craftsmen. If you loved your attar or perfume, we would be deeply honored if you could leave a review on our storefront.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Any inquiries regarding your delivery? Contact us at{' '}
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

export default OrderDeliveredEmail;

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

const deliveredBadge: React.CSSProperties = {
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

const reviewCard: React.CSSProperties = {
  backgroundColor: '#FFF8EC',
  border: '1px solid #E8DCC8',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '20px',
  textAlign: 'center',
};

const reviewTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#553E23',
  margin: '0 0 8px 0',
};

const reviewText: React.CSSProperties = {
  fontSize: '13px',
  color: '#7A5B37',
  lineHeight: '1.6',
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
