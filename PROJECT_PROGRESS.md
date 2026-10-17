# Al Umar Perfumes — Project State & Progress Summary

**Last Saved:** 2026-10-16  
**Status:** All tasks fully implemented, tested, and validated with zero build errors (`next build` exiting with code 0).

---

## 1. System & Runtime Configuration

- **Next.js Dev Server**: Runs on port `3001` (`npm run dev -- -p 3001`) because port 3000 is occupied by another local service.
  - URL: `http://localhost:3001`
  - Base URL configured in `.env.local`: `NEXTAUTH_URL="http://localhost:3001"`
- **PostgreSQL Database**:
  - Native Windows PostgreSQL 18 instance running on port `5433`
  - Data directory: `c:\Users\abdul\Desktop\al-umers\al-umar-next\.pgdata`
  - Connection string: `postgresql://postgres:postgres@localhost:5433/alumar?schema=public`
  - Start command:
    ```powershell
    & "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "c:\Users\abdul\Desktop\al-umers\al-umar-next\.pgdata" -p 5433
    ```
- **Admin Portal**:
  - Route: `/studio-alumar-9f7x2k` (obfuscated base path)
  - Admin login: `admin@alumarperfumes.com` (or `attaradil786@gmail.com`)
  - Password: `Admin@AlUmar2026!`
  - TOTP 2FA: Supported and switchable in Settings

---

## 2. Completed Milestones

### Milestone A: Orders Management & Notifications
1. **Orders List (`{ADMIN_BASE_PATH}/orders/page.tsx`)**:
   - Table: Order # | Date | Customer | Phone | Items | Total | Payment | Status
   - Filters for status, payment, date range, and search.
2. **Order Detail (`{ADMIN_BASE_PATH}/orders/[id]/page.tsx`)**:
   - Customer details, items, financial breakdown, editable AWB tracking.
   - Status pipeline: `placed` → `confirmed` → `packed` → `shipped` → `delivered` / `cancelled`.
   - "Print Invoice" and "Print Packing Slip" PDF generation.
   - Razorpay refund integration (`/api/admin/orders/[id]/refund`).
3. **Email Templates**:
   - Resend React Email templates in `/lib/emails/` (`order-confirmation`, `order-shipped`, `order-delivered`, `order-cancelled`, `refund-processed`).

---

### Milestone B: Coupons, Offers, Content & Reviews

#### STEP 1 — Coupons CRUD
- **Page**: `{ADMIN_BASE_PATH}/coupons/page.tsx`
  - Interactive table: `Code | Type | Value | Min Order | Uses | Expiry | Active | Actions`
  - "Create Coupon" modal enforcing uppercase code format, coupon type (`PERCENTAGE`, `FLAT`, `FREE_SHIPPING`), discount value, minimum order value, optional maximum usage limit, expiration date picker, and active status.
  - In-place editing and soft-disable/delete via `isActive = false`.
- **API Routes**:
  - `/api/admin/coupons` (`GET`, `POST`)
  - `/api/admin/coupons/[id]` (`PATCH`, `DELETE` soft via `isActive=false`)

#### STEP 2 — Apply Coupon at Checkout
- **Validation**: `/api/coupons/validate`
  - Rejects inactive, expired, or max-usage reached coupons.
  - Rejects cart if `subtotal < minOrder`.
  - Calculates discounts:
    - `PERCENTAGE`: `subtotal * value / 100` (capped at 100%).
    - `FLAT`: `min(value, subtotal)`.
    - `FREE_SHIPPING`: discount equals the shipping fee.
- **Checkout Flow**:
  - `/api/checkout/create-order` verifies eligibility server-side.
  - `/api/checkout/verify` increments `usedCount` upon successful payment verification.

#### STEP 3 — Site-Wide Offers
- **Page**: `{ADMIN_BASE_PATH}/offers/page.tsx`
  - Full CRUD with placement options: `top_bar`, `hero`, `popup`.
- **Banner Engine**: `/components/OfferBanner.tsx`
  - Reads active offers from `/api/offers`.
  - `top_bar`: Automatically replaces announcement bar text.
  - `hero`: Overlays banner on homepage hero section.
  - `popup`: Modal dialog triggered once per user session.

#### STEP 4 — Content Manager
- **Page**: `{ADMIN_BASE_PATH}/content/page.tsx`
  - 5 Navigation Tabs: `Contact | Announcement | Homepage | Policies | Footer`.
  - **Tiptap Integration**: `/components/TiptapEditor.tsx` (`@tiptap/react` + `StarterKit`) used in Policies tab for editing `shipping_policy`, `return_policy`, `privacy_policy`, and `terms_policy` as HTML.
  - **Live Preview Panel**: Real-time right-hand preview panel reflecting tab content.
  - **Save Handler**: `PATCH /api/admin/content`.
  - Storefront policy pages updated to render rich HTML formatting.

#### STEP 5 — Reviews Moderation
- **Page**: `{ADMIN_BASE_PATH}/reviews/page.tsx`
  - `Pending` and `Approved` tabs with counter badges.
  - One-click `Approve`, `Reject`, and `Delete` actions.
  - Automatically recalculates product `rating` and `reviewsCount`.
- **Storefront & API**:
  - `POST /api/reviews` saves submissions with `isApproved: false` (pending moderation).
  - Public product page `/product/[slug]` displays strictly approved reviews.

---

## 3. Verified Test Suite
Run any time using:
```bash
npx tsx scratch/test-coupons-offers-content-reviews.ts
```
**Test Results:**
- Created coupon `EID20` (20% off min ₹1000).
- Applied on ₹1500 cart → discount confirmed at exactly **₹300**.
- Rejected cart under min order (< ₹1000).
- Order placed and verified → `usedCount` incremented from **0 to 1**.
- Site-wide offers returned via `/api/offers`.
- Content Manager HTML policies stored in `SiteContent`.
- Customer reviews submitted as pending (`isApproved: false`), approved by admin, and updated product average score.
- Production build validation (`next build`) succeeded with 23/23 routes compiled.

---

## 4. How to Resume Work

1. If computer restarted, ensure PostgreSQL is running:
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "c:\Users\abdul\Desktop\al-umers\al-umar-next\.pgdata" -p 5433
   ```
2. Start the Next.js development server:
   ```bash
   cd c:\Users\abdul\Desktop\al-umers\al-umar-next
   npm run dev -- -p 3001
   ```
3. Open browser:
   - Storefront: `http://localhost:3001`
   - Admin Portal: `http://localhost:3001/studio-alumar-9f7x2k`
