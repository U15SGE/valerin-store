export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowed = ['https://valerin.store','https://www.valerin.store','https://valerin-store.vercel.app'];
  if(allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  else res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customer, items, total } = req.body;
  const orderId = 'VLR' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // WhatsApp notification
  try {
    const WA_PHONE = process.env.WA_PHONE;
    const WA_KEY = process.env.WA_API_KEY;
    if (WA_PHONE && WA_KEY) {
      const itemNames = items.map(i => `${i.name} x${i.qty}`).join(', ');
      const msg = encodeURIComponent(
        `✦ New COD Order!\nOrder: #${orderId}\nCustomer: ${customer.name}\nPhone: ${customer.phone}\nItems: ${itemNames}\nTotal: ₹${total}\nAddress: ${customer.city}, ${customer.state}`
      );
      await fetch(`https://api.callmebot.com/whatsapp.php?phone=${WA_PHONE}&text=${msg}&apikey=${WA_KEY}`);
    }
  } catch (e) {}

  return res.status(200).json({ success: true, order_id: orderId });
}
