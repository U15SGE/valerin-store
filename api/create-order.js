export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowed = ['https://valerin.store','https://www.valerin.store','https://valerin-store.vercel.app'];
  if(allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  else res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const KEY_ID = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    return res.status(500).json({ error: 'Payment not configured' });
  }

  try {
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt: `vlr_${Date.now()}` }),
    });
    const data = await response.json();
    if (data.id) {
      return res.status(200).json({ success: true, order_id: data.id, amount: data.amount, currency: data.currency, key: KEY_ID });
    }
    return res.status(400).json({ success: false, error: data.error?.description || 'Razorpay error' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
