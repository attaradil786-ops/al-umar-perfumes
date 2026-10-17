import {
  sendOrderConfirmation,
  sendOrderShipped,
  sendOrderDelivered,
  sendOrderCancelled,
  sendRefundProcessed,
  EmailOrderData,
} from './email';
import { sendTemplate } from './whatsapp';

export interface NotificationOrderContext extends EmailOrderData {
  phone: string;
}

/**
 * Triggers customer notifications across Email (Resend) and WhatsApp Cloud API
 * based on the new order status transition.
 */
export async function triggerOrderStatusNotifications(
  order: NotificationOrderContext,
  newStatus: string
) {
  const normalizedStatus = newStatus.toLowerCase().trim();
  console.log(`[Notification Dispatcher] Processing status update "${normalizedStatus}" for Order #${order.orderNumber}`);

  const results: { email?: any; whatsapp?: any } = {};

  try {
    switch (normalizedStatus) {
      case 'confirmed':
      case 'placed': {
        // Trigger Email & WhatsApp
        const [emailRes, waRes] = await Promise.allSettled([
          sendOrderConfirmation(order),
          sendTemplate({
            to: order.phone,
            templateName: 'order_confirmed',
            parameters: {
              customer_name: order.customerName,
              order_number: order.orderNumber,
              total: order.total,
            },
          }),
        ]);
        results.email = emailRes.status === 'fulfilled' ? emailRes.value : { error: emailRes.reason };
        results.whatsapp = waRes.status === 'fulfilled' ? waRes.value : { error: waRes.reason };
        break;
      }

      case 'shipped': {
        // Trigger Email with AWB & WhatsApp with AWB + Tracking URL
        const [emailRes, waRes] = await Promise.allSettled([
          sendOrderShipped(order),
          sendTemplate({
            to: order.phone,
            templateName: 'order_shipped',
            parameters: {
              customer_name: order.customerName,
              order_number: order.orderNumber,
              awb: order.awbNumber || 'In Transit',
              tracking_url: order.trackingUrl || 'https://alumarperfumes.com/track',
            },
          }),
        ]);
        results.email = emailRes.status === 'fulfilled' ? emailRes.value : { error: emailRes.reason };
        results.whatsapp = waRes.status === 'fulfilled' ? waRes.value : { error: waRes.reason };
        break;
      }

      case 'delivered': {
        // Trigger Email & WhatsApp
        const [emailRes, waRes] = await Promise.allSettled([
          sendOrderDelivered(order),
          sendTemplate({
            to: order.phone,
            templateName: 'order_delivered',
            parameters: {
              customer_name: order.customerName,
              order_number: order.orderNumber,
            },
          }),
        ]);
        results.email = emailRes.status === 'fulfilled' ? emailRes.value : { error: emailRes.reason };
        results.whatsapp = waRes.status === 'fulfilled' ? waRes.value : { error: waRes.reason };
        break;
      }

      case 'cancelled': {
        // Trigger Cancellation Email
        const emailRes = await sendOrderCancelled(order);
        results.email = emailRes;
        break;
      }

      default:
        console.log(`[Notification Dispatcher] No external notifications mapped for status: ${normalizedStatus}`);
        break;
    }
  } catch (err) {
    console.error('[Notification Dispatcher] Error triggering notifications:', err);
  }

  return results;
}

/**
 * Triggers customer notifications when a refund is processed.
 */
export async function triggerRefundNotifications(
  order: NotificationOrderContext,
  refundAmount: number,
  refundId?: string | null
) {
  console.log(`[Notification Dispatcher] Processing refund notification for Order #${order.orderNumber} (₹${refundAmount})`);
  try {
    const emailRes = await sendRefundProcessed(order, refundAmount, refundId);
    return { email: emailRes };
  } catch (err) {
    console.error('[Notification Dispatcher] Error triggering refund email:', err);
    return { email: { success: false, error: err } };
  }
}
