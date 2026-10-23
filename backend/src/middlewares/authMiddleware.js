const db = require('../config/db');

async function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const apiSecret = req.headers['x-api-secret'];

  if (!apiKey || !apiSecret) {
    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        description: 'Invalid API credentials'
      }
    });
  }

  try {
    const result = await db.query(
      'SELECT id, name, email, api_key, api_secret, is_active FROM merchants WHERE api_key = $1 AND api_secret = $2',
      [apiKey, apiSecret]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          description: 'Invalid API credentials'
        }
      });
    }

    req.merchant = result.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        description: 'Invalid API credentials'
      }
    });
  }
}

module.exports = authMiddleware;
