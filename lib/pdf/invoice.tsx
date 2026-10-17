import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { numberToIndianWords } from './number-to-words';

export interface InvoiceItem {
  id?: string;
  name: string;
  size?: string | null;
  quantity: number;
  price: number;
  taxRate?: number; // default 18
  hsnCode?: string; // default "3303"
}

export interface InvoiceOrderData {
  orderNumber: string;
  createdAt: string | Date;
  customerName: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentStatus: string;
  paymentId?: string | null;
  sellerGstin?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: '#121212',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#553E23',
    paddingBottom: 14,
    marginBottom: 14,
  },
  brandTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: '#553E23',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 7.5,
    color: '#7A5B37',
    marginTop: 2,
    letterSpacing: 1,
  },
  companyDetails: {
    fontSize: 7.5,
    color: '#553E23',
    marginTop: 5,
    lineHeight: 1.35,
  },
  invoiceTitleBlock: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 15,
    color: '#1E6B5C',
    letterSpacing: 1,
  },
  invoiceNumber: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#553E23',
    marginTop: 3,
  },
  invoiceMetaText: {
    fontSize: 7.5,
    color: '#7A5B37',
    marginTop: 2,
  },
  twoColumnSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#E8DCC8',
    borderRadius: 4,
    padding: 8,
  },
  addressBox: {
    width: '48%',
  },
  sectionHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#553E23',
    textTransform: 'uppercase',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  addressLine: {
    fontSize: 7.5,
    lineHeight: 1.35,
    color: '#333333',
  },
  table: {
    width: '100%',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#553E23',
    color: '#FFFFFF',
    paddingVertical: 4.5,
    paddingHorizontal: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8DCC8',
    paddingVertical: 4.5,
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#FFFDF9',
  },

  // Column widths
  colDesc: { width: '32%' },
  colHsn: { width: '10%', textAlign: 'center' },
  colQty: { width: '7%', textAlign: 'center' },
  colRate: { width: '12%', textAlign: 'right' },
  colTaxable: { width: '13%', textAlign: 'right' },
  colGstTax: { width: '12%', textAlign: 'right' },
  colTotal: { width: '14%', textAlign: 'right' },

  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  taxBreakdownBox: {
    width: '52%',
    borderWidth: 1,
    borderColor: '#E8DCC8',
    borderRadius: 4,
    padding: 7,
    backgroundColor: '#FFFDF9',
  },
  taxTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#553E23',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    marginBottom: 2,
    color: '#553E23',
  },
  totalsBox: {
    width: '44%',
    alignSelf: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
    fontSize: 8,
  },
  totalRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTopWidth: 1.5,
    borderTopColor: '#553E23',
    marginTop: 3,
  },
  grandTotalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#553E23',
  },
  grandTotalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#1E6B5C',
  },
  wordsBox: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#F8F5F0',
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: '#1E6B5C',
  },
  wordsLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#553E23',
    textTransform: 'uppercase',
  },
  wordsText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1E6B5C',
    marginTop: 1,
  },
  footerNotice: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: '#E8DCC8',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 6.5,
    color: '#7A5B37',
  },
});

