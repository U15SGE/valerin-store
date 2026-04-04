import crypto from 'crypto';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customer, items, total } = req.body;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  const expected = crypto.createHmac('sha256', KEY_SECRET).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
  if (expected !== razorpay_signature) return res.status(400).json({ success: false, error: 'Invalid signature' });
  const orderId = 'VLR' + Math.random().toString(36).substring(2, 8).toUpperCase();
  try {
    const WA_PHONE = process.env.WA_PHONE;
    const WA_KEY = process.env.WA_API_KEY;
    if (WA_PHONE && WA_KEY) {
      const itemNames = items.map(i => i.name + ' x' + i.qty).join(', ');
      const msg = encodeURIComponent('New VALERIN Order! #' + orderId + ' | ' + customer.name + ' | ' + itemNames + ' | Rs.' + total);
      await fetch('https://api.callmebot.com/whatsapp.php?phone=' + WA_PHONE + '&text=' + msg + '&apikey=' + WA_KEY);
    }
  } catch(e) {}
  return res.status(200).json({ success: true, order_id: orderId });
}
