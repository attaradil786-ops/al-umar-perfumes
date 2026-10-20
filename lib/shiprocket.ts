/**
 * Shiprocket Logistics Integration Client
 * Official API Specification: https://apiv2.shiprocket.in/v1/external
 * Docs: https://apidocs.shiprocket.in
 */

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

interface CachedToken {
  token: string;
  expiresAt: number; // Unix timestamp in ms
}

let inMemoryToken: CachedToken | null = null;

export interface ServiceabilityResult {
  serviceable: boolean;
  rate: number;
  estimatedDeliveryDays: number;
  courierName: string;
  courierCompanyId?: number;
  error?: string;
}

export interface ShiprocketItemInput {
  name: string;
  sku?: string | null;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
}

export interface ShiprocketOrderInput {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  discount?: number;
  shipping: number;
  codFee?: number;
  total: number;
  paymentMethod?: string; // "PREPAID" | "COD"
  weight?: number; // in kg
  length?: number; // in cm
  breadth?: number; // in cm
  height?: number; // in cm
  createdAt?: Date | string;
  items: Array<{
    name: string;
    sku?: string | null;
    quantity: number;
    price: number;
    productId?: string;
  }>;
}

export interface TrackingEvent {
  date: string;
  status: string;
  activity: string;
  location: string;
}

export interface TrackingResult {
  success: boolean;
  awb: string;
  currentStatus: string;
  isDelivered: boolean;
  courierName?: string;
  events: TrackingEvent[];
  error?: string;
}

/**
 * Checks whether live Shiprocket credentials are configured.
 */
export function isShiprocketConfigured(): boolean {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  return Boolean(
    email &&
      password &&
      !email.includes('placeholder') &&
      !password.includes('placeholder')
  );
}

/**
 * STEP 1.1: Authenticate with Shiprocket
 * POST /auth/login
 * Caches token in memory for 23 hours. Auto re-login on 401.
 */
