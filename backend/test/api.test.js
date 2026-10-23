const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const db = require('../src/config/db');
const { app, startServer } = require('../src/server');

let server;
let baseUrl;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.setHeader('Content-Type', 'application/json');
      req.write(payload);
    }

    req.end();
  });
}

const authHeaders = {
  'X-Api-Key': 'key_test_abc123',
  'X-Api-Secret': 'secret_test_xyz789'
};

test.before(async () => {
  await db.initDb();
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  if (server) {
    server.close();
  }
  await db.gracefulShutdown();
});

test('Contract 1: Health Check Endpoint GET /health', async () => {
  const res = await makeRequest('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'healthy');
  assert.strictEqual(res.body.database, 'connected');
  assert.ok(res.body.timestamp);
});

test('Contract 2: Database Schema & Seeded Test Merchant', async () => {
  // Test merchant check
  const merchantRes = await db.query(
    "SELECT id, email, api_key, api_secret FROM merchants WHERE email = 'test@example.com'"
  );
  assert.strictEqual(merchantRes.rows.length, 1);
  const m = merchantRes.rows[0];
  assert.strictEqual(m.id, '550e8400-e29b-41d4-a716-446655440000');
  assert.strictEqual(m.email, 'test@example.com');
  assert.strictEqual(m.api_key, 'key_test_abc123');
  assert.strictEqual(m.api_secret, 'secret_test_xyz789');

  // Indexes check
  const indexesRes = await db.query(`
    SELECT indexname, tablename FROM pg_indexes
    WHERE tablename IN ('orders', 'payments')
  `);
  const indexNames = indexesRes.rows.map(r => r.indexname);
  assert.ok(indexNames.includes('idx_orders_merchant_id'));
  assert.ok(indexNames.includes('idx_payments_order_id'));
  assert.ok(indexNames.includes('idx_payments_status'));

  // Contract 16: Ensure forbidden card columns do not exist
  const colRes = await db.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name IN ('card_number', 'cvv', 'card_cvv')
  `);
  assert.strictEqual(colRes.rows.length, 0);
});

test('Contract 3: API Authentication System', async () => {
  // No auth
  const noAuthRes = await makeRequest('/api/v1/orders', {
    method: 'POST',
    body: { amount: 50000, currency: 'INR' }
  });
  assert.strictEqual(noAuthRes.status, 401);
  assert.strictEqual(noAuthRes.body.error.code, 'AUTHENTICATION_ERROR');
  assert.strictEqual(noAuthRes.body.error.description, 'Invalid API credentials');

  // Invalid credentials
  const badAuthRes = await makeRequest('/api/v1/orders', {
    method: 'POST',
    headers: { 'X-Api-Key': 'invalid_key', 'X-Api-Secret': 'invalid_secret' },
    body: { amount: 50000 }
  });
  assert.strictEqual(badAuthRes.status, 401);
  assert.strictEqual(badAuthRes.body.error.code, 'AUTHENTICATION_ERROR');

  // Valid credentials
  const validRes = await makeRequest('/api/v1/orders', {
    method: 'POST',
    headers: authHeaders,
    body: { amount: 50000, currency: 'INR' }
  });
  assert.strictEqual(validRes.status, 201);
});

test('Contract 4: Order Creation Endpoint with Validation', async () => {
  // Validation error (amount < 100)
  const invalidAmountRes = await makeRequest('/api/v1/orders', {
    method: 'POST',
    headers: authHeaders,
    body: { amount: 50 }
  });
  assert.strictEqual(invalidAmountRes.status, 400);
  assert.strictEqual(invalidAmountRes.body.error.code, 'BAD_REQUEST_ERROR');
  assert.strictEqual(invalidAmountRes.body.error.description, 'amount must be at least 100');

  // Valid creation with notes and receipt
  const validRes = await makeRequest('/api/v1/orders', {
    method: 'POST',
    headers: authHeaders,
    body: {
      amount: 50000,
      currency: 'INR',
      receipt: 'receipt_123',
      notes: { customer_name: 'John Doe' }
    }
  });
  assert.strictEqual(validRes.status, 201);
  assert.match(validRes.body.id, /^order_[a-zA-Z0-9]{16}$/);
  assert.strictEqual(validRes.body.merchant_id, '550e8400-e29b-41d4-a716-446655440000');
  assert.strictEqual(validRes.body.amount, 50000);
  assert.strictEqual(validRes.body.currency, 'INR');
  assert.strictEqual(validRes.body.receipt, 'receipt_123');
  assert.strictEqual(validRes.body.notes.customer_name, 'John Doe');
  assert.strictEqual(validRes.body.status, 'created');
  assert.ok(validRes.body.created_at);
});

test('Contract 5: Order Retrieval Endpoint', async () => {
  // Create order
  const createRes = await makeRequest('/api/v1/orders', {
    method: 'POST',
    headers: authHeaders,
    body: { amount: 50000, currency: 'INR' }
  });
  const orderId = createRes.body.id;

  // Retrieve order
  const getRes = await makeRequest(`/api/v1/orders/${orderId}`, {
    headers: authHeaders
  });
  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getRes.body.id, orderId);
  assert.strictEqual(getRes.body.amount, 50000);
  assert.strictEqual(getRes.body.merchant_id, '550e8400-e29b-41d4-a716-446655440000');

  // Non-existent order
  const notFoundRes = await makeRequest('/api/v1/orders/order_nonexistent123', {
    headers: authHeaders
  });
  assert.strictEqual(notFoundRes.status, 404);
  assert.strictEqual(notFoundRes.body.error.code, 'NOT_FOUND_ERROR');
  assert.strictEqual(notFoundRes.body.error.description, 'Order not found');

  // Public order retrieval
  const publicRes = await makeRequest(`/api/v1/orders/${orderId}/public`);
  assert.strictEqual(publicRes.status, 200);
  assert.strictEqual(publicRes.body.id, orderId);
  assert.strictEqual(publicRes.body.amount, 50000);
  assert.strictEqual(publicRes.body.currency, 'INR');
  assert.strictEqual(publicRes.body.status, 'created');
});

test('Contract 6 & 16: Payment Validation Logic', async () => {
  const createOrderRes = await makeRequest('/api/v1/orders', {
    method: 'POST',
    headers: authHeaders,
    body: { amount: 50000 }
  });
  const orderId = createOrderRes.body.id;

  // Configure test mode
  process.env.TEST_MODE = 'true';
  process.env.TEST_PAYMENT_SUCCESS = 'true';
  process.env.TEST_PROCESSING_DELAY = '100';

  // UPI Invalid VPA
  const invalidVpaRes = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: authHeaders,
    body: {
      order_id: orderId,
      method: 'upi',
      vpa: 'user @paytm'
    }
  });
  assert.strictEqual(invalidVpaRes.status, 400);
  assert.strictEqual(invalidVpaRes.body.error.code, 'INVALID_VPA');

  // Card Invalid Luhn
  const invalidLuhnRes = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: authHeaders,
    body: {
      order_id: orderId,
      method: 'card',
      card: {
        number: '4111111111111112',
        expiry_month: '12',
        expiry_year: '2028',
        cvv: '123',
        holder_name: 'John Doe'
      }
    }
  });
  assert.strictEqual(invalidLuhnRes.status, 400);
  assert.strictEqual(invalidLuhnRes.body.error.code, 'INVALID_CARD');

  // Card Expired
  const expiredRes = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: authHeaders,
    body: {
      order_id: orderId,
      method: 'card',
      card: {
        number: '4111111111111111',
        expiry_month: '12',
        expiry_year: '2020',
        cvv: '123',
        holder_name: 'John Doe'
      }
    }
  });
  assert.strictEqual(expiredRes.status, 400);
  assert.strictEqual(expiredRes.body.error.code, 'EXPIRED_CARD');

  // Card Network Visa & Last4 Check
  const visaRes = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: authHeaders,
    body: {
      order_id: orderId,
      method: 'card',
      card: {
        number: '4111111111111111',
        expiry_month: '12',
        expiry_year: '2028',
        cvv: '123',
        holder_name: 'John Doe'
      }
    }
  });
  assert.strictEqual(visaRes.status, 201);
  assert.strictEqual(visaRes.body.card_network, 'visa');
  assert.strictEqual(visaRes.body.card_last4, '1111');

  // Card Network Mastercard & Last4 Check
  const mcRes = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: authHeaders,
    body: {
      order_id: orderId,
      method: 'card',
      card: {
        number: '5500000000000004',
        expiry_month: '12',
        expiry_year: '2028',
        cvv: '123',
        holder_name: 'John Doe'
      }
    }
  });
  assert.strictEqual(mcRes.status, 201);
  assert.strictEqual(mcRes.body.card_network, 'mastercard');
  assert.strictEqual(mcRes.body.card_last4, '0004');

  // Verify DB does not contain card numbers
  const dbPayment = await db.query(
    'SELECT card_last4, card_network FROM payments WHERE id = $1',
    [visaRes.body.id]
  );
  assert.strictEqual(dbPayment.rows[0].card_last4, '1111');
});

test('Contract 7, 8, 17: Payment Processing, Deterministic Test Mode & Retrieval', async () => {
  const createOrderRes = await makeRequest('/api/v1/orders', {
    method: 'POST',
    headers: authHeaders,
    body: { amount: 50000 }
  });
  const orderId = createOrderRes.body.id;

  // Test mode deterministic success
  process.env.TEST_MODE = 'true';
  process.env.TEST_PAYMENT_SUCCESS = 'true';
  process.env.TEST_PROCESSING_DELAY = '1000';

  const startTime = Date.now();
  const upiPayRes = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: authHeaders,
    body: {
      order_id: orderId,
      method: 'upi',
      vpa: 'user@paytm'
    }
  });
  const duration = Date.now() - startTime;

  assert.strictEqual(upiPayRes.status, 201);
  assert.match(upiPayRes.body.id, /^pay_[a-zA-Z0-9]{16}$/);
  assert.strictEqual(upiPayRes.body.status, 'processing');
  assert.strictEqual(upiPayRes.body.method, 'upi');
  assert.strictEqual(upiPayRes.body.vpa, 'user@paytm');
  assert.ok(duration >= 950, `Expected delay >= 950ms, got ${duration}ms`);

  // Poll GET /api/v1/payments/{payment_id}
  const paymentId = upiPayRes.body.id;
  const getPayRes = await makeRequest(`/api/v1/payments/${paymentId}`, {
    headers: authHeaders
  });
  assert.strictEqual(getPayRes.status, 200);
  assert.strictEqual(getPayRes.body.id, paymentId);
  assert.strictEqual(getPayRes.body.order_id, orderId);
  assert.strictEqual(getPayRes.body.amount, 50000);
  assert.strictEqual(getPayRes.body.status, 'success');

  // Test mode deterministic failure
  process.env.TEST_PAYMENT_SUCCESS = 'false';
  process.env.TEST_PROCESSING_DELAY = '500';

  const failStart = Date.now();
  const failPayRes = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: authHeaders,
    body: {
      order_id: orderId,
      method: 'upi',
      vpa: 'user@paytm'
    }
  });
  const failDuration = Date.now() - failStart;

  assert.strictEqual(failPayRes.status, 201);
  assert.strictEqual(failPayRes.body.status, 'processing');
  assert.ok(failDuration >= 450, `Expected delay >= 450ms, got ${failDuration}ms`);

  const getFailRes = await makeRequest(`/api/v1/payments/${failPayRes.body.id}`, {
    headers: authHeaders
  });
  assert.strictEqual(getFailRes.status, 200);
  assert.strictEqual(getFailRes.body.status, 'failed');
  assert.strictEqual(getFailRes.body.error_code, 'PAYMENT_FAILED');
  assert.ok(getFailRes.body.error_description);
});

test('Test Merchant Endpoint GET /api/v1/test/merchant', async () => {
  const res = await makeRequest('/api/v1/test/merchant');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.id, '550e8400-e29b-41d4-a716-446655440000');
  assert.strictEqual(res.body.email, 'test@example.com');
  assert.strictEqual(res.body.api_key, 'key_test_abc123');
  assert.strictEqual(res.body.seeded, true);
});

test('Merchant Dashboard Stats & Transactions Endpoints', async () => {
  // Merchant login
  const loginRes = await makeRequest('/api/v1/merchants/login', {
    method: 'POST',
    body: { email: 'test@example.com', password: 'password' }
  });
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.merchant.email, 'test@example.com');
  assert.strictEqual(loginRes.body.merchant.api_key, 'key_test_abc123');
  assert.strictEqual(loginRes.body.merchant.api_secret, 'secret_test_xyz789');

  // Stats
  const statsRes = await makeRequest('/api/v1/merchants/stats', {
    headers: authHeaders
  });
  assert.strictEqual(statsRes.status, 200);
  assert.ok(typeof statsRes.body.total_transactions === 'number');
  assert.ok(typeof statsRes.body.total_amount_rupees === 'number');
  assert.ok(typeof statsRes.body.success_rate === 'number');

  // Transactions list
  const txRes = await makeRequest('/api/v1/merchants/transactions', {
    headers: authHeaders
  });
  assert.strictEqual(txRes.status, 200);
  assert.ok(Array.isArray(txRes.body.transactions));
  assert.ok(txRes.body.transactions.length > 0);
  const firstTx = txRes.body.transactions[0];
  assert.match(firstTx.id, /^pay_[a-zA-Z0-9]{16}$/);
  assert.match(firstTx.order_id, /^order_[a-zA-Z0-9]{16}$/);
});

test('Public Checkout Flow Endpoints', async () => {
  const createOrderRes = await makeRequest('/api/v1/orders', {
    method: 'POST',
    headers: authHeaders,
    body: { amount: 50000 }
  });
  const orderId = createOrderRes.body.id;

  process.env.TEST_MODE = 'true';
  process.env.TEST_PAYMENT_SUCCESS = 'true';
  process.env.TEST_PROCESSING_DELAY = '100';

  // Public checkout payment
  const publicPayRes = await makeRequest('/api/v1/payments/public', {
    method: 'POST',
    body: {
      order_id: orderId,
      method: 'upi',
      vpa: 'user@paytm'
    }
  });
  assert.strictEqual(publicPayRes.status, 201);
  assert.strictEqual(publicPayRes.body.status, 'processing');

  // Public checkout status poll
  const publicPollRes = await makeRequest(`/api/v1/payments/${publicPayRes.body.id}/public`);
  assert.strictEqual(publicPollRes.status, 200);
  assert.strictEqual(publicPollRes.body.id, publicPayRes.body.id);
  assert.strictEqual(publicPollRes.body.status, 'success');
});
