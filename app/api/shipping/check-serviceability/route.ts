import { NextRequest, NextResponse } from 'next/server';
import { getServiceability } from '@/lib/shiprocket';
import { getShippingSettings } from '@/lib/shipping-settings';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pincode, weight = 0.5, cod = false, subtotal = 0 } = body;

    if (!pincode || typeof pincode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid pincode is required.' },
        { status: 400 }
      );
    }

    const cleanPincode = pincode.replace(/\D/g, '').trim();
    if (cleanPincode.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Pincode must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    const settings = await getShippingSettings();
    const isFreeEligible = Number(subtotal) >= settings.free_above;

    // Call Shiprocket serviceability
    const result = await getServiceability(
      cleanPincode,
      Number(weight) || 0.5,
      Boolean(cod),
      Number(subtotal) || 500
    );

    if (!result.serviceable) {
      return NextResponse.json({
        success: true,
        serviceable: false,
        error: result.error || 'Delivery is currently unserviceable to this pincode.',
        codEnabled: settings.cod_enabled,
      });
    }

    let calculatedShipping = settings.flat_rate;
    if (isFreeEligible) {
      calculatedShipping = 0;
    } else if (settings.shipping_mode === 'live_rates') {
      calculatedShipping = result.rate || settings.flat_rate;
    }

    return NextResponse.json({
      success: true,
      serviceable: true,
      shippingCharge: calculatedShipping,
      estimatedDeliveryDays: result.estimatedDeliveryDays,
      courierName: result.courierName,
      freeShipping: isFreeEligible,
      freeAbove: settings.free_above,
      shippingMode: settings.shipping_mode,
      codEnabled: settings.cod_enabled,
      codFee: settings.cod_fee,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error checking serviceability';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
