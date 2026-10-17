'use client';

import { useEffect } from 'react';
import { trackPurchase, PurchaseOrderData } from '@/lib/analytics';

export default function OrderConfirmationAnalytics({ order }: { order: PurchaseOrderData }) {
  useEffect(() => {
    if (!order?.orderNumber) return;

    // Prevent duplicate purchase events on page reload
    const storageKey = `tracked_purchase_${order.orderNumber}`;
    try {
      if (sessionStorage.getItem(storageKey)) {
        return;
      }
      sessionStorage.setItem(storageKey, 'true');
    } catch {
      // ignore storage access issues
    }

    try {
      trackPurchase(order);
    } catch {
      // ignore tracking errors
    }
  }, [order]);

  return null;
}
