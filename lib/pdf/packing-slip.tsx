import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

export interface PackingSlipItem {
  name: string;
  size?: string | null;
  quantity: number;
}

export interface PackingSlipOrderData {
  orderNumber: string;
  createdAt: string | Date;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  awbNumber?: string | null;
  trackingUrl?: string | null;
  items: PackingSlipItem[];
  shipping: number;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#121212',
    backgroundColor: '#FFFFFF',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#121212',
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: '#121212',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 8,
    color: '#666666',
    marginTop: 2,
  },
  orderBadge: {
    alignItems: 'flex-end',
  },
  orderNumber: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: '#121212',
  },
  orderDate: {
    fontSize: 8,
    color: '#666666',
    marginTop: 2,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  infoCol: {
    width: '48%',
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#666666',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: '#121212',
  },
  table: {
    width: '100%',
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EEEEEE',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  colCheck: { width: '8%', textAlign: 'center' },
  colItem: { width: '58%' },
  colVariant: { width: '20%' },
  colQty: { width: '14%', textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 10 },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#666666',
    alignSelf: 'center',
  },
  signOffSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  signBox: {
    width: '30%',
    borderTopWidth: 1,
    borderTopColor: '#888888',
    paddingTop: 6,
    textAlign: 'center',
  },
  signLabel: {
    fontSize: 7.5,
    color: '#666666',
    textTransform: 'uppercase',
  },
  footerText: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: 'center',
    fontSize: 7.5,
    color: '#888888',
  },
});

export const PackingSlipPDF: React.FC<{ order: PackingSlipOrderData }> = ({ order }) => {
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Document title={`PackingSlip-${order.orderNumber}`} author="Al Umar Perfumes">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PACKING SLIP</Text>
            <Text style={styles.subtitle}>AL UMAR PERFUMES WAREHOUSE & DISPATCH</Text>
          </View>
          <View style={styles.orderBadge}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.orderDate}>Date: {formattedDate}</Text>
          </View>
        </View>

        {/* Shipping info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Ship To:</Text>
            <Text style={{ ...styles.infoText, fontFamily: 'Helvetica-Bold' }}>
              {order.customerName}
            </Text>
            <Text style={styles.infoText}>{order.address}</Text>
            <Text style={styles.infoText}>
              {order.city}, {order.state} - {order.pincode}
            </Text>
            <Text style={styles.infoText}>Phone: {order.phone}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Logistics & Dispatch Ref:</Text>
            <Text style={styles.infoText}>
              AWB / Tracking: {order.awbNumber || 'PENDING ASSIGNMENT'}
            </Text>
            <Text style={styles.infoText}>
              Carrier Service: BlueDart / Delhivery Surface
            </Text>
            <Text style={styles.infoText}>
              Fragile Goods: Pure Attar & Fragrance Bottles
            </Text>
          </View>
        </View>

        {/* Item Packing Checklist */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colCheck}>Check</Text>
            <Text style={styles.colItem}>Product Description</Text>
            <Text style={styles.colVariant}>Size / Option</Text>
            <Text style={styles.colQty}>Qty</Text>
          </View>

          {order.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.colCheck}>
                <View style={styles.checkbox} />
              </View>
              <View style={styles.colItem}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{item.name}</Text>
              </View>
              <Text style={styles.colVariant}>{item.size || 'Standard'}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Sign off */}
        <View style={styles.signOffSection}>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Picked By</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Packed & Bubble-Wrapped By</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Quality Control Passed</Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Al Umar Fragrances Atelier • Please handle with care. Contents contain liquid flacons.
        </Text>
      </Page>
    </Document>
  );
};
