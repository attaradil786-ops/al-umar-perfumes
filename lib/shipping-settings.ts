import prisma from '@/lib/prisma';

export interface ShippingSettings {
  shipping_mode: 'live_rates' | 'flat';
  flat_rate: number;
  free_above: number;
  cod_enabled: boolean;
  cod_fee: number;
  auto_ship_on_payment: boolean;
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  shipping_mode: 'flat',
  flat_rate: 79,
  free_above: 1500,
  cod_enabled: true,
  cod_fee: 0,
  auto_ship_on_payment: false,
};

const SETTINGS_KEY = 'shipping_configuration';

/**
 * Fetch active shipping configuration from SiteContent table with reliable fallbacks.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const record = await prisma.siteContent.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (!record || !record.value) {
      return { ...DEFAULT_SHIPPING_SETTINGS };
    }

    const parsed = JSON.parse(record.value);
    return {
      shipping_mode: parsed.shipping_mode === 'live_rates' ? 'live_rates' : 'flat',
      flat_rate: Number.isFinite(parsed.flat_rate) ? Number(parsed.flat_rate) : DEFAULT_SHIPPING_SETTINGS.flat_rate,
      free_above: Number.isFinite(parsed.free_above) ? Number(parsed.free_above) : DEFAULT_SHIPPING_SETTINGS.free_above,
      cod_enabled: typeof parsed.cod_enabled === 'boolean' ? parsed.cod_enabled : DEFAULT_SHIPPING_SETTINGS.cod_enabled,
      cod_fee: Number.isFinite(parsed.cod_fee) ? Number(parsed.cod_fee) : DEFAULT_SHIPPING_SETTINGS.cod_fee,
      auto_ship_on_payment: typeof parsed.auto_ship_on_payment === 'boolean' ? parsed.auto_ship_on_payment : DEFAULT_SHIPPING_SETTINGS.auto_ship_on_payment,
    };
  } catch (err) {
    console.error('[Shipping Settings] Error fetching settings from DB:', err);
    return { ...DEFAULT_SHIPPING_SETTINGS };
  }
}

/**
 * Persist updated shipping configuration to SiteContent table.
 */
export async function saveShippingSettings(settings: Partial<ShippingSettings>): Promise<ShippingSettings> {
  const current = await getShippingSettings();
  const merged: ShippingSettings = {
    ...current,
    ...settings,
  };

  await prisma.siteContent.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: SETTINGS_KEY, value: JSON.stringify(merged) },
  });

  return merged;
}
