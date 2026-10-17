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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string | null;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export const OrderConfirmationEmail = ({
  customerName = 'Valued Patron',
  orderNumber = 'ORD-2026-0001',
  items = [],
  subtotal = 0,
  discount = 0,
  shipping = 0,
  total = 0,
  address = '',
  city = '',
  state = '',
  pincode = '',
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Al Umar Perfumes order #{orderNumber} is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={brandLogo}>AL UMAR</Text>
            <Text style={brandSubtitle}>HAUTE PARFUMERIE & ATTARS</Text>
          </Section>

          <Hr style={divider} />

          {/* Greeting */}
          <Section style={bodySection}>
            <Heading style={heading}>Order Confirmed</Heading>
            <Text style={text}>Assalamu Alaikum {customerName},</Text>
            <Text style={text}>
              Thank you for ordering with Al Umar Perfumes. We have received your order{' '}
              <strong style={{ color: '#1E6B5C' }}>#{orderNumber}</strong>. Our perfumers and artisans
              are curating your artisanal flacons and preparing them for safe dispatch.
            </Text>
          </Section>

          {/* Items Table */}
          <Section style={cardSection}>
            <Text style={sectionTitle}>Order Summary</Text>
            <table style={table}>
              <thead>
                <tr style={tableHeaderRow}>
                  <th style={thLeft}>Item</th>
                  <th style={thCenter}>Qty</th>
                  <th style={thRight}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={tableRow}>
                    <td style={tdLeft}>
                      <span style={{ fontWeight: '600', color: '#121212' }}>{item.name}</span>
                      {item.size ? (
                        <span style={{ display: 'block', fontSize: '11px', color: '#7A5B37' }}>
                          Size: {item.size}
                        </span>
                      ) : null}
                    </td>
                    <td style={tdCenter}>{item.quantity}</td>
                    <td style={tdRight}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Hr style={subDivider} />

            <div style={totalsBox}>
              <div style={totalRow}>
                <span style={totalLabel}>Subtotal:</span>
                <span style={totalValue}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div style={totalRow}>
                  <span style={{ ...totalLabel, color: '#1E6B5C' }}>Discount:</span>
                  <span style={{ ...totalValue, color: '#1E6B5C' }}>
                    -₹{discount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div style={totalRow}>
                <span style={totalLabel}>Shipping:</span>
                <span style={totalValue}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div style={{ ...totalRow, borderTop: '1px solid #E8DCC8', paddingTop: '8px', marginTop: '6px' }}>
                <span style={{ ...totalLabel, fontWeight: '700', fontSize: '15px', color: '#553E23' }}>
                  Grand Total:
                </span>
                <span style={{ ...totalValue, fontWeight: '700', fontSize: '15px', color: '#1E6B5C' }}>
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </Section>

          {/* Shipping Address */}
          <Section style={cardSection}>
            <Text style={sectionTitle}>Delivery Destination</Text>
            <Text style={addressText}>
              {customerName}
              <br />
              {address}
              <br />
              {city}, {state} - {pincode}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Need assistance? Email us at{' '}
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

export default OrderConfirmationEmail;

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

const subDivider: React.CSSProperties = {
  borderColor: '#E8DCC8',
  margin: '12px 0',
};

const bodySection: React.CSSProperties = {
  marginBottom: '20px',
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

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
};

const tableHeaderRow: React.CSSProperties = {
  borderBottom: '1px solid #E8DCC8',
};

const thLeft: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 4px',
  fontSize: '11px',
  color: '#7A5B37',
  textTransform: 'uppercase',
};

const thCenter: React.CSSProperties = {
  textAlign: 'center',
  padding: '6px 4px',
  fontSize: '11px',
  color: '#7A5B37',
  textTransform: 'uppercase',
};

const thRight: React.CSSProperties = {
  textAlign: 'right',
  padding: '6px 4px',
  fontSize: '11px',
  color: '#7A5B37',
  textTransform: 'uppercase',
};

const tableRow: React.CSSProperties = {
  borderBottom: '1px solid #F0E6D8',
};

const tdLeft: React.CSSProperties = {
  padding: '8px 4px',
  textAlign: 'left',
};

const tdCenter: React.CSSProperties = {
  padding: '8px 4px',
  textAlign: 'center',
  color: '#7A5B37',
};

const tdRight: React.CSSProperties = {
  padding: '8px 4px',
  textAlign: 'right',
  fontWeight: '600',
  color: '#553E23',
};

const totalsBox: React.CSSProperties = {
  marginTop: '8px',
};

const totalRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  padding: '3px 0',
};

const totalLabel: React.CSSProperties = {
  color: '#7A5B37',
};

const totalValue: React.CSSProperties = {
  color: '#121212',
  fontWeight: '600',
};

const addressText: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.6',
  color: '#553E23',
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
