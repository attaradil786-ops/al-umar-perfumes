# Al Umar Perfumes — Full Offensive Security Audit & Remediation Report

**Audit Date:** October 17, 2026  
**Auditor:** Adversarial Security Reviewer (Antigravity Agent)  
**Target:** Al Umar Luxury E-Commerce Platform (`al-umar-next`)  
**Production Build Status:** Passed (`next build` compiled with Exit Code 0)  
**Verification Suite:** Automated test suite at [`scripts/security-test.sh`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/scripts/security-test.sh) & [`scripts/security-test.ps1`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/scripts/security-test.ps1)

---

## 1. Executive Summary

A comprehensive, offensive white-box security audit was conducted targeting the entire payment flow, cart calculations, coupon logic, admin discovery protections, authentication routines, stock concurrency, and input validations. 

All identified vulnerabilities have been **patched, hardened, and verified**:

| Severity | Found | Remediated | Remaining Unfixed |
| :--- | :---: | :---: | :---: |
| **CRITICAL** | 4 | **4 (100% FIXED)** | 0 |
| **HIGH** | 4 | **4 (100% FIXED)** | 0 |
| **MEDIUM** | 2 | **2 (100% FIXED)** | 0 |
| **LOW / INFO** | 2 | **2 (100% FIXED)** | 0 |
| **Total** | **12** | **12** | **0** |

---

## 2. Security Test Matrix

| Test # | Vulnerability Category | Severity | Pre-Audit State | Remediated Status |
| :---: | :--- | :---: | :---: | :---: |
| **TEST 1** | Payment Signature Bypass & Timing Attack | **CRITICAL** | Fallback accepted arbitrary payment IDs without signature; `===` timing attack | **FIXED** |
| **TEST 2** | Client-Side Price Manipulation | **CRITICAL** | `/api/orders` trusted client price; regex in `create-order` allowed price deductions | **FIXED** |
| **TEST 3** | Coupon Fraud & Negative Values | **HIGH** | Non-atomic coupon updates; allowed negative values and negative subtotals | **FIXED** |
| **TEST 4** | Cart Negative & Oversized Quantities | **HIGH** | Quantity lacked upper bounds (allowed 999999); negative quantities allowed | **FIXED** |
| **TEST 5** | Race Conditions (Stock & Coupon Limits) | **HIGH** | Loose update loops allowed stock to decrement below 0 during concurrent calls | **FIXED** |
| **TEST 6** | Webhook Forgery & Replay Attacks | **HIGH** | No Razorpay webhook route existed; vulnerable to unauthenticated fake payments | **FIXED** |
| **TEST 7** | Admin Panel Discovery & Path Leakage | **HIGH** | `NEXT_PUBLIC_ADMIN_BASE_PATH` inlined secret admin URL into public JS bundles | **FIXED** |
| **TEST 8** | IDOR (Customer Order & Address Exposure) | **CRITICAL** | `GET /api/orders/[orderNumber]` leaked customer phone/address without verification | **FIXED** |
| **TEST 9** | Stock & Inventory Integrity | **MEDIUM** | Negative stock/price permitted in admin; hard-deleting products broke order FKs | **FIXED** |
| **TEST 10** | Authentication Backdoor & User Enumeration | **CRITICAL** | Hardcoded backdoor password `admin123`/`ADMIN123` in `lib/auth.ts` | **FIXED** |
| **TEST 11** | File Upload (Arbitrary Upload & Stored XSS) | **HIGH** | No file size checks; client-supplied file extensions written to `/public` | **FIXED** |
| **TEST 12** | Information Disclosure & Wildcard CORS | **MEDIUM** | `/api/health` leaked DB connection strings; wildcard CORS on credentials | **FIXED** |

---

## 3. Detailed Findings & Applied Code Fixes

### TEST 1 — Payment Bypass & Verification Timing Attack
- **Severity:** **CRITICAL**
- **Location:** [`app/api/checkout/verify/route.ts:39-50`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/checkout/verify/route.ts)
- **Vulnerability:** When `RAZORPAY_KEY_SECRET` was empty or `razorpaySignature` was omitted, the handler defaulted to `isValid = Boolean(razorpayPaymentId)`. Any attacker sending a curl request with a fake `razorpayPaymentId` could mark any order as `paid`. Additionally, standard string equality `===` was used, exposing the signature to timing side-channel attacks.
- **Remediation Applied:**
  1. Mandated `orderNumber`, `razorpayPaymentId`, `razorpayOrderId`, and `razorpaySignature` as non-empty required fields.
  2. Implemented `crypto.timingSafeEqual` over UTF-8 byte buffers.
  3. Added idempotency guard: if `order.paymentStatus === 'paid'`, immediately return without duplicate stock decrements.
  4. Wrapped payment status update, atomic stock decrement, and coupon usage in a single `prisma.$transaction`.

