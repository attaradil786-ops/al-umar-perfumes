/**
 * WhatsApp Cloud API Integration for Al Umar Perfumes
 * Sends transactional order notifications via Meta Business Manager Templates.
 */

export type WhatsAppTemplateName =
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered';

export interface SendTemplateOptions {
  to: string;
  templateName: WhatsAppTemplateName;
  parameters: {
    customer_name: string;
    order_number: string;
    total?: string | number;
    awb?: string;
    tracking_url?: string;
  };
  languageCode?: string;
}

/**
 * Standardize recipient phone number to E.164 without leading plus.
 * E.g., "+91 98765 43210" or "9876543210" -> "919876543210"
 */
export function formatPhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    // Standard Indian 10-digit mobile number
    return `91${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Sends a pre-approved WhatsApp message template via Meta Graph API
 */
export async function sendTemplate({
  to,
  templateName,
  parameters,
  languageCode = 'en',
}: SendTemplateOptions) {
  const formattedPhone = formatPhoneNumber(to);
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;

  // Build body parameters according to Meta WhatsApp Cloud API specifications
  const bodyParams: Array<{ type: 'text'; text: string }> = [];

  switch (templateName) {
    case 'order_confirmed':
      bodyParams.push(
        { type: 'text', text: String(parameters.customer_name || 'Valued Patron') },
        { type: 'text', text: String(parameters.order_number || '') },
        {
          type: 'text',
          text: parameters.total != null ? `₹${Number(parameters.total).toLocaleString('en-IN')}` : '0',
        }
      );
      break;

    case 'order_shipped':
      bodyParams.push(
        { type: 'text', text: String(parameters.customer_name || 'Valued Patron') },
        { type: 'text', text: String(parameters.order_number || '') },
        { type: 'text', text: String(parameters.awb || 'In Transit') },
        { type: 'text', text: String(parameters.tracking_url || 'https://alumarperfumes.com') }
      );
      break;

    case 'order_delivered':
      bodyParams.push(
        { type: 'text', text: String(parameters.customer_name || 'Valued Patron') },
        { type: 'text', text: String(parameters.order_number || '') }
      );
      break;
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: [
        {
          type: 'body',
          parameters: bodyParams,
        },
      ],
    },
  };

  console.log(`[WhatsApp Cloud API] Dispatching template "${templateName}" to ${formattedPhone}`);
  console.log('[WhatsApp Cloud API] Request Payload:', JSON.stringify(payload, null, 2));

  // If live credentials are not configured, simulate and log mock response
  const isConfigured =
    phoneNumberId &&
    accessToken &&
    !phoneNumberId.includes('placeholder') &&
    !accessToken.includes('placeholder');

  if (!isConfigured) {
    const mockResponse = {
      messaging_product: 'whatsapp',
      contacts: [{ input: formattedPhone, wa_id: formattedPhone }],
      messages: [{ id: `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}` }],
    };
    console.log('[WhatsApp Cloud API] (Simulation Mode) Live tokens not present. Response:', JSON.stringify(mockResponse, null, 2));
    return {
      success: true,
      mock: true,
      response: mockResponse,
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    console.log('[WhatsApp Cloud API] Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('[WhatsApp Cloud API] Error Response:', data);
      return { success: false, error: data };
    }

    return { success: true, response: data };
  } catch (err) {
    console.error('[WhatsApp Cloud API] Exception:', err);
    return { success: false, error: err };
  }
}
