// ─── 1. SABSE PEHLE ENV LOAD KARO ───
require('dotenv').config();

// ─── 2. CONSOLE LOG (Keys available hain) ───
console.log('🔑 RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID || '❌ MISSING');
console.log('🔑 RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ exists' : '❌ missing');

// ─── 3. BAAKI DEPENDENCIES IMPORT ───
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ FIX: CORS was fully open (`app.use(cors())` with no config), which lets
// ANY website call your payment endpoints, not just elvre.in. Now it only
// accepts requests from an explicit allow-list. Set ALLOWED_ORIGINS in your
// .env as a comma-separated list, e.g.:
//   ALLOWED_ORIGINS=https://www.elvre.in,https://elvre.in
// Localhost is always allowed too, so local development keeps working.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / curl / no-origin requests (e.g. health checks)
    if (!origin) return callback(null, true);
    if (localOrigins.includes(origin) || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`⚠️  Blocked CORS request from unrecognized origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json());

// ─── 4. RAZORPAY INSTANCE (AB KEYS AVAILABLE HAIN) ───
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ Razorpay credentials missing! Please check .env file.');
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ FIX: simple per-IP rate limiter (no extra npm package needed) so a
// script can't hammer /api/create-order or /api/verify-payment hundreds of
// times a second. This is intentionally lightweight — for a production
// system handling real scale, swap this for the `express-rate-limit`
// package with a shared store (Redis) if you run multiple server instances.
const requestLog = new Map(); // ip -> [timestamps]
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window per IP

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);
  next();
}

// Periodic cleanup so the map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestLog.entries()) {
    const fresh = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) requestLog.delete(ip);
    else requestLog.set(ip, fresh);
  }
}, 5 * 60 * 1000);

// ─── HEALTH CHECK ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ─── CREATE ORDER (WITH DETAILED ERROR LOGGING) ───
app.post('/api/create-order', rateLimit, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ 
        error: 'Amount must be at least ₹1 (100 paise)' 
      });
    }

    // ⚠️ STILL TODO (needs your product/cart data on the server to do
    // properly): this endpoint currently trusts whatever `amount` the
    // client sends. A user could intercept the network request and lower
    // it before the Razorpay order is created. To close this gap, look up
    // the real cart total from Supabase here (using a cart/session id sent
    // from the client, not a raw amount) and use *that* value instead of
    // trusting req.body.amount directly.

    const options = {
      amount: Math.round(amount),
      currency,
      receipt: receipt || 'receipt_' + Date.now(),
      payment_capture: 1,
    };

    console.log('📝 Creating Razorpay order with options:', options);

    const order = await razorpay.orders.create(options);
    
    console.log('✅ Order created:', order.id);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('❌ Razorpay order creation error:');
    console.error('  - Message:', error.message);
    console.error('  - Status Code:', error.statusCode || 'N/A');
    console.error('  - Response Data:', error.response ? error.response.data : 'No response data');
    console.error('  - Full Error:', error);
    
    res.status(500).json({ 
      error: error.message || 'Failed to create order',
      details: error.response ? error.response.data : null
    });
  }
});

// ─── VERIFY PAYMENT SIGNATURE ───
app.post('/api/verify-payment', rateLimit, (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing required fields: order_id, payment_id, signature' 
      });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid signature – payment verification failed' 
      });
    }
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({ 
      error: error.message || 'Verification failed' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});