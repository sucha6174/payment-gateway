const crypto = require('crypto');
const db = require('../config/db');

function generateOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `order_${result}`;
}

async function createOrder(merchantId, data) {
  const { amount, currency = 'INR', receipt = null, notes = {} } = data;

  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 100) {
    const error = new Error('amount must be at least 100');
    error.code = 'BAD_REQUEST_ERROR';
    error.status = 400;
    throw error;
  }

  let orderId = generateOrderId();
  let attempts = 0;
  while (attempts < 5) {
    try {
      const query = `
        INSERT INTO orders (id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'created', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at
      `;
      const values = [orderId, merchantId, amount, currency, receipt, JSON.stringify(notes)];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') { // unique violation
        orderId = generateOrderId();
        attempts++;
      } else {
        throw err;
      }
    }
  }
  throw new Error('Could not generate unique order ID');
}

async function getOrderById(merchantId, orderId) {
  const query = `
    SELECT id, merchant_id, amount, currency, receipt, notes, status, created_at, updated_at
    FROM orders
    WHERE id = $1 AND merchant_id = $2
  `;
  const result = await db.query(query, [orderId, merchantId]);
  if (result.rows.length === 0) {
    const error = new Error('Order not found');
    error.code = 'NOT_FOUND_ERROR';
    error.status = 404;
    throw error;
  }
  return result.rows[0];
}

async function getPublicOrderById(orderId) {
  const query = `
    SELECT id, amount, currency, status
    FROM orders
    WHERE id = $1
  `;
  const result = await db.query(query, [orderId]);
  if (result.rows.length === 0) {
    const error = new Error('Order not found');
    error.code = 'NOT_FOUND_ERROR';
    error.status = 404;
    throw error;
  }
  return result.rows[0];
}

module.exports = {
  createOrder,
  getOrderById,
  getPublicOrderById,
  generateOrderId,
};
