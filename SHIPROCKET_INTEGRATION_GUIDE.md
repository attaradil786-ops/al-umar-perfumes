# 🚀 Shiprocket End-to-End Integration Guide for Al Umar Perfumes

This document provides the complete setup, configuration, and operational guide for the Shiprocket integration into the Next.js e-commerce platform.

---

## 1. Environment Variables (.env.local)

Add the following values into your `al-umar-next/.env.local` file:

```env
# Shiprocket API Credentials (apiv2.shiprocket.in/v1/external)
# Generated under Shiprocket Dashboard -> Settings -> API -> Configure
SHIPROCKET_EMAIL="your_shiprocket_email@domain.com"
SHIPROCKET_PASSWORD="your_shiprocket_api_user_password"

# Warehouse / Pickup Location Nickname (must exactly match name in Shiprocket dashboard)
SHIPROCKET_PICKUP_LOCATION="Primary"

# Warehouse / Store Origin PIN Code (used for live courier rate calculations)
SHIPROCKET_PICKUP_PINCODE="400001"

# Automated Tracking Cron Secret (for protecting /api/cron/sync-tracking)
CRON_SECRET="generate_a_random_32_character_hex_or_string"
```

> **Security Note:** `.env.local` is listed in `.gitignore` and credentials are never exposed to the frontend or bundled into client JavaScript. All Shiprocket operations execute exclusively on the server.

---

## 2. Shiprocket Dashboard Configuration

To activate live order processing with Shiprocket couriers (Blue Dart, Delhivery, DTDC, Ecom Express, etc.):

### A. Create an API User
1. Log in to [Shiprocket Dashboard](https://app.shiprocket.in/).
2. Navigate to **Settings** (left sidebar) ➔ **API** ➔ **Configure**.
3. Click **Create An API User** (or use your primary Shiprocket account credentials).
4. Enter the email and password into `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` in `.env.local`.

### B. Add Primary Pickup Address
1. Go to **Settings** ➔ **Company Details** ➔ **Pickup Addresses**.
2. Click **Add Pickup Location**.
3. Name the location nickname (e.g. `Primary` or `Main Warehouse`).
4. Enter the warehouse address and PIN code.
5. Ensure the nickname matches `SHIPROCKET_PICKUP_LOCATION` in `.env.local`.
6. Ensure the PIN code matches `SHIPROCKET_PICKUP_PINCODE` in `.env.local`.

### C. Recharge Shiprocket Wallet
1. Shiprocket operates on a prepaid wallet model for courier shipping charges and label generation.
2. In the dashboard top navigation, click **Recharge Wallet**.
3. Add minimum balance (e.g., ₹500 - ₹1,000) so that AWB generation (`/courier/assign/awb`) succeeds.

---

## 3. How the Integration Works

### A. Live Shipping & Serviceability Calculation
- **Server-Side Security**: Delivery charges are calculated entirely on the server during `/api/checkout/create-order`. Client values are never trusted.
- **Serviceability Check**: Customers can enter their 6-digit PIN code on both the **Product page** and the **Checkout page** to view estimated delivery days, courier partner, and shipping fees.
- **Delivery Rules**:
  - If cart subtotal ≥ `free_above` (default ₹1,500), shipping is **₹0 (FREE)**.
  - If `shipping_mode` is `"live_rates"`, the system queries Shiprocket's courier serviceability API to fetch the lowest rate for the cart's total weight and destination PIN.
  - If the mode is `"flat"` or Shiprocket is unreachable, the system cleanly falls back to `flat_rate` (default ₹79).
- **Checkout Guard**: If a customer enters an unserviceable PIN code, the checkout button is disabled and order creation is blocked.

### B. Payment Modes & COD
- **Prepaid via Razorpay**: Razorpay signature is cryptographically verified server-side.
- **Cash on Delivery (COD)**: When enabled, customers can choose COD. The order bypasses Razorpay, sets `paymentStatus = "pending_cod"`, and stock is decremented immediately. The Shiprocket shipment collectable amount includes products + shipping + COD fee.

### C. Automatic & Manual Order Push to Shiprocket
- **Trigger 1 (Admin)**: When the store admin updates the order status to `shipped` via `/admin8080/orders/[id]`, the system calls `createShipment(order)`:
  1. `POST /orders/create/adhoc` (Creates the order in Shiprocket)
  2. `POST /courier/assign/awb` (Assigns AWB & selects courier)
  3. `POST /courier/generate/pickup` (Schedules pickup)
- **Trigger 2 (Auto-Ship on Payment)**: If the admin toggle `auto_ship_on_payment` is enabled in settings, online prepaid orders are pushed to Shiprocket immediately upon payment verification.
- **Idempotency Guard**: If an order already has an AWB number, subsequent clicks or duplicate webhooks will **never** generate a duplicate shipment.
- **Fault-Tolerant Resilience**: If Shiprocket is down or the wallet is empty, the order is **never lost**. It transitions safely to `shipmentStatus = "failed"`, logs the error message in the order, and presents a **"Retry Shipment"** button on the admin page. Customer dispatch notifications are held until an AWB is successfully issued.
- **Label Generation**: Admins can click **"Download Shipping Label (PDF)"** on any dispatched order to retrieve the courier label.

### D. Tracking Sync (Cron Endpoint)
- **Route**: `GET /api/cron/sync-tracking`
- **Protection**: Requires `x-cron-secret: <CRON_SECRET>` or `Authorization: Bearer <CRON_SECRET>`. Requests without or with incorrect secrets receive HTTP 401.
- **Function**: Queries Shiprocket for all shipped orders, extracts live scan history, updates tracking status, and sets the order to `delivered` when the status text says "Delivered".
- **Notification**: Fires customer delivery notification (Email & WhatsApp) once only upon delivery.

---

## 4. Scheduling the Tracking Sync (Every 6 Hours)

If hosting on Vercel (Hobby / Free Plan), cron jobs are limited to once per day. To run every 6 hours as required:

### Option A: External Webhook (cron-job.org - Recommended Free & Easy)
1. Sign up for free at [cron-job.org](https://cron-job.org/).
2. Create a new cron job:
   - **URL**: `https://your-domain.com/api/cron/sync-tracking`
   - **Execution Schedule**: Every 6 hours (`0 */6 * * *`)
   - **Headers**: Add `x-cron-secret: <your_CRON_SECRET>`
3. Save and enable the job.

### Option B: GitHub Actions (.github/workflows/sync-tracking.yml)
```yaml
name: Sync Shiprocket Tracking
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Tracking Sync API
        run: |
          curl -f -X GET "https://your-domain.com/api/cron/sync-tracking" \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

---

## 5. Verification & Running the Tests

To verify all 8 integration requirements, run the test script:

```bash
npx tsx scripts/test-shiprocket.ts
```

### The test suite verifies:
1. `authenticate()` successfully retrieves and caches the auth token for 23 hours.
2. Subtotal ₹1,499 charges shipping, and ₹1,500 charges ₹0.
3. Unserviceable PIN codes are detected and blocked.
4. Mock order moves from `packed` ➔ `shipped` and an AWB & Courier partner are assigned.
5. Idempotency test: double-dispatching does not create duplicate shipments.
6. COD orders correctly record collectable amount including shipping and COD surcharge.
7. Cron endpoint `/api/cron/sync-tracking` returns HTTP 401 without secret and succeeds with valid secret.
8. Shiprocket API downtime or authentication failure keeps orders safely intact in the database with a "Retry Shipment" state.
