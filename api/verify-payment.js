export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowed = ['https://valerin.store','https://www.valerin.store','https://valerin-store.vercel.app'];
  if(allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  else res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    customer,
    items,
    total,
  } = req.body;

  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  // Verify signature
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Invalid signature' });
  }

  // Generate order ID
  const orderId = 'VLR' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // Send WhatsApp notification
  try {
    const WA_PHONE = process.env.WA_PHONE;
    const WA_KEY = process.env.WA_API_KEY;
    if (WA_PHONE && WA_KEY) {
      const itemNames = items.map(i => `${i.name} x${i.qty}`).join(', ');
      const msg = encodeURIComponent(
        `✦ New VALERIN Order!\nOrder: #${orderId}\nCustomer: ${customer.name}\nPhone: ${customer.phone}\nItems: ${itemNames}\nTotal: ₹${total}\nPayment: ${razorpay_payment_id}`
      );
      await fetch(`https://api.callmebot.com/whatsapp.php?phone=${WA_PHONE}&text=${msg}&apikey=${WA_KEY}`);
    }
  } catch (e) {}

  // Send admin email via Resend (optional)
  try {
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    if (RESEND_KEY && ADMIN_EMAIL) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'VALERIN <orders@valerin.store>',
          to: ADMIN_EMAIL,
          subject: `🛍 New Order #${orderId} - ₹${total}`,
          html: `<h2>New VALERIN Order</h2><p>Order: <strong>#${orderId}</strong></p><p>Customer: ${customer.name}</p><p>Email: ${customer.email}</p><p>Phone: ${customer.phone}</p><p>Address: ${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}</p><p>Payment ID: ${razorpay_payment_id}</p><p>Total: ₹${total}</p>`,
        }),
      });
    }
  } catch (e) {}

  return res.status(200).json({ success: true, order_id: orderId });
}