export async function authenticate(forceRefresh: boolean = false): Promise<string> {
  const now = Date.now();

  // Return cached token if valid (valid for 23 hours)
  if (!forceRefresh && inMemoryToken && inMemoryToken.expiresAt > now) {
    return inMemoryToken.token;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password || email.includes('placeholder') || password.includes('placeholder')) {
    // Return mock simulated token for local development/testing without real credentials
    console.log('[Shiprocket] Using mock authentication token (placeholder credentials).');
    const mockToken = `mock_sr_token_${Date.now()}`;
    inMemoryToken = {
      token: mockToken,
      expiresAt: now + 23 * 60 * 60 * 1000,
    };
    return mockToken;
  }

  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Shiprocket auth failed (status ${res.status}): ${errBody}`);
    }

    const data = await res.json();
    if (!data.token) {
      throw new Error(`Shiprocket login returned no token: ${JSON.stringify(data)}`);
    }

    // Cache token for 23 hours (Shiprocket tokens expire in 24h)
    inMemoryToken = {
      token: data.token,
      expiresAt: now + 23 * 60 * 60 * 1000,
    };

    console.log('[Shiprocket] Successfully authenticated and refreshed API token.');
    return data.token;
  } catch (error) {
    console.error('[Shiprocket Auth Error]:', error);
    throw error;
  }
}

/**
 * Execute an authenticated Shiprocket API request with automatic 401 re-login retry.
 */
async function shiprocketFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  let token = await authenticate();

  const makeRequest = (authToken: string) => {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${authToken}`);
    headers.set('Content-Type', 'application/json');
    return fetch(`${SHIPROCKET_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  };

  let res = await makeRequest(token);

  // If 401 Unauthorized, token expired early -> force re-login and retry once
  if (res.status === 401) {
    console.warn('[Shiprocket] Received 401 Unauthorized, refreshing token and retrying...');
    token = await authenticate(true);
    res = await makeRequest(token);
  }

  return res;
}

/**
 * STEP 1.2: Get Courier Serviceability
 * GET /courier/serviceability
 */
export async function getServiceability(
  pincode: string,
  weight: number = 0.5,
  cod: boolean = false,
  declaredValue: number = 500
): Promise<ServiceabilityResult> {
  const cleanPincode = pincode.replace(/\D/g, '').trim();

  // Validate pincode format (6 digits for India)
  if (cleanPincode.length !== 6) {
    return {
      serviceable: false,
      rate: 79,
      estimatedDeliveryDays: 4,
      courierName: 'Standard Courier',
      error: 'Invalid 6-digit Indian pincode.',
    };
  }

  // Known invalid Indian test pincodes
  if (['000000', '999999', '111111', '123456'].includes(cleanPincode)) {
    return {
      serviceable: false,
      rate: 79,
      estimatedDeliveryDays: 0,
      courierName: 'None',
      error: 'Delivery is not serviceable to this destination pincode.',
    };
  }

  const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || '400001';

  // If not configured with live credentials, return realistic simulated serviceability
  if (!isShiprocketConfigured()) {
    const isMetro = ['110001', '400001', '560001', '700001', '600001', '500001'].includes(cleanPincode);
    return {
      serviceable: true,
      rate: isMetro ? 65 : 79,
      estimatedDeliveryDays: isMetro ? 2 : 4,
      courierName: 'Blue Dart Express (Standard)',
      courierCompanyId: 1,
    };
  }

  try {
    const params = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: cleanPincode,
      weight: String(Math.max(0.1, weight)),
      cod: cod ? '1' : '0',
      declared_value: String(declaredValue),
    });

    const res = await shiprocketFetch(`/courier/serviceability?${params.toString()}`, {
      method: 'GET',
    });

    if (!res.ok) {
      throw new Error(`Serviceability check HTTP ${res.status}`);
    }

    const data = await res.json();
    const companies = data?.data?.available_courier_companies || [];

    if (!Array.isArray(companies) || companies.length === 0) {
      return {
        serviceable: false,
        rate: 79,
        estimatedDeliveryDays: 0,
        courierName: 'None',
        error: 'Pincode is unserviceable by available couriers.',
      };
    }

    // Sort by cheapest rate
    companies.sort((a: any, b: any) => Number(a.rate) - Number(b.rate));
    const cheapest = companies[0];

    const estDays =
      parseInt(cheapest.estimated_delivery_days, 10) ||
      parseInt(cheapest.etd, 10) ||
      (cheapest.etd_hours ? Math.ceil(parseInt(cheapest.etd_hours, 10) / 24) : 4);

    return {
      serviceable: true,
      rate: Math.round(Number(cheapest.rate) || 79),
      estimatedDeliveryDays: estDays,
      courierName: cheapest.courier_name || 'Standard Courier',
      courierCompanyId: cheapest.courier_company_id,
    };
  } catch (error) {
    console.error(`[Shiprocket Serviceability Error for ${cleanPincode}]:`, error);
    // Fallback gracefully so customer can proceed if Shiprocket is momentarily down
    return {
      serviceable: true,
      rate: 79,
      estimatedDeliveryDays: 4,
      courierName: 'Standard Surface',
    };
  }
}

/**
 * STEP 1.3: Create Shipment (Adhoc Order + Assign AWB + Generate Pickup)
 * Executes all 3 official Shiprocket steps sequentially.
 */
export async function createShipment(order: ShiprocketOrderInput): Promise<{
  shipment_id: string;
  awb_number: string;
  courier_name: string;
}> {
  console.log(`[Shiprocket] Initiating 3-step shipment push for Order #${order.orderNumber}...`);

  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';
  const isCOD = (order.paymentMethod || '').toUpperCase() === 'COD';

  // Compute package weight and dimensions
  const totalWeight = Math.max(0.5, order.weight || 0.5);
  const pkgLength = Math.max(10, order.length || 10);
  const pkgBreadth = Math.max(10, order.breadth || 10);
  const pkgHeight = Math.max(10, order.height || 10);

  // Split name safely
  const nameParts = (order.customerName || 'Valued Customer').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Valued';
  const lastName = nameParts.slice(1).join(' ') || 'Customer';

  // Format order date: YYYY-MM-DD HH:mm
  const orderDateObj = order.createdAt ? new Date(order.createdAt) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedOrderDate = `${orderDateObj.getFullYear()}-${pad(orderDateObj.getMonth() + 1)}-${pad(
    orderDateObj.getDate()
  )} ${pad(orderDateObj.getHours())}:${pad(orderDateObj.getMinutes())}`;

  // Map order items to official Shiprocket structure
  const orderItems = order.items.map((item, idx) => ({
    name: item.name || 'Artisanal Perfume',
    sku: item.sku || `SKU-${(item.productId || `item-${idx}`).slice(-8)}`,
    units: item.quantity,
    selling_price: item.price,
    discount: 0,
    tax: 0,
  }));

  // Clean phone number (10 digits for India)
  const cleanPhone = order.phone.replace(/\D/g, '').slice(-10);

  // If live credentials not configured, return mock shipment details immediately
  if (!isShiprocketConfigured()) {
    console.log(`[Shiprocket Mock] Successfully simulated shipment for Order #${order.orderNumber}`);
    const mockShipmentId = `SR-${Date.now().toString(36).toUpperCase()}`;
    const mockAwb = `AWB-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const mockCourier = 'Blue Dart Express (Air)';
    return {
      shipment_id: mockShipmentId,
      awb_number: mockAwb,
      courier_name: mockCourier,
    };
  }

  // -------------------------------------------------------------
  // Step A: POST /orders/create/adhoc
  // -------------------------------------------------------------
  let shipmentId = '';
  let orderCreatedData: any = null;

  try {
    const adhocPayload = {
      order_id: order.orderNumber,
      order_date: formattedOrderDate,
      pickup_location: pickupLocation,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: order.address,
      billing_address_2: '',
      billing_city: order.city,
      billing_pincode: order.pincode,
      billing_state: order.state,
      billing_country: 'India',
      billing_email: order.email || 'support@alumarperfumes.com',
      billing_phone: cleanPhone,
      shipping_is_billing: true,
      shipping_customer_name: firstName,
      shipping_last_name: lastName,
      shipping_address: order.address,
      shipping_address_2: '',
      shipping_city: order.city,
      shipping_pincode: order.pincode,
      shipping_state: order.state,
      shipping_country: 'India',
      shipping_email: order.email || 'support@alumarperfumes.com',
      shipping_phone: cleanPhone,
      order_items: orderItems,
      payment_method: isCOD ? 'COD' : 'Prepaid',
      shipping_charges: order.shipping,
      total_discount: order.discount || 0,
      sub_total: order.total, // For COD, full amount to collect including shipping/fees
      length: pkgLength,
      breadth: pkgBreadth,
      height: pkgHeight,
      weight: totalWeight,
    };

    const resA = await shiprocketFetch('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(adhocPayload),
    });

    if (!resA.ok) {
      const errText = await resA.text();
      throw new Error(`Step A (orders/create/adhoc) failed [${resA.status}]: ${errText}`);
    }

    orderCreatedData = await resA.json();
    shipmentId = String(orderCreatedData.shipment_id || orderCreatedData.order_id || '');

    if (!shipmentId) {
      throw new Error(`Step A returned no shipment_id: ${JSON.stringify(orderCreatedData)}`);
    }

    console.log(`[Shiprocket Step A Complete] Created Order & Shipment ID: ${shipmentId}`);
  } catch (errA: any) {
    console.error(`[Shiprocket Error in Step A for Order #${order.orderNumber}]:`, errA);
    throw errA;
  }

  // -------------------------------------------------------------
  // Step B: POST /courier/assign/awb
  // -------------------------------------------------------------
  let awbNumber = '';
  let courierName = 'Standard Logistics';

  try {
    const resB = await shiprocketFetch('/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify({
        shipment_id: Number(shipmentId) || shipmentId,
      }),
    });

    if (!resB.ok) {
      const errTextB = await resB.text();
      throw new Error(`Step B (courier/assign/awb) failed [${resB.status}]: ${errTextB}`);
    }

    const dataB = await resB.json();
    const awbData = dataB?.response?.data || dataB?.data || dataB;
    awbNumber = String(awbData.awb_code || awbData.awb_number || '');
    courierName = String(awbData.courier_name || 'Shiprocket Partner');

    if (!awbNumber) {
      // Fallback: check if AWB is nested or in message
      awbNumber = String(dataB?.awb_code || '');
    }

    if (!awbNumber) {
      throw new Error(`Step B did not return an awb_code: ${JSON.stringify(dataB)}`);
    }

    console.log(`[Shiprocket Step B Complete] AWB Assigned: ${awbNumber} via ${courierName}`);
  } catch (errB: any) {
    console.error(`[Shiprocket Error in Step B for Order #${order.orderNumber}]:`, errB);
    throw errB;
  }

  // -------------------------------------------------------------
  // Step C: POST /courier/generate/pickup
  // -------------------------------------------------------------
  try {
    const resC = await shiprocketFetch('/courier/generate/pickup', {
      method: 'POST',
      body: JSON.stringify({
        shipment_id: [Number(shipmentId) || shipmentId],
      }),
    });

    if (!resC.ok) {
      const errTextC = await resC.text();
      console.warn(`[Shiprocket Step C Warning] Pickup generation returned status ${resC.status}: ${errTextC}`);
    } else {
      const dataC = await resC.json();
      console.log(`[Shiprocket Step C Complete] Pickup scheduled:`, dataC?.response || dataC);
    }
  } catch (errC) {
    // Non-fatal: AWB is already generated, pickup can be rescheduled
    console.warn(`[Shiprocket Step C Non-fatal Error]:`, errC);
  }

  return {
    shipment_id: shipmentId,
    awb_number: awbNumber,
    courier_name: courierName,
  };
}

