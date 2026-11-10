// SERVER ONLY. Safaricom Daraja "Lipa na M-Pesa Online" (STK push).
const BASE =
  process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function getToken(): Promise<string> {
  const basic = Buffer.from(`${env('MPESA_CONSUMER_KEY')}:${env('MPESA_CONSUMER_SECRET')}`).toString('base64');
  const res = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`M-Pesa authentication failed (${res.status})`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

// YYYYMMDDHHmmss in Nairobi time (UTC+3)
const timestamp = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace(/\D/g, '').slice(0, 14);

export interface StkResult {
  merchantRequestId: string;
  checkoutRequestId: string;
}

export async function stkPush(opts: {
  phone: string; // 2547XXXXXXXX
  amount: number; // whole KES
  reference: string;
  description: string;
}): Promise<StkResult> {
  const shortcode = env('MPESA_SHORTCODE');
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${env('MPESA_PASSKEY')}${ts}`).toString('base64');
  const callback = `${env('MPESA_CALLBACK_BASE_URL').replace(/\/$/, '')}/api/payments/stk-callback?token=${encodeURIComponent(env('MPESA_CALLBACK_SECRET'))}`;

  const token = await getToken();
  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(opts.amount),
      PartyA: opts.phone,
      PartyB: shortcode,
      PhoneNumber: opts.phone,
      CallBackURL: callback,
      AccountReference: opts.reference.slice(0, 12),
      TransactionDesc: opts.description.slice(0, 13),
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
    errorMessage?: string;
  };

  if (!res.ok || json.ResponseCode !== '0' || !json.CheckoutRequestID) {
    throw new Error(json.errorMessage ?? json.ResponseDescription ?? `M-Pesa request failed (${res.status})`);
  }
  return { merchantRequestId: json.MerchantRequestID ?? '', checkoutRequestId: json.CheckoutRequestID };
}