export const InvoicePDF: React.FC<{ order: InvoiceOrderData }> = ({ order }) => {
  const sellerGstin = order.sellerGstin || '27ABCDE1234F1Z5';

  // State of dispatch atelier is Maharashtra (code 27)
  const isIntraState =
    order.state.toLowerCase().includes('maha') ||
    order.state.toLowerCase() === 'mh' ||
    order.state.toLowerCase() === '27';

  let totalTaxableValue = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const calculatedItems = order.items.map((item) => {
    const rate = item.taxRate ?? 18;
    const hsn = item.hsnCode || '3303';
    const itemTotal = item.price * item.quantity;

    // Inclusive GST reverse calculation: Taxable = Price / (1 + Rate / 100)
    const taxableValue = itemTotal / (1 + rate / 100);
    const gstAmount = itemTotal - taxableValue;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isIntraState) {
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
      totalCGST += cgst;
      totalSGST += sgst;
    } else {
      igst = gstAmount;
      totalIGST += igst;
    }

    totalTaxableValue += taxableValue;

    return {
      ...item,
      hsnCode: hsn,
      taxRate: rate,
      itemTotal,
      taxableValue,
      cgst,
      sgst,
      igst,
      gstAmount,
    };
  });

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const amountInWords = numberToIndianWords(order.total);

  return (
    <Document title={`Invoice-${order.orderNumber}`} author="Al Umar Perfumes">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandTitle}>AL UMAR PERFUMES</Text>
            <Text style={styles.brandSubtitle}>ATELIER DE PARFUMS • PURE DEHN AL OUD & ATTARS</Text>
            <Text style={styles.companyDetails}>
              Al Umar Fragrances Pvt. Ltd. • Mumbai, Maharashtra 400001{'\n'}
              Seller GSTIN: {sellerGstin} • State Code: 27 (Maharashtra){'\n'}
              Email: orders@umarperfumes.com • www.alumarperfumes.com
            </Text>
          </View>
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{order.orderNumber}</Text>
            <Text style={styles.invoiceMetaText}>Invoice Date: {formattedDate}</Text>
            <Text style={styles.invoiceMetaText}>
              Payment Status: {order.paymentStatus.toUpperCase()}
            </Text>
            {order.paymentId && (
              <Text style={styles.invoiceMetaText}>Txn Ref: {order.paymentId}</Text>
            )}
            <Text style={styles.invoiceMetaText}>
              Supply Type: {isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
            </Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.twoColumnSection}>
          <View style={styles.addressBox}>
            <Text style={styles.sectionHeading}>Buyer / Consignee Details:</Text>
            <Text style={{ ...styles.addressLine, fontFamily: 'Helvetica-Bold' }}>
              {order.customerName}
            </Text>
            <Text style={styles.addressLine}>{order.address}</Text>
            <Text style={styles.addressLine}>
              {order.city}, {order.state} - {order.pincode}
            </Text>
            <Text style={styles.addressLine}>Phone: {order.phone}</Text>
            {order.email && <Text style={styles.addressLine}>Email: {order.email}</Text>}
            <Text style={{ ...styles.addressLine, color: '#1E6B5C', marginTop: 2 }}>
              Place of Supply: {order.state}
            </Text>
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.sectionHeading}>Dispatch Atelier & Fulfillment:</Text>
            <Text style={styles.addressLine}>Al Umar Flagship Fulfillment Atelier</Text>
            <Text style={styles.addressLine}>Central Fragrance Vault, Unit 4B</Text>
            <Text style={styles.addressLine}>Fort, Mumbai - 400001, Maharashtra</Text>
            <Text style={styles.addressLine}>GSTIN: {sellerGstin}</Text>
            <Text style={styles.addressLine}>Origin State: Maharashtra (Code: 27)</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Item & Option</Text>
            <Text style={styles.colHsn}>HSN Code</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate (₹)</Text>
            <Text style={styles.colTaxable}>Taxable Val</Text>
            <Text style={styles.colGstTax}>
              {isIntraState ? 'GST (9+9%)' : 'IGST (18%)'}
            </Text>
            <Text style={styles.colTotal}>Total (₹)</Text>
          </View>

          {calculatedItems.map((item, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <View style={styles.colDesc}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7.5 }}>{item.name}</Text>
                {item.size && (
                  <Text style={{ fontSize: 6.5, color: '#7A5B37' }}>Size: {item.size}</Text>
                )}
              </View>
              <Text style={styles.colHsn}>{item.hsnCode}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>₹{item.price.toFixed(2)}</Text>
              <Text style={styles.colTaxable}>₹{item.taxableValue.toFixed(2)}</Text>
              <Text style={styles.colGstTax}>
                ₹{item.gstAmount.toFixed(2)} ({item.taxRate}%)
              </Text>
              <Text style={{ ...styles.colTotal, fontFamily: 'Helvetica-Bold' }}>
                ₹{item.itemTotal.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals & GST Summary */}
        <View style={styles.totalsContainer}>
          {/* Tax Breakdown */}
          <View style={styles.taxBreakdownBox}>
            <Text style={styles.taxTitle}>
              GST Breakdown {isIntraState ? '(Intra-State: CGST + SGST)' : '(Inter-State: Integrated GST)'}
            </Text>
            <View style={styles.taxRow}>
              <Text>Total Taxable Value:</Text>
              <Text>₹{totalTaxableValue.toFixed(2)}</Text>
            </View>

            {isIntraState ? (
              <>
                <View style={styles.taxRow}>
                  <Text>Central GST (CGST @ 9%):</Text>
                  <Text>₹{totalCGST.toFixed(2)}</Text>
                </View>
                <View style={styles.taxRow}>
                  <Text>State GST (SGST @ 9%):</Text>
                  <Text>₹{totalSGST.toFixed(2)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.taxRow}>
                <Text>Integrated GST (IGST @ 18%):</Text>
                <Text>₹{totalIGST.toFixed(2)}</Text>
              </View>
            )}

            <View style={{ ...styles.taxRow, borderTopWidth: 0.5, borderTopColor: '#E8DCC8', paddingTop: 2 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Total Tax Included:</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                ₹{(totalCGST + totalSGST + totalIGST).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Subtotal & Final Amounts */}
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={{ color: '#7A5B37' }}>Items Subtotal:</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>₹{order.subtotal.toLocaleString('en-IN')}</Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={{ color: '#1E6B5C' }}>Coupon Discount:</Text>
                <Text style={{ color: '#1E6B5C', fontFamily: 'Helvetica-Bold' }}>
                  -₹{order.discount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={{ color: '#7A5B37' }}>Shipping Charges:</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                {order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}
              </Text>
            </View>
            <View style={styles.totalRowBold}>
              <Text style={styles.grandTotalLabel}>Invoice Total (INR):</Text>
              <Text style={styles.grandTotalValue}>₹{order.total.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Total in Words */}
        <View style={styles.wordsBox}>
          <Text style={styles.wordsLabel}>Amount in Words:</Text>
          <Text style={styles.wordsText}>{amountInWords}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footerNotice}>
          <Text>HSN Code: 3303 (Essential oils, attars, perfumes). Computer generated tax invoice.</Text>
          <Text>Thank you for choosing Al Umar Perfumes.</Text>
        </View>
      </Page>
    </Document>
  );
};
