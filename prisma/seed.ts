import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Al Umar database seed...');

  // 1. Read products from js/products.js in existing project
  const productsJsPath = path.resolve(__dirname, '../../js/products.js');
  if (!fs.existsSync(productsJsPath)) {
    throw new Error(`Products file not found at ${productsJsPath}`);
  }

  const rawJs = fs.readFileSync(productsJsPath, 'utf-8');
  const startIdx = rawJs.indexOf('[');
  const endIdx = rawJs.indexOf('];');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Failed to locate AL_UMAR_PRODUCTS array in js/products.js');
  }

  const jsonStr = rawJs.substring(startIdx, endIdx + 1);
  const rawProducts: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    rating?: number;
    reviews_count?: number;
    stock?: number;
    options?: string[];
  }> = JSON.parse(jsonStr);

  console.log(`📦 Found ${rawProducts.length} products to seed.`);

  // Upsert products
  for (let i = 0; i < rawProducts.length; i++) {
    const p = rawProducts[i];
    const slug = p.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        mrp: Math.round(p.price * 1.25),
        stock: p.stock ?? 25,
        images: [p.image_url],
        rating: p.rating ?? 4.8,
        reviewsCount: p.reviews_count ?? 45,
        isActive: true,
        isBestSeller: (p.rating ?? 0) >= 4.7,
        isNewArrival: i >= rawProducts.length - 8,
        taxRate: 18,
        hsnCode: '3303',
      },
      create: {
        id: p.id,
        slug,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        mrp: Math.round(p.price * 1.25),
        stock: p.stock ?? 25,
        images: [p.image_url],
        rating: p.rating ?? 4.8,
        reviewsCount: p.reviews_count ?? 45,
        isActive: true,
        isBestSeller: (p.rating ?? 0) >= 4.7,
        isNewArrival: i >= rawProducts.length - 8,
        taxRate: 18,
        hsnCode: '3303',
      },
    });
  }
  console.log(`✅ Seeded ${rawProducts.length} products into Product table.`);

  // 2. Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@alumarperfumes.com';
  const adminPasswordHash =
    process.env.ADMIN_PASSWORD_HASH ||
    '$2b$10$Ktknf/yoygo0kZDkTUi9p.AYTMGsMpP2cHE8RGN85Ag7Cm00kVZhC';

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPasswordHash,
    },
    create: {
      email: adminEmail,
      password: adminPasswordHash,
      totpEnabled: false,
    },
  });
  console.log(`✅ Seeded Admin user: ${admin.email}`);

  // 3. SiteContent rows
  const siteContents = [
    { key: 'contact_phone', value: '+91 98765 43210' },
    { key: 'contact_whatsapp', value: '+91 98765 43210' },
    { key: 'contact_email', value: 'wholesale@umarperfumes.com' },
    { key: 'contact_hours', value: 'Mon - Sat: 10:00 AM - 8:00 PM IST' },
    {
      key: 'announcement_bar',
      value: 'Welcome to our store • Free Shipping Across India on Orders Above ₹1500',
    },
    { key: 'hero_title', value: 'Pure & Natural Essential Oils' },
    {
      key: 'hero_subtitle',
      value:
        'Experience the power of nature with our premium botanical essential oils. Carefully sourced and crafted to bring purity, relaxation and wellness.',
    },
    {
      key: 'footer_mission',
      value:
        'Curating the finest oriental fragrances, pure Cambodian Oud oil, Taif rose extracts, and inspiring Islamic texts to enrich your spiritual lifestyle.',
    },
    {
      key: 'shipping_policy',
      value:
        'All orders are processed and dispatched within 24 to 48 hours from our Mumbai atelier. Standard domestic delivery across India takes 3 to 5 business days via BlueDart, DTDC, and Delhivery. Free shipping applies on all orders above ₹1500.',
    },
    {
      key: 'return_policy',
      value:
        'We accept returns for damaged, defective, or incorrect items within 7 days of package delivery. Order Cancellation: You can cancel before shipment for a 100% full refund credited within 24-48 hours. After shipment, orders cannot be cancelled in transit but can be returned within 7 days of delivery. Due to cosmetic hygiene standards, opened perfume oil bottles cannot be returned unless transit damage has occurred. Refunds are credited within 5 to 7 business days following inspection.',
    },
    {
      key: 'cancellation_policy',
      value:
        'Orders may be cancelled prior to dispatch for an immediate 100% full refund credited back to your original payment method within 24-48 hours. Once handed over to courier partners with an active tracking AWB, cancellations cannot be made in transit; you may initiate a return within 7 days of delivery.',
    },
    {
      key: 'privacy_policy',
      value:
        'Compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act, India). We collect essential identity, contact, and delivery details solely for order fulfillment and statutory tax compliance. We use essential session and analytical cookies to maintain shopping cart states and monitor site performance. We share necessary details strictly with authorized processors: Razorpay (encrypted payment processing), Shiprocket & Courier Partners (door-to-door transit), Google Analytics 4 (aggregated site performance), and Meta Pixel (conversion optimization). Transactional records are retained for 7 years as mandated by GST regulations. You have the right to access, rectify, or request deletion of your personal data under DPDP Act 2023. Contact our Data Protection Officer at wholesale@umarperfumes.com.',
    },
    {
      key: 'terms_of_service',
      value:
        'By browsing and purchasing from Al Umar Perfumes, you agree to our terms of service, artisanal botanical variation disclosure, and domestic delivery protocols. All prices are in INR and include 18% GST (HSN 3303). Orders are confirmed upon successful Razorpay verification. All brand calligraphy, logos, and descriptions are protected intellectual property. Governed by the laws of India with exclusive jurisdiction in Mumbai, Maharashtra.',
    },
    { key: 'gstin', value: '27ABCDE1234F1Z5' },
  ];

  for (const item of siteContents) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: { key: item.key, value: item.value },
    });
  }
  console.log(`✅ Seeded ${siteContents.length} SiteContent rows.`);

  // 4. Coupons
  const sampleCoupons = [
    { code: 'WELCOME10', type: 'PERCENTAGE', value: 10, minOrder: 500 },
    { code: 'FLAT100', type: 'FLAT', value: 100, minOrder: 1000 },
    { code: 'OUDLOVER', type: 'PERCENTAGE', value: 15, minOrder: 2000 },
  ];

  for (const coupon of sampleCoupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
        isActive: true,
      },
      create: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
        isActive: true,
      },
    });
  }
  console.log(`✅ Seeded ${sampleCoupons.length} promotional coupons.`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
