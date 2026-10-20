'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
import { AddressFormSchema } from '@/lib/validators';
import { validateCart } from '@/lib/cart';
import { trackBeginCheckout } from '@/lib/analytics';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, clearCart, setCart, removeFromCart, updateQuantity } = useCart();

  // Address form fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    message: string;
    minOrder: number;
    type?: string;
    value?: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Shipping & Logistics states
  const [paymentMethod, setPaymentMethod] = useState<'PREPAID' | 'COD'>('PREPAID');
  const [shippingSettings, setShippingSettings] = useState<{
    shipping_mode: string;
    flat_rate: number;
    free_above: number;
    cod_enabled: boolean;
    cod_fee: number;
  }>({
    shipping_mode: 'live_rates',
    flat_rate: 79,
    free_above: 1500,
    cod_enabled: true,
    cod_fee: 0,
  });

  const [serviceability, setServiceability] = useState<{
    serviceable: boolean;
    rate: number;
    estimatedDeliveryDays?: number;
    courierName?: string;
    cod?: boolean;
  } | null>(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [serviceabilityMessage, setServiceabilityMessage] = useState('');

  // Calculate cart weight in KG (default 0.5kg per item)
  const totalWeight = Math.max(0.5, cart.reduce((acc, item) => acc + (0.5 * item.quantity), 0));

  // Load Shipping Settings from Server on mount
  useEffect(() => {
    fetch('/api/admin/settings/shipping')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.settings) {
          setShippingSettings(res.settings);
        }
      })
      .catch(() => {
        // Fall back to default settings
      });
  }, []);

  // Live Shiprocket serviceability check on 6-digit PIN code
  useEffect(() => {
    const pin = formData.pincode.trim();
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setServiceability(null);
      setServiceabilityMessage('');
      return;
    }

    let active = true;
    setCheckingServiceability(true);
    setServiceabilityMessage('');

    const isCod = paymentMethod === 'COD' ? 1 : 0;
    fetch(`/api/shipping/check-serviceability?pincode=${pin}&weight=${totalWeight}&declaredValue=${subtotal}&cod=${isCod}`)
      .then(r => r.json())
      .then(data => {
        if (!active) return;
        if (data.serviceable) {
          setServiceability({
            serviceable: true,
            rate: Number(data.rate) || shippingSettings.flat_rate || 79,
            estimatedDeliveryDays: data.estimatedDeliveryDays,
            courierName: data.courierName,
            cod: Boolean(data.cod),
          });
          setServiceabilityMessage(`✓ Deliverable via ${data.courierName || 'Shiprocket'} in ~${data.estimatedDeliveryDays || '2-4'} days`);
        } else {
          setServiceability({
            serviceable: false,
            rate: shippingSettings.flat_rate || 79,
          });
          setServiceabilityMessage(data.error || 'Delivery not available to this PIN code via Shiprocket.');
        }
      })
      .catch(() => {
        if (!active) return;
        setServiceability({ serviceable: true, rate: shippingSettings.flat_rate || 79 });
        setServiceabilityMessage('Using standard delivery rate.');
      })
      .finally(() => {
        if (active) setCheckingServiceability(false);
      });

    return () => {
      active = false;
    };
  }, [formData.pincode, totalWeight, subtotal, paymentMethod, shippingSettings.flat_rate]);

  // Automatically remove coupon if subtotal falls below minOrder, or dynamically recalculate percentage discount
  useEffect(() => {
    if (appliedCoupon) {
      if (appliedCoupon.minOrder > 0 && subtotal < appliedCoupon.minOrder) {
        const removedCode = appliedCoupon.code;
        const requiredMin = appliedCoupon.minOrder;
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError(
          `Coupon "${removedCode}" was automatically removed because your cart total (₹${subtotal.toLocaleString('en-IN')}) is below the required minimum of ₹${requiredMin.toLocaleString('en-IN')}.`
        );
      } else if (subtotal >= (appliedCoupon.minOrder || 0)) {
        const typeUpper = (appliedCoupon.type || '').toUpperCase();
        let dynamicDiscount = appliedCoupon.discount;
        if (typeUpper === 'PERCENTAGE' || typeUpper === 'PERCENT') {
          const pct = Math.min(100, Math.max(0, appliedCoupon.value || 0));
          dynamicDiscount = Math.min(subtotal, Math.round((subtotal * pct) / 100));
        } else if (typeUpper === 'FREE_SHIPPING' || typeUpper === 'FREESHIPPING') {
          dynamicDiscount = subtotal >= (shippingSettings.free_above || 1500) ? 0 : 79;
        } else {
          dynamicDiscount = Math.min(appliedCoupon.value || 0, subtotal);
        }
        if (dynamicDiscount !== appliedCoupon.discount) {
          setAppliedCoupon(prev => prev ? { ...prev, discount: dynamicDiscount } : null);
        }
      }
    }
  }, [subtotal, appliedCoupon, shippingSettings.free_above]);

  // Validate cart against server on mount & track begin_checkout
  useEffect(() => {
    if (cart.length > 0) {
      validateCart(cart).then(res => {
        if (res.warnings && res.warnings.length > 0) {
          setStockWarnings(res.warnings);
          if (res.items) {
            setCart(res.items as any);
          }
        }
      });

      try {
        trackBeginCheckout(
          cart.map(c => ({
            id: c.id,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
            category: c.category,
            size: c.size,
          })),
          subtotal
        );
      } catch {
        // ignore analytics error
      }
    }
  }, []);

  // Shipping calculation: Free above threshold, else live rates or flat rate
  const freeAbove = shippingSettings.free_above || 1500;
  const isFreeShipping = subtotal >= freeAbove || appliedCoupon?.type === 'FREE_SHIPPING';
  const shipping = isFreeShipping || cart.length === 0
    ? 0
    : (serviceability?.rate !== undefined ? serviceability.rate : (shippingSettings.flat_rate || 79));

  const codFee = (paymentMethod === 'COD' && shippingSettings.cod_enabled) ? (shippingSettings.cod_fee || 0) : 0;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, subtotal - discount + shipping + codFee);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal,
          phone: formData.phone,
          email: formData.email,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.code,
          discount: data.discount,
          message: data.message,
          minOrder: data.minOrder || 0,
          type: data.type,
          value: data.value,
        });
        setCouponError('');
      } else {
        setCouponError(data.error || 'Invalid or expired coupon code');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Network error checking coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (cart.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    // Step 1: Validate address with Zod
    const validation = AddressFormSchema.safeParse(formData);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        if (path) errMap[path] = issue.message;
      });
      setFormErrors(errMap);
      setCheckoutError('Please correct the address form errors before proceeding.');
      return;
    }

    // Step 2: Block checkout if pincode is explicitly unserviceable
    if (serviceability && !serviceability.serviceable) {
      setCheckoutError('Cannot proceed: The destination PIN code is not serviceable for shipping. Please enter a serviceable delivery PIN code.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 3: POST to /api/checkout/create-order
      const createOrderRes = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          paymentMethod: paymentMethod, // 'PREPAID' | 'COD'
          items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
          })),
          couponCode: appliedCoupon?.code,
        }),
      });

      const orderData = await createOrderRes.json();

      if (!createOrderRes.ok || !orderData.success) {
        setCheckoutError(orderData.error || 'Failed to initialize order.');
        setIsSubmitting(false);
        return;
      }

      // If COD, order is confirmed immediately without gateway
      if (paymentMethod === 'COD') {
        clearCart();
        router.push(`/order-confirmation/${orderData.orderNumber}`);
        return;
      }

      const { razorpayOrderId, orderNumber, amount, currency, key } = orderData;

      // Helper function to verify payment with server
      const verifyPayment = async (paymentDetails: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verifyRes = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderNumber,
              razorpayPaymentId: paymentDetails.razorpay_payment_id,
              razorpayOrderId: paymentDetails.razorpay_order_id,
              razorpaySignature: paymentDetails.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.success) {
            clearCart();
            router.push(`/order-confirmation/${verifyData.orderNumber}`);
          } else {
            setCheckoutError(verifyData.error || 'Payment verification failed.');
            setIsSubmitting(false);
          }
        } catch {
          setCheckoutError('Network error during payment verification.');
          setIsSubmitting(false);
        }
      };

      // Check if Razorpay script is ready
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: key || 'rzp_test_placeholderKeyId',
          amount: amount,
          currency: currency || 'INR',
          name: 'Al Umar Perfumes',
          description: 'Pure Attars, Cambodian Oud & Islamic Heritage',
          image: '/images/cat-oud.jpg',
          order_id: razorpayOrderId,
          handler: async function (response: any) {
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
              razorpay_signature: response.razorpay_signature || 'simulated_sig',
            });
          },
          prefill: {
            name: formData.name,
            contact: formData.phone,
            email: formData.email || '',
          },
          theme: {
            color: '#1E6B5C',
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setCheckoutError(resp.error?.description || 'Payment was declined or failed.');
          setIsSubmitting(false);
        });
        rzp.open();
      } else {
        // Fallback if Razorpay SDK failed to load from CDN (e.g. offline testing)
        console.warn('Razorpay SDK not loaded in browser, simulating test payment verification');
        await verifyPayment({
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: 'test_signature',
        });
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main className="container-narrow section-padding" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧴</div>
        <h1 className="section-title">Your Cart is Empty</h1>
        <p style={{ color: '#7A5B37', marginBottom: '2rem' }}>
          Explore our rare Cambodian Oud, sweet Taif rose extracts, and inspiring literature.
        </p>
        <Link href="/collections" className="btn-primary">
          Browse Collections
        </Link>
      </main>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <main className="container section-padding">
        <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '2rem' }}>
          Secure Checkout
        </h1>

        {stockWarnings.length > 0 && (
          <div style={{ padding: '1rem', background: '#fff3cd', color: '#856404', borderRadius: '8px', border: '1px solid #ffeeba', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <strong>Notice:</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
              {stockWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {checkoutError && (
          <div style={{ padding: '1rem', background: '#f8d7da', color: '#721c24', borderRadius: '8px', border: '1px solid #f5c6cb', marginBottom: '2rem', fontSize: '0.9rem' }}>
            ✕ {checkoutError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
          {/* STEP 1: Address Form */}
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E8DCC8' }}>
              1. Delivery Address
            </h2>

            <form onSubmit={handlePayNow} id="checkout-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#553E23', marginBottom: '0.3rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Adil Attar"
                  required
                  style={{ width: '100%', padding: '0.75rem', border: `1px solid ${formErrors.name ? '#dc3545' : '#D1C8BA'}`, borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                />
                {formErrors.name && <span style={{ color: '#dc3545', fontSize: '0.75rem', display: 'block', marginTop: '0.2rem' }}>{formErrors.name}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#553E23', marginBottom: '0.3rem' }}>
                    Phone Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    required
                    style={{ width: '100%', padding: '0.75rem', border: `1px solid ${formErrors.phone ? '#dc3545' : '#D1C8BA'}`, borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                  />
                  {formErrors.phone && <span style={{ color: '#dc3545', fontSize: '0.75rem', display: 'block', marginTop: '0.2rem' }}>{formErrors.phone}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#553E23', marginBottom: '0.3rem' }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    style={{ width: '100%', padding: '0.75rem', border: `1px solid ${formErrors.email ? '#dc3545' : '#D1C8BA'}`, borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                  />
                  {formErrors.email && <span style={{ color: '#dc3545', fontSize: '0.75rem', display: 'block', marginTop: '0.2rem' }}>{formErrors.email}</span>}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#553E23', marginBottom: '0.3rem' }}>
                  Street Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Flat/House No., Building, Street Area"
                  required
                  style={{ width: '100%', padding: '0.75rem', border: `1px solid ${formErrors.address ? '#dc3545' : '#D1C8BA'}`, borderRadius: '8px', outline: 'none', fontFamily: 'inherit', resize: 'none' }}
                />
                {formErrors.address && <span style={{ color: '#dc3545', fontSize: '0.75rem', display: 'block', marginTop: '0.2rem' }}>{formErrors.address}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#553E23', marginBottom: '0.3rem' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Mumbai"
                    required
                    style={{ width: '100%', padding: '0.75rem', border: `1px solid ${formErrors.city ? '#dc3545' : '#D1C8BA'}`, borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                  />
                  {formErrors.city && <span style={{ color: '#dc3545', fontSize: '0.75rem', display: 'block', marginTop: '0.2rem' }}>{formErrors.city}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#553E23', marginBottom: '0.3rem' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Maharashtra"
                    required
                    style={{ width: '100%', padding: '0.75rem', border: `1px solid ${formErrors.state ? '#dc3545' : '#D1C8BA'}`, borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                  />
                  {formErrors.state && <span style={{ color: '#dc3545', fontSize: '0.75rem', display: 'block', marginTop: '0.2rem' }}>{formErrors.state}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#553E23', marginBottom: '0.3rem' }}>
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="400001"
                    maxLength={6}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: `1px solid ${formErrors.pincode ? '#dc3545' : '#D1C8BA'}`, borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                  />
                  {formErrors.pincode && <span style={{ color: '#dc3545', fontSize: '0.75rem', display: 'block', marginTop: '0.2rem' }}>{formErrors.pincode}</span>}
                </div>
              </div>

              {/* Live Shiprocket Serviceability Indicator */}
              {checkingServiceability && (
                <div style={{ padding: '0.6rem 0.9rem', background: '#FFF8EC', border: '1px solid #E8DCC8', borderRadius: '8px', fontSize: '0.8rem', color: '#7A5B37', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⏳</span> Checking Shiprocket courier delivery serviceability...
                </div>
              )}
              {!checkingServiceability && serviceabilityMessage && (
                <div
                  style={{
                    padding: '0.6rem 0.9rem',
                    background: serviceability?.serviceable ? '#e6f4ea' : '#fce8e6',
                    border: `1px solid ${serviceability?.serviceable ? '#ceead6' : '#fad2cf'}`,
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: serviceability?.serviceable ? '#137333' : '#c5221f',
                    fontWeight: 500,
                  }}
                >
                  {serviceability?.serviceable ? '✓ ' : '✕ '}
                  {serviceabilityMessage}
                </div>
              )}

              {/* STEP 2: Payment Method Selector */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E8DCC8' }}>
                <h3 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                  Select Payment Method
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Prepaid Razorpay Option */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: `1.5px solid ${paymentMethod === 'PREPAID' ? '#1E6B5C' : '#E8DCC8'}`,
                      background: paymentMethod === 'PREPAID' ? '#F2FAF7' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="PREPAID"
                      checked={paymentMethod === 'PREPAID'}
                      onChange={() => setPaymentMethod('PREPAID')}
                      style={{ accentColor: '#1E6B5C', width: '16px', height: '16px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#121212', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Online Payment (UPI, Cards, NetBanking)</span>
                        <span style={{ fontSize: '0.7rem', background: '#1E6B5C', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          RECOMMENDED
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#7A5B37', marginTop: '0.15rem' }}>
                        Instant verification via Razorpay • 100% Secure &amp; Fast Dispatch
                      </div>
                    </div>
                  </label>

                  {/* Cash on Delivery Option */}
                  {shippingSettings.cod_enabled && (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${paymentMethod === 'COD' ? '#1E6B5C' : '#E8DCC8'}`,
                        background: paymentMethod === 'COD' ? '#F2FAF7' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        style={{ accentColor: '#1E6B5C', width: '16px', height: '16px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#121212', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>Cash on Delivery (COD)</span>
                          {shippingSettings.cod_fee > 0 && (
                            <span style={{ fontSize: '0.7rem', background: '#FFF8EC', border: '1px solid #E8DCC8', color: '#553E23', padding: '1px 6px', borderRadius: '4px' }}>
                              +₹{shippingSettings.cod_fee} Fee
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#7A5B37', marginTop: '0.15rem' }}>
                          Pay with cash or UPI QR directly to the courier executive upon delivery
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* STEP 2: Order Summary + Coupon */}
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E8DCC8' }}>
              2. Order Summary
            </h2>

            {/* Items list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '240px', overflowY: 'auto' }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px dashed #E8DCC8' }}>
                  <img
                    src={item.image_url || (item as any).image}
                    alt={item.name}
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', background: '#F8F4EC' }}
                    onError={e => {
                      (e.target as HTMLImageElement).src = '/images/hero-perfume.jpg';
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#121212', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#7A5B37', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      {item.size ? <span>Size: {item.size}</span> : null}
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #D1C8BA', borderRadius: '4px', overflow: 'hidden' }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1, item.size)}
                          style={{ padding: '0 5px', fontSize: '11px', background: '#FFF8EC', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                          title="Decrease"
                        >
                          −
                        </button>
                        <span style={{ padding: '0 6px', fontSize: '11px', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1, item.size)}
                          style={{ padding: '0 5px', fontSize: '11px', background: '#FFF8EC', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                          title="Increase"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.size)}
                        style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline', padding: '0 2px' }}
                        title="Remove item from checkout"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#553E23', whiteSpace: 'nowrap' }}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <div style={{ marginBottom: '1.5rem', paddingTop: '0.5rem' }}>
              {appliedCoupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e6f4ea', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #ceead6' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#137333', fontSize: '0.85rem' }}>
                      🎟 {appliedCoupon.code} applied!
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#137333', marginLeft: '0.5rem' }}>
                      (-₹{appliedCoupon.discount})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{ background: 'none', border: 'none', color: '#dc3545', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon (e.g. WELCOME10)"
                    style={{ flex: 1, padding: '0.6rem', border: '1px solid #D1C8BA', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', fontFamily: 'inherit' }}
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                  >
                    {couponLoading ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              )}
              {couponError && (
                <div style={{ color: '#dc3545', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  {couponError}
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#7A5B37', marginTop: '0.3rem' }}>
                Try promo code <strong>WELCOME10</strong> (10% off) or <strong>FLAT100</strong>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid #E8DCC8', paddingTop: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#553E23' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1E6B5C', fontWeight: 600 }}>
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#553E23' }}>
                <span>Shiprocket Express Delivery</span>
                <span>
                  {shipping === 0 ? (
                    <strong style={{ color: '#1E6B5C' }}>FREE (Orders &gt; ₹{freeAbove})</strong>
                  ) : (
                    `₹${shipping}`
                  )}
                </span>
              </div>

              {paymentMethod === 'COD' && codFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#553E23' }}>
                  <span>Cash on Delivery Fee</span>
                  <span>₹{codFee}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: '#1E6B5C', borderTop: '1px solid #E8DCC8', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <span>Total Amount</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* STEP 3: Submit / Place Order Button */}
            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || (Boolean(serviceability) && !serviceability?.serviceable)}
                className="btn-green"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.05rem',
                  textAlign: 'center',
                  opacity: (isSubmitting || (Boolean(serviceability) && !serviceability?.serviceable)) ? 0.6 : 1,
                  cursor: (isSubmitting || (Boolean(serviceability) && !serviceability?.serviceable)) ? 'not-allowed' : 'pointer',
                  background: paymentMethod === 'COD' ? '#553E23' : undefined,
                }}
              >
                {isSubmitting
                  ? (paymentMethod === 'COD' ? 'Placing Order...' : 'Processing Payment...')
                  : (serviceability && !serviceability.serviceable)
                  ? 'PIN Code Not Serviceable'
                  : paymentMethod === 'COD'
                  ? `Confirm Order (Cash on Delivery) • ₹${finalTotal.toLocaleString('en-IN')} →`
                  : `Pay ₹${finalTotal.toLocaleString('en-IN')} with Razorpay →`}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: '#7A5B37' }}>
                {paymentMethod === 'COD'
                  ? '📦 Pay upon delivery • Inspect tamper-evident seal before receiving'
                  : '🔒 256-bit Encrypted Checkout • Cards, UPI, NetBanking & Wallets'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