/**
 * STEP 1.4: Track Order
 * GET /courier/track/awb/{awb}
 * Normalizes activities and determines if package is delivered.
 */
export async function trackOrder(awb: string): Promise<TrackingResult> {
  const cleanAwb = awb.trim();

  if (!isShiprocketConfigured()) {
    // Return simulated tracking data for testing
    const now = new Date();
    const pastDate = (hoursAgo: number) =>
      new Date(now.getTime() - hoursAgo * 3600 * 1000).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

    return {
      success: true,
      awb: cleanAwb,
      currentStatus: 'IN TRANSIT',
      isDelivered: false,
      courierName: 'Blue Dart Express',
      events: [
        {
          date: pastDate(24),
          status: 'Manifested',
          activity: 'Shipment info received and parcel packed at Mumbai atelier',
          location: 'Mumbai Hub',
        },
        {
          date: pastDate(18),
          status: 'Picked Up',
          activity: 'Courier driver picked up parcel from atelier',
          location: 'Mumbai Central',
        },
        {
          date: pastDate(6),
          status: 'In Transit',
          activity: 'Arrived at distribution sort facility',
          location: 'Bhiwandi Gateway Hub',
        },
      ],
    };
  }

  try {
    const res = await shiprocketFetch(`/courier/track/awb/${cleanAwb}`, {
      method: 'GET',
    });

    if (!res.ok) {
      throw new Error(`Shiprocket tracking HTTP ${res.status}`);
    }

    const data = await res.json();
    const trackingData = data?.tracking_data || {};
    const trackScans = trackingData?.shipment_track_activities || [];
    const shipmentTrack = trackingData?.shipment_track?.[0] || {};

    const rawStatus = String(shipmentTrack.current_status || trackingData.track_status || 'In Transit');
    const isDelivered = rawStatus.toLowerCase().includes('delivered');

    const normalizedEvents: TrackingEvent[] = Array.isArray(trackScans)
      ? trackScans.map((scan: any) => ({
          date: scan['date'] || scan['activity-date'] || new Date().toISOString(),
          status: scan['status'] || scan['activity'] || 'Update',
          activity: scan['activity'] || scan['status'] || 'In transit',
          location: scan['location'] || '',
        }))
      : [];

    return {
      success: true,
      awb: cleanAwb,
      currentStatus: rawStatus,
      isDelivered,
      courierName: shipmentTrack.courier_name || 'Shiprocket Partner',
      events: normalizedEvents,
    };
  } catch (error: any) {
    console.error(`[Shiprocket Tracking Error for AWB ${cleanAwb}]:`, error);
    return {
      success: false,
      awb: cleanAwb,
      currentStatus: 'Status Pending',
      isDelivered: false,
      events: [],
      error: error.message || 'Tracking information currently unavailable',
    };
  }
}

/**
 * STEP 1.5: Generate Label
 * POST /courier/generate/label
 * Returns the label PDF URL.
 */
export async function generateLabel(shipmentId: string | number): Promise<{
  success: boolean;
  labelUrl?: string;
  error?: string;
}> {
  if (!isShiprocketConfigured()) {
    return {
      success: true,
      labelUrl: `https://shiprocket.co/sample-label-mock.pdf?shipment_id=${shipmentId}`,
    };
  }

  try {
    const res = await shiprocketFetch('/courier/generate/label', {
      method: 'POST',
      body: JSON.stringify({
        shipment_id: [Number(shipmentId) || shipmentId],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Label generation HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const labelUrl = data?.label_url || data?.response?.label_url;

    if (!labelUrl) {
      throw new Error(`Shiprocket did not return a label_url: ${JSON.stringify(data)}`);
    }

    return {
      success: true,
      labelUrl,
    };
  } catch (error: any) {
    console.error(`[Shiprocket Generate Label Error for ${shipmentId}]:`, error);
    return {
      success: false,
      error: error.message || 'Failed to generate shipping label',
    };
  }
}
