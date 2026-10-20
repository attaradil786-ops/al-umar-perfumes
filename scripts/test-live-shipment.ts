import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createShipment } from '../lib/shiprocket';

async function testLiveShipment() {
  console.log('Testing Live Shiprocket Order Creation...');
  try {
    const res = await createShipment({
      id: `test-order-${Date.now()}`,
      orderNumber: `TEST-LIVE-${Date.now()}`,
      customerName: 'Adil Attar',
      phone: '9876543210',
      email: 'alumar8080@gmail.com',
      address: 'Shop 12, Market Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      subtotal: 1200,
      shipping: 79,
      total: 1279,
      paymentMethod: 'PREPAID',
      items: [
        {
          id: 'item-1',
          name: 'Royal Cambodian Oud 6ml',
          price: 1200,
          quantity: 1,
          size: '6ml',
          sku: 'OUD-CAM-6ML',
        },
      ],
    });

    console.log('✅ Shiprocket Live Order & AWB Result:', res);
  } catch (err: any) {
    console.error('❌ Shiprocket Live Order Error:', err.message);
  }
}

testLiveShipment();