---

### TEST 2 — Price Manipulation
- **Severity:** **CRITICAL**
- **Location:** [`app/api/orders/route.ts:46-48`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/orders/route.ts) & [`app/api/checkout/create-order/route.ts:89-92`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/checkout/create-order/route.ts)
- **Vulnerability:**
  - `POST /api/orders` calculated subtotal using `Number(item.price)` directly from the JSON body. An attacker could buy ₹2,450 perfumes for ₹1.
  - `POST /api/checkout/create-order` evaluated `item.size.match(/-₹(\d+)/)` and subtracted arbitrary client values from the base price.
- **Remediation Applied:**
  1. Completely eradicated client price trust. All item prices are now fetched directly from the database `Product` table via `prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } })`.
  2. Restricted size variants strictly to validated configurations (`6ml` base, `12ml` multiplier).
  3. Enforced `unitPrice = Math.max(dbProduct.price, unitPrice)`, making client price reduction mathematically impossible.

---

### TEST 3 — Coupon Fraud & Race Conditions
- **Severity:** **HIGH**
- **Location:** [`app/api/coupons/validate/route.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/coupons/validate/route.ts) & [`app/api/admin/coupons/route.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/admin/coupons/route.ts)
- **Vulnerability:**
  - Coupons allowed negative discounts or negative subtotals.
  - Coupon usage incrementing was non-atomic and not validated during checkout payment confirmation.
- **Remediation Applied:**
  1. Enforced `coupon.value > 0` and `subtotal > 0`.
  2. Percentage discounts are clamped to `min: 1, max: 100`.
  3. Coupon usage is atomically updated within the checkout transaction.

---

### TEST 4 — Cart Quantity & Negative Inputs
- **Severity:** **HIGH**
- **Location:** [`lib/validators.ts:7`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/lib/validators.ts) & [`app/api/orders/route.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/orders/route.ts)
- **Vulnerability:**
  - `quantity` was not constrained by an upper limit, permitting `quantity: 999999`.
  - Negative quantities (`quantity: -5`) could cause negative subtotals or increment stock illicitly.
- **Remediation Applied:**
  1. Updated `OrderItemSchema` with `z.number().int().min(1).max(100)`.
  2. In `create-order` and `orders` routes, enforced `parseInt(item.quantity, 10)` within `[1, 100]`.

---

### TEST 5 — Concurrency & Stock Overselling
- **Severity:** **HIGH**
- **Location:** [`app/api/checkout/verify/route.ts:70-81`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/checkout/verify/route.ts)
- **Vulnerability:** Stock decrements were executed in an asynchronous loop outside of a database transaction, allowing concurrent checkouts to oversell stock below zero.
- **Remediation Applied:**
  1. Enclosed all order state transitions and stock decrements within `prisma.$transaction`.
  2. Added floor clamping `Math.max(0, product.stock - item.quantity)` to prevent negative inventory corruptions.

---

### TEST 6 — Webhook Forgery
- **Severity:** **HIGH**
- **Location:** [`app/api/webhooks/razorpay/route.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/webhooks/razorpay/route.ts)
- **Vulnerability:** No webhook receiver existed to authenticate and process out-of-band payment capture notifications.
- **Remediation Applied:**
  1. Built dedicated endpoint at `/api/webhooks/razorpay`.
  2. Implemented HMAC-SHA256 signature verification over raw request body using `RAZORPAY_WEBHOOK_SECRET`.
  3. Integrated timing-safe validation and transaction-level idempotency to prevent duplicate inventory deductions.

---

### TEST 7 — Admin Panel Discovery & Path Leakage
- **Severity:** **HIGH**
- **Location:** [`lib/analytics.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/lib/analytics.ts), [`sentry.client.config.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/sentry.client.config.ts), [`.env`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/.env), [`middleware.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/middleware.ts)
- **Vulnerability:**
  - Prefixing the secret admin route with `NEXT_PUBLIC_ADMIN_BASE_PATH` compiled the secret path `/studio-alumar-9f7x2k` directly into the public client JavaScript chunks.
  - Probes to `/admin` or `/admin/login` were not intercepted by middleware.
- **Remediation Applied:**
  1. Completely deleted `NEXT_PUBLIC_ADMIN_BASE_PATH` from `.env`, `.env.local`, and client bundles.
  2. Updated analytics and Sentry to detect admin context via DOM state (`window.__IS_ADMIN_PORTAL__`) and a public route inverted whitelist.
  3. In `middleware.ts`, explicitly intercepted `/admin` and `/admin/:path*` to return HTTP 404.
  4. Verified via ripgrep/Select-String that zero occurrences of `studio-alumar` exist in `.next/static`.

---

### TEST 8 — IDOR Customer Privacy Violation
- **Severity:** **CRITICAL**
- **Location:** [`app/api/orders/[orderNumber]/route.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/orders/%5BorderNumber%5D/route.ts)
- **Vulnerability:** Any visitor could query `GET /api/orders/[orderNumber]` without authentication and view full customer names, phone numbers, delivery addresses, and purchased items. Order numbers were also predictable timestamps.
- **Remediation Applied:**
  1. Required phone number verification for customer lookups (`?phone=...`), or an active admin session.
  2. Masked sensitive shipping address to city and state only.
  3. Migrated order number generation to cryptographically random nonces: `ALU-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`.

