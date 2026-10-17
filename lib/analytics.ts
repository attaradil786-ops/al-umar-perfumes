'use client';

// Helper to check whether current location or given path is within admin zone
export function isAdminPath(path?: string): boolean {
  if (typeof window === 'undefined' && !path) return false;
  const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  const adminBase = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || '/studio-alumar-9f7x2k';
  const cleanAdmin = adminBase.replace(/^\//, '').replace(/\/$/, '');

  if (
    currentPath.startsWith(`/${cleanAdmin}`) ||
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/api/admin')
  ) {
    return true;
  }
  return false;
}

export interface AnalyticsItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  size?: string;
}

// 1. PageView
export function trackPageView(url: string) {
  if (typeof window === 'undefined' || isAdminPath(url)) return;

  // GA4
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'page_view', {
      page_path: url,
    });
  }

  // Meta Pixel
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', 'PageView');
  }
}

// 2. Add To Cart
export function trackAddToCart(item: AnalyticsItem) {
  if (typeof window === 'undefined' || isAdminPath()) return;
  const qty = item.quantity || 1;
  const totalVal = item.price * qty;

  // GA4: add_to_cart
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'add_to_cart', {
      currency: 'INR',
      value: totalVal,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: qty,
          item_category: item.category || 'Attar',
          item_variant: item.size || 'Standard',
        },
      ],
    });
  }

  // Meta Pixel: AddToCart
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', 'AddToCart', {
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category || 'Attar',
      content_type: 'product',
      value: totalVal,
      currency: 'INR',
    });
  }
}

// 3. Begin Checkout
export function trackBeginCheckout(items: AnalyticsItem[], totalValue: number) {
  if (typeof window === 'undefined' || isAdminPath()) return;

  // GA4: begin_checkout
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'begin_checkout', {
      currency: 'INR',
      value: totalValue,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        item_category: item.category || 'Attar',
        item_variant: item.size || 'Standard',
      })),
    });
  }

  // Meta Pixel: InitiateCheckout
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', 'InitiateCheckout', {
      content_ids: items.map(i => i.id),
      contents: items.map(i => ({
        id: i.id,
        quantity: i.quantity || 1,
        item_price: i.price,
      })),
      num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
      value: totalValue,
      currency: 'INR',
    });
  }
}

// 4. Purchase
export interface PurchaseOrderData {
  orderNumber: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  items: Array<{
    id?: string;
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    size?: string | null;
  }>;
}

export function trackPurchase(order: PurchaseOrderData) {
  if (typeof window === 'undefined' || isAdminPath()) return;

  // GA4: purchase
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'purchase', {
      transaction_id: order.orderNumber,
      value: order.total,
      currency: 'INR',
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      items: order.items.map(item => ({
        item_id: item.productId || item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category || 'Attar',
        item_variant: item.size || 'Standard',
      })),
    });
  }

  // Meta Pixel: Purchase
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', 'Purchase', {
      content_ids: order.items.map(i => i.productId || i.id),
      content_type: 'product',
      value: order.total,
      currency: 'INR',
      num_items: order.items.reduce((acc, i) => acc + i.quantity, 0),
    });
  }
}

// 5. View Item
export function trackViewItem(item: { id: string; name: string; price: number; category?: string }) {
  if (typeof window === 'undefined' || isAdminPath()) return;

  // GA4: view_item
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'view_item', {
      currency: 'INR',
      value: item.price,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          item_category: item.category || 'Attar',
        },
      ],
    });
  }

  // Meta Pixel: ViewContent
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', 'ViewContent', {
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category || 'Attar',
      content_type: 'product',
      value: item.price,
      currency: 'INR',
    });
  }
}

// 6. Search
export function trackSearch(searchTerm: string) {
  if (typeof window === 'undefined' || isAdminPath() || !searchTerm.trim()) return;

  // GA4: search
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'search', {
      search_term: searchTerm.trim(),
    });
  }

  // Meta Pixel: Search
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', 'Search', {
      search_string: searchTerm.trim(),
    });
  }
}
