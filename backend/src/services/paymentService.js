const crypto = require('crypto');
const db = require('../config/db');
const validationService = require('./validationService');

function generatePaymentId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `pay_${result}`;
}

async function processPayment(merchantId, data) {
  const { order_id, method, vpa, card } = data;

  if (!order_id) {
    const error = new Error('order_id is required');
    error.code = 'BAD_REQUEST_ERROR';
    error.status = 400;
    throw error;
  }

  // Verify order exists and belongs to merchant
  let orderQuery = 'SELECT id, merchant_id, amount, currency FROM orders WHERE id = $1';
  let orderParams = [order_id];
  if (merchantId) {
    orderQuery += ' AND merchant_id = $2';
    orderParams.push(merchantId);
  }

  const orderResult = await db.query(orderQuery, orderParams);
  if (orderResult.rows.length === 0) {
    const error = new Error('Order not found');
    error.code = 'NOT_FOUND_ERROR';
    error.status = 404;
    throw error;
  }

  const order = orderResult.rows[0];
  const actualMerchantId = order.merchant_id;

  if (method !== 'upi' && method !== 'card') {
    const error = new Error('Invalid payment method. Supported methods: upi, card');
    error.code = 'BAD_REQUEST_ERROR';
    error.status = 400;
    throw error;
  }

  let paymentVpa = null;
  let cardNetwork = null;
  let cardLast4 = null;

  if (method === 'upi') {
    if (!vpa || !validationService.validateVPA(vpa)) {
      const error = new Error('Invalid VPA format');
      error.code = 'INVALID_VPA';
      error.status = 400;
      throw error;
    }
    paymentVpa = vpa;
  } else if (method === 'card') {
    if (!card || typeof card !== 'object') {
      const error = new Error('Card details are required');
      error.code = 'BAD_REQUEST_ERROR';
      error.status = 400;
      throw error;
    }

    const { number, expiry_month, expiry_year, cvv, holder_name } = card;

    if (!number || !expiry_month || !expiry_year || !cvv || !holder_name) {
      const error = new Error('Incomplete card details');
      error.code = 'BAD_REQUEST_ERROR';
      error.status = 400;
      throw error;
    }

    // Expiry validation first
    if (!validationService.validateExpiry(expiry_month, expiry_year)) {
      const error = new Error('Card has expired or invalid expiry date');
      error.code = 'EXPIRED_CARD';
      error.status = 400;
      throw error;
    }

    // Luhn algorithm validation
    if (!validationService.validateLuhn(number)) {
      const error = new Error('Invalid card number');
      error.code = 'INVALID_CARD';
      error.status = 400;
      throw error;
    }

    cardNetwork = validationService.detectCardNetwork(number);
    cardLast4 = validationService.getCardLast4(number);
  }

  // Generate unique payment ID
  let paymentId = generatePaymentId();
  let attempts = 0;
  let createdPayment = null;

  while (attempts < 5) {
    try {
      const insertQuery = `
        INSERT INTO payments (
          id, order_id, merchant_id, amount, currency, method, status,
          vpa, card_network, card_last4, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, created_at, updated_at
      `;
      const insertValues = [
        paymentId,
        order.id,
        actualMerchantId,
        order.amount,
        order.currency,
        method,
        paymentVpa,
        cardNetwork,
        cardLast4
      ];
      const insertResult = await db.query(insertQuery, insertValues);
      createdPayment = insertResult.rows[0];
      break;
    } catch (err) {
      if (err.code === '23505') {
        paymentId = generatePaymentId();
        attempts++;
      } else {
        throw err;
      }
    }
  }

  if (!createdPayment) {
    throw new Error('Failed to create payment record');
  }

  // Determine processing delay and outcome
  const isTestMode = process.env.TEST_MODE === 'true';
  let isSuccess = true;
  let delayMs = 1000;

  if (isTestMode) {
    isSuccess = process.env.TEST_PAYMENT_SUCCESS !== 'false';
    delayMs = parseInt(process.env.TEST_PROCESSING_DELAY || '1000', 10);
  } else {
    const minDelay = parseInt(process.env.PROCESSING_DELAY_MIN || '5000', 10);
    const maxDelay = parseInt(process.env.PROCESSING_DELAY_MAX || '10000', 10);
    delayMs = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    const upiRate = parseFloat(process.env.UPI_SUCCESS_RATE || '0.90');
    const cardRate = parseFloat(process.env.CARD_SUCCESS_RATE || '0.95');
    const randomVal = Math.random();

    if (method === 'upi') {
      isSuccess = randomVal < upiRate;
    } else {
      isSuccess = randomVal < cardRate;
    }
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, delayMs));

  // Update payment status in database
  const finalStatus = isSuccess ? 'success' : 'failed';
  const errorCode = isSuccess ? null : 'PAYMENT_FAILED';
  const errorDescription = isSuccess ? null : 'Payment processing failed';

  await db.query(
    `UPDATE payments
     SET status = $1, error_code = $2, error_description = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [finalStatus, errorCode, errorDescription, createdPayment.id]
  );

  // Return response with initial 'processing' status as required by specification
  const responseData = {
    id: createdPayment.id,
    order_id: createdPayment.order_id,
    amount: createdPayment.amount,
    currency: createdPayment.currency,
    method: createdPayment.method,
    status: 'processing',
    created_at: createdPayment.created_at.toISOString()
  };

  if (method === 'upi') {
    responseData.vpa = paymentVpa;
  } else {
    responseData.card_network = cardNetwork;
    responseData.card_last4 = cardLast4;
  }

  return responseData;
}

async function getPaymentById(merchantId, paymentId) {
  let query = `
    SELECT id, order_id, merchant_id, amount, currency, method, status, vpa, card_network, card_last4, error_code, error_description, created_at, updated_at
    FROM payments
    WHERE id = $1
  `;
  const params = [paymentId];

  if (merchantId) {
    query += ' AND merchant_id = $2';
    params.push(merchantId);
  }

  const result = await db.query(query, params);
  if (result.rows.length === 0) {
    const error = new Error('Payment not found');
    error.code = 'NOT_FOUND_ERROR';
    error.status = 404;
    throw error;
  }

  const p = result.rows[0];
  const formatted = {
    id: p.id,
    order_id: p.order_id,
    amount: p.amount,
    currency: p.currency,
    method: p.method,
    status: p.status,
    created_at: p.created_at.toISOString(),
    updated_at: p.updated_at.toISOString()
  };

  if (p.method === 'upi') {
    formatted.vpa = p.vpa;
  } else if (p.method === 'card') {
    formatted.card_network = p.card_network;
    formatted.card_last4 = p.card_last4;
  }

  if (p.status === 'failed') {
    formatted.error_code = p.error_code || 'PAYMENT_FAILED';
    formatted.error_description = p.error_description || 'Payment processing failed';
  }

  return formatted;
}

module.exports = {
  processPayment,
  getPaymentById,
  generatePaymentId
};