---

### TEST 9 — Stock & Inventory Integrity
- **Severity:** **MEDIUM**
- **Location:** [`app/api/admin/products/route.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/admin/products/route.ts) & [`app/api/admin/products/[id]/route.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/admin/products/%5Bid%5D/route.ts)
- **Vulnerability:** Admin endpoints accepted negative prices and negative stock counts. Hard deletion of products with existing order history failed database foreign key constraints.
- **Remediation Applied:**
  1. Enforced `price >= 1` and `stock >= 0`.
  2. In `DELETE /api/admin/products/[id]`, checked if `prisma.orderItem` references the product. If historical orders exist, automatically soft-deleted the product (`isActive = false`) to preserve audit and GST invoice integrity.

---

### TEST 10 — Hardcoded Authentication Backdoor
- **Severity:** **CRITICAL**
- **Location:** [`lib/auth.ts:136-138`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/lib/auth.ts)
- **Vulnerability:** A hardcoded developer backdoor permitted anyone to authenticate as admin by supplying `ADMIN123` or `admin123` as the password.
- **Remediation Applied:**
  1. Deleted the backdoor condition completely.
  2. Enforced strict `bcrypt.compare(password, admin.password)`.
  3. Ensured error responses return uniform `"Invalid credentials"` across all failure branches to prevent user enumeration.

---

### TEST 11 — File Upload Restrictions
- **Severity:** **HIGH**
- **Location:** [`app/api/admin/upload/route.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/admin/upload/route.ts)
- **Vulnerability:** Allowed unbounded file uploads without MIME verification. Could allow HTML or SVG uploads containing malicious scripts, or trigger Denial of Service via large files.
- **Remediation Applied:**
  1. Enforced a hard 5MB size limit per file.
  2. Whitelisted MIME types strictly to `image/jpeg`, `image/png`, and `image/webp`.
  3. Added file header magic byte inspection.
  4. Disregarded client-provided filenames, generating random UUID filenames (`crypto.randomUUID()`).

---

### TEST 12 — Information Disclosure & CORS
- **Severity:** **MEDIUM**
- **Location:** [`app/api/health/route.ts`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/app/api/health/route.ts) & [`next.config.mjs`](file:///c:/Users/abdul/Desktop/al-umers/al-umar-next/next.config.mjs)
- **Vulnerability:**
  - `GET /api/health` returned raw database exception messages, exposing connection string hostnames.
  - `next.config.mjs` had an invalid and dangerous combination of `Access-Control-Allow-Credentials: true` with wildcard `Access-Control-Allow-Origin: *`.
- **Remediation Applied:**
  1. Sanitized `/api/health` to return clean `{ status: 'error', db: 'disconnected' }`.
  2. Replaced permissive CORS headers with security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Cache-Control: no-store` on admin routes.

---

## 4. Remaining Pre-Launch Manual Actions

Before handing over to production:
1. **Rotate Secrets:**
   - In production, set a fresh, 32-character random secret for `NEXTAUTH_SECRET` (`openssl rand -base64 32`).
   - Generate a fresh 64-character hex key for `TOTP_ENCRYPTION_KEY` (`openssl rand -hex 32`).
2. **Configure Razorpay Webhook:**
   - In your [Razorpay Dashboard &rarr; Settings &rarr; Webhooks](https://dashboard.razorpay.com/#/app/webhooks), add:
     - **URL:** `https://your-domain.com/api/webhooks/razorpay`
     - **Secret:** Match with `RAZORPAY_WEBHOOK_SECRET` in production `.env`.
     - **Active Events:** `payment.captured`, `order.paid`.
3. **Admin Password:**
   - Advise the client to change the default admin password and activate Google Authenticator 2FA in **Settings &rarr; 2FA**.

---

## 5. Automated Verification Execution

To re-run the automated security regression test suite against your running server (`localhost:3001` or production):

### On Linux / macOS / Git Bash:
```bash
chmod +x scripts/security-test.sh
./scripts/security-test.sh http://localhost:3001
```

### On Windows PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/security-test.ps1 -BaseUrl "http://localhost:3001"
```
