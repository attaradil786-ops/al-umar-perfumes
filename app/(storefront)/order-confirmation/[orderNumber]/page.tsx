import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import OrderConfirmationAnalytics from '@/components/OrderConfirmationAnalytics';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const orderNumber = params.orderNumber;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Delivery estimate calculation (3-5 business days from order creation)
  const orderDate = new Date(order.createdAt);
  const estStart = new Date(orderDate);
  estStart.setDate(estStart.getDate() + 3);
  const estEnd = new Date(orderDate);
  estEnd.setDate(estEnd.getDate() + 5);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });

  const deliveryEstimate = `${formatDate(estStart)} - ${formatDate(estEnd)}`;

  return (
    <main className="container-narrow section-padding">
      <OrderConfirmationAnalytics
        order={{
          orderNumber: order.orderNumber,
          total: order.total,
          subtotal: order.subtotal,
          shipping: order.shipping,
          items: order.items.map(item => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
          })),
        }}
      />
      <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '2.5rem', boxShadow: 'var(--shadow-md)' }}>
        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #E8DCC8' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 1rem', background: '#e6f4ea', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#1E6B5C' }}>
            ✓
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1E6B5C', background: 'rgba(30, 107, 92, 0.1)', padding: '0.3rem 0.8rem', borderRadius: '999px' }}>
            Payment Confirmed
          </span>
          <h1 className="section-title" style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontSize: '2rem' }}>
            Thank You for Your Order!
          </h1>
          <p style={{ color: '#553E23', fontSize: '0.95rem' }}>
            Assalamu Alaikum <strong>{order.customerName}</strong>, your artisanal fragrance order has been placed successfully.
          </p>
        </div>

        {/* Order Details Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', background: '#FFF8EC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E8DCC8', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#7A5B37', fontWeight: 600 }}>Order Number</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#553E23', fontFamily: 'monospace', marginTop: '0.2rem' }}>
              #{order.orderNumber}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#7A5B37', fontWeight: 600 }}>Estimated Delivery</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#1E6B5C', marginTop: '0.2rem' }}>
              {deliveryEstimate}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#7A5B37', fontWeight: 600 }}>Payment Status</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#137333', textTransform: 'uppercase', marginTop: '0.2rem' }}>
              ● {order.paymentStatus}
            </div>
          </div>
        </div>

        {/* Ordered Items */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.2rem', marginBottom: '1rem' }}>
            Purchased Items ({order.items.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid #E8DCC8', borderRadius: '12px', padding: '1rem', background: '#FAFAF8' }}>
            {order.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px dashed #E8DCC8' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#121212', fontSize: '0.95rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#7A5B37' }}>
                    {item.size ? `Size: ${item.size} • ` : ''}Quantity: {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', color: '#553E23', fontSize: '0.95rem' }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}

            {/* Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#553E23' }}>
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1E6B5C', fontWeight: 600 }}>
                  <span>Discount ({order.couponCode || 'Promotional'})</span>
                  <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#553E23' }}>
                <span>Domestic Express Shipping</span>
                <span>{order.shipping === 0 ? <strong style={{ color: '#1E6B5C' }}>FREE</strong> : `₹${order.shipping}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E8DCC8', paddingTop: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', color: '#1E6B5C' }}>
                <span>Total Amount Paid</span>
                <span>₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div style={{ marginBottom: '2.5rem', padding: '1.25rem', background: '#FDFBF7', border: '1px solid #E8DCC8', borderRadius: '12px' }}>
          <h4 style={{ color: '#553E23', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            Shipping Address
          </h4>
          <p style={{ fontSize: '0.9rem', color: '#4A3F33', lineHeight: 1.6, margin: 0 }}>
            <strong>{order.customerName}</strong><br />
            {order.address}<br />
            {order.city}, {order.state} - {order.pincode}<br />
            Phone: {order.phone} {order.email ? `• Email: ${order.email}` : ''}
          </p>
        </div>

        {/* Actions CTA: Track Order link & Continue shopping */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(order.phone)}`}
            className="btn-primary"
            style={{ padding: '0.8rem 1.8rem' }}
          >
            Track Order Status →
          </Link>
          <Link
            href="/collections"
            className="btn-green"
            style={{ padding: '0.8rem 1.8rem' }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
