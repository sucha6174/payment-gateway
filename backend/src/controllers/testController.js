const db = require('../config/db');

async function getTestMerchant(req, res, next) {
  try {
    const result = await db.query(
      "SELECT id, email, api_key FROM merchants WHERE email = 'test@example.com'"
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND_ERROR',
          description: 'Test merchant not found'
        }
      });
    }

    const merchant = result.rows[0];
    return res.status(200).json({
      id: merchant.id,
      email: merchant.email,
      api_key: merchant.api_key,
      seeded: true
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTestMerchant
};
