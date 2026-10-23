const db = require('../config/db');

async function login(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Email is required'
        }
      });
    }

    const result = await db.query(
      'SELECT id, name, email, api_key, api_secret, is_active FROM merchants WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          description: 'Merchant not found or inactive'
        }
      });
    }

    const merchant = result.rows[0];
    return res.status(200).json({
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        api_key: merchant.api_key,
        api_secret: merchant.api_secret
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const merchantId = req.merchant.id;

    const countRes = await db.query(
      'SELECT COUNT(*)::int as total FROM payments WHERE merchant_id = $1',
      [merchantId]
    );
    const totalTransactions = countRes.rows[0].total || 0;

    const successRes = await db.query(
      "SELECT COUNT(*)::int as total_success, COALESCE(SUM(amount), 0)::bigint as total_amount FROM payments WHERE merchant_id = $1 AND status = 'success'",
      [merchantId]
    );
    const totalSuccess = successRes.rows[0].total_success || 0;
    const totalAmountPaise = Number(successRes.rows[0].total_amount || 0);

    // Rupee amount is paise / 100
    const totalAmountRupees = Math.floor(totalAmountPaise / 100);

    const successRate = totalTransactions > 0 
      ? Math.round((totalSuccess / totalTransactions) * 100) 
      : 0;

    return res.status(200).json({
      total_transactions: totalTransactions,
      total_amount_paise: totalAmountPaise,
      total_amount_rupees: totalAmountRupees,
      success_rate: successRate
    });
  } catch (error) {
    next(error);
  }
}

async function getTransactions(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const result = await db.query(
      `SELECT id, order_id, amount, method, status, created_at
       FROM payments
       WHERE merchant_id = $1
       ORDER BY created_at DESC`,
      [merchantId]
    );

    return res.status(200).json({
      transactions: result.rows.map(row => ({
        id: row.id,
        order_id: row.order_id,
        amount: row.amount,
        method: row.method,
        status: row.status,
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString()
      }))
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getStats,
  getTransactions
};
