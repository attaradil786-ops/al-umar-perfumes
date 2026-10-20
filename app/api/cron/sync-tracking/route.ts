import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { trackOrder } from '@/lib/shiprocket';
import { triggerOrderStatusNotifications } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * STEP 5: Tracking Sync Cron Endpoint
 * Protected by CRON_SECRET header.
 * Syncs all shipped orders against Shiprocket tracking API and marks delivered.
 */
export async function GET(req: NextRequest) {
  return handleTrackingSync(req);
}

export async function POST(req: NextRequest) {
  return handleTrackingSync(req);
}

async function handleTrackingSync(req: NextRequest) {
  try {
    const configuredSecret = process.env.CRON_SECRET;

    // Check authorization: Bearer token or x-cron-secret header
    const authHeader = req.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
    const customHeader = req.headers.get('x-cron-secret') || '';
    const querySecret = req.nextUrl.searchParams.get('secret') || '';

    const providedSecret = bearerToken || customHeader || querySecret;

    if (!configuredSecret || providedSecret !== configuredSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing CRON_SECRET.' },
        { status: 401 }
      );
    }

    // Find all active shipped orders that have an assigned AWB
    const shippedOrders = await prisma.order.findMany({
      where: {
        status: { in: ['shipped', 'SHIPPED', 'In Transit', 'in_transit'] },
        awbNumber: { not: null },
      },
      include: { items: true },
    });

    console.log(`[Tracking Sync] Found ${shippedOrders.length} shipped orders to check.`);

    const results = {
      totalChecked: shippedOrders.length,
      updated: 0,
      delivered: 0,
      errors: 0,
      details: [] as Array<{ orderNumber: string; awb: string; status: string; delivered: boolean }>,
    };

    for (const order of shippedOrders) {
      if (!order.awbNumber) continue;

      try {
        const tracking = await trackOrder(order.awbNumber);
        const rawStatus = (tracking.currentStatus || '').toLowerCase();
        const isDelivered = rawStatus.includes('delivered') || tracking.isDelivered;

        if (isDelivered) {
          // Mark order delivered
          const updated = await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'delivered',
              shipmentStatus: 'delivered',
              deliveredNotificationSent: true,
            },
          });

          // Send delivered notifications once only
          if (!order.deliveredNotificationSent) {
            triggerOrderStatusNotifications(
              {
                orderNumber: updated.orderNumber,
                customerName: updated.customerName,
                phone: updated.phone,
                email: updated.email,
                total: updated.total,
                subtotal: updated.subtotal,
                discount: updated.discount,
                shipping: updated.shipping,
                address: updated.address,
                city: updated.city,
                state: updated.state,
                pincode: updated.pincode,
                awbNumber: updated.awbNumber,
                trackingUrl: updated.trackingUrl,
                items: order.items,
              },
              'delivered'
            ).catch(err => console.error(`Delivered notification error for #${order.orderNumber}:`, err));
          }

          results.delivered += 1;
          results.updated += 1;
          results.details.push({
            orderNumber: order.orderNumber,
            awb: order.awbNumber,
            status: 'Delivered',
            delivered: true,
          });
        } else {
          // Update courier status text if available
          if (tracking.currentStatus && tracking.currentStatus !== order.shipmentStatus) {
            await prisma.order.update({
              where: { id: order.id },
              data: { shipmentStatus: tracking.currentStatus },
            });
            results.updated += 1;
          }
          results.details.push({
            orderNumber: order.orderNumber,
            awb: order.awbNumber,
            status: tracking.currentStatus,
            delivered: false,
          });
        }
      } catch (orderErr) {
        console.error(`[Tracking Sync Error for Order #${order.orderNumber}]:`, orderErr);
        results.errors += 1;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Tracking sync error';
    console.error('[Tracking Sync Fatal Error]:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
