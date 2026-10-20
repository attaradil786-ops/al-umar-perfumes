import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import Razorpay from 'razorpay';
import { authenticate, getServiceability } from '../lib/shiprocket';

async function testLiveCredentials() {
  console.log('====================================================');
  console.log('🔍 TESTING LIVE CREDENTIALS (RAZORPAY & SHIPROCKET)');
  console.log('====================================================\n');

  // 1. TEST RAZORPAY
  console.log('1️⃣ Testing Razorpay Test Credentials...');
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  console.log(`   Key ID: ${keyId}`);

  try {
    const razorpay = new Razorpay({
      key_id: keyId || '',
      key_secret: keySecret || '',
    });

    const order = await razorpay.orders.create({
      amount: 50000, // 500 INR in paise
      currency: 'INR',
      receipt: `test_rcpt_${Date.now()}`,
      notes: { test: 'live_test' },
    });

    console.log('   ✅ Razorpay Order Created Successfully!');
    console.log(`      Order ID: ${order.id}`);
    console.log(`      Amount: ₹${Number(order.amount) / 100} ${order.currency}`);
    console.log(`      Status: ${order.status}\n`);
  } catch (err: any) {
    console.error('   ❌ Razorpay Error:', err?.error?.description || err?.message || err);
    console.log('');
  }

  // 2. TEST SHIPROCKET AUTHENTICATION
  console.log('2️⃣ Testing Shiprocket Authentication API...');
  const srEmail = process.env.SHIPROCKET_EMAIL;
  console.log(`   Email: ${srEmail}`);
  console.log(`   Pickup PIN: ${process.env.SHIPROCKET_PICKUP_PINCODE || '400001'}`);

  try {
    const token = await authenticate();
    if (token) {
      console.log('   ✅ Shiprocket Login Successful!');
      console.log(`      Token: ${token.substring(0, 20)}...`);
    } else {
      console.log('   ❌ No token returned');
    }
  } catch (err: any) {
    console.error('   ❌ Shiprocket Authentication Error:', err?.message || err);
  }

  // 3. TEST SHIPROCKET SERVICEABILITY
  console.log('\n3️⃣ Testing Shiprocket Courier Serviceability...');
  try {
    const serviceability = await getServiceability('110001', 0.5, false, 999);
    console.log('   Serviceability check for PIN 110001 (New Delhi):');
    console.log(`   Serviceable: ${serviceability.serviceable}`);
    console.log(`   Cheapest Rate: ₹${serviceability.rate}`);
    console.log(`   Estimated Delivery Days: ${serviceability.estimatedDeliveryDays}`);
    console.log(`   Courier Partner: ${serviceability.courierName || 'Auto-assigned'}`);
    console.log('   ✅ Serviceability check completed successfully!\n');
  } catch (err: any) {
    console.error('   ❌ Serviceability check error:', err?.message || err);
    console.log('');
  }

  // 4. TEST CHECKOUT ORDER API (LIVE ENDPOINT)
  console.log('4️⃣ Testing Next.js Checkout Order API (/api/checkout/create-order)...');
  try {
    const res = await fetch('http://localhost:3001/api/checkout/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Live Test Customer',
        phone: '9876543210',
        email: 'customer@alumarperfumes.com',
        address: 'Flat 4B, Emerald Residency',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        paymentMethod: 'PREPAID',
        items: [
          {
            productId: 'attar-1',
            name: 'Royal Dehn Al Oud',
            price: 2450,
            quantity: 1,
            size: '3ml',
          },
        ],
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      console.log('   ✅ Checkout Order Endpoint Verified!');
      console.log(`      Order Number: ${data.orderNumber}`);
      console.log(`      Razorpay Order ID: ${data.razorpayOrderId}`);
      console.log(`      Key Used: ${data.key}`);
      console.log(`      Amount: ₹${data.amount / 100} ${data.currency}`);
    } else {
      console.error('   ❌ Checkout API returned error:', data.error);
    }
  } catch (err: any) {
    console.error('   ❌ Checkout API request failed:', err?.message || err);
  }

  console.log('\n====================================================');
  console.log('🏁 CREDENTIALS & INTEGRATION VERIFICATION COMPLETE');
  console.log('====================================================');
}

testLiveCredentials();
