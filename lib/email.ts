import { Resend } from 'resend';
import React from 'react';
import { OrderConfirmationEmail } from '@/lib/emails/order-confirmation';
import { OrderShippedEmail } from '@/lib/emails/order-shipped';
import { OrderDeliveredEmail } from '@/lib/emails/order-delivered';
import { OrderCancelledEmail } from '@/lib/emails/order-cancelled';
import { RefundProcessedEmail } from '@/lib/emails/refund-processed';

const SENDER_EMAIL = 'Al Umar Perfumes <orders@umarperfumes.com>';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    return null;
  }
  return new Resend(apiKey);
}

export interface EmailOrderData {
  orderNumber: string;
  customerName: string;
  email?: string | null;
  total: number;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  awbNumber?: string | null;
  trackingUrl?: string | null;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string | null;
  }>;
}

export async function sendOrderConfirmation(order: EmailOrderData) {
  if (!order.email) return { success: false, reason: 'No email provided' };

  const resend = getResendClient();
  const reactElement = React.createElement(OrderConfirmationEmail, {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    items: order.items || [],
    subtotal: order.subtotal || order.total,
    discount: order.discount || 0,
    shipping: order.shipping || 0,
    total: order.total,
    address: order.address || '',
    city: order.city || '',
    state: order.state || '',
    pincode: order.pincode || '',
  });

  if (!resend) {
    console.log(`[Resend Email Mock] Order confirmation for #${order.orderNumber} to ${order.email}`);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: order.email,
      subject: `Order Confirmed: #${order.orderNumber} - Al Umar Perfumes`,
      react: reactElement,
    });
    if (error) {
      console.error('[Resend Email Error - Confirmation]:', error);
      return { success: false, error };
    }
    console.log(`[Resend Email Sent] Order confirmation email sent to ${order.email}:`, data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Resend Email Exception - Confirmation]:', err);
    return { success: false, error: err };
  }
}

export async function sendOrderShipped(order: EmailOrderData) {
  if (!order.email) return { success: false, reason: 'No email provided' };

  const resend = getResendClient();
  const reactElement = React.createElement(OrderShippedEmail, {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    awbNumber: order.awbNumber,
    trackingUrl: order.trackingUrl,
    items: (order.items || []).map(i => ({ name: i.name, quantity: i.quantity })),
    city: order.city,
    state: order.state,
  });

  if (!resend) {
    console.log(`[Resend Email Mock] Order shipped for #${order.orderNumber} (AWB: ${order.awbNumber}) to ${order.email}`);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: order.email,
      subject: `Your Parcel Has Shipped: #${order.orderNumber} - Al Umar Perfumes`,
      react: reactElement,
    });
    if (error) {
      console.error('[Resend Email Error - Shipped]:', error);
      return { success: false, error };
    }
    console.log(`[Resend Email Sent] Order shipped email sent to ${order.email}:`, data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Resend Email Exception - Shipped]:', err);
    return { success: false, error: err };
  }
}

export async function sendOrderDelivered(order: EmailOrderData) {
  if (!order.email) return { success: false, reason: 'No email provided' };

  const resend = getResendClient();
  const reactElement = React.createElement(OrderDeliveredEmail, {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    city: order.city,
  });

  if (!resend) {
    console.log(`[Resend Email Mock] Order delivered for #${order.orderNumber} to ${order.email}`);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: order.email,
      subject: `Delivered: #${order.orderNumber} - Al Umar Perfumes`,
      react: reactElement,
    });
    if (error) {
      console.error('[Resend Email Error - Delivered]:', error);
      return { success: false, error };
    }
    console.log(`[Resend Email Sent] Order delivered email sent to ${order.email}:`, data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Resend Email Exception - Delivered]:', err);
    return { success: false, error: err };
  }
}

export async function sendOrderCancelled(order: EmailOrderData, reason?: string) {
  if (!order.email) return { success: false, reason: 'No email provided' };

  const resend = getResendClient();
  const reactElement = React.createElement(OrderCancelledEmail, {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    reason: reason || 'Customer request / Inventory adjustment',
    total: order.total,
  });

  if (!resend) {
    console.log(`[Resend Email Mock] Order cancelled for #${order.orderNumber} to ${order.email}`);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: order.email,
      subject: `Order Cancelled: #${order.orderNumber} - Al Umar Perfumes`,
      react: reactElement,
    });
    if (error) {
      console.error('[Resend Email Error - Cancelled]:', error);
      return { success: false, error };
    }
    console.log(`[Resend Email Sent] Order cancelled email sent to ${order.email}:`, data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Resend Email Exception - Cancelled]:', err);
    return { success: false, error: err };
  }
}

export async function sendRefundProcessed(order: EmailOrderData, refundAmount: number, refundId?: string | null) {
  if (!order.email) return { success: false, reason: 'No email provided' };

  const resend = getResendClient();
  const reactElement = React.createElement(RefundProcessedEmail, {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    refundAmount,
    refundId,
  });

  if (!resend) {
    console.log(`[Resend Email Mock] Refund processed for #${order.orderNumber} (₹${refundAmount}) to ${order.email}`);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: order.email,
      subject: `Refund Processed for Order #${order.orderNumber} - Al Umar Perfumes`,
      react: reactElement,
    });
    if (error) {
      console.error('[Resend Email Error - Refund]:', error);
      return { success: false, error };
    }
    console.log(`[Resend Email Sent] Refund email sent to ${order.email}:`, data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Resend Email Exception - Refund]:', err);
    return { success: false, error: err };
  }
}
