const db = require('../config/db');

async function getHealth(req, res) {
  let dbStatus = 'disconnected';
  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
  }

  return res.status(200).json({
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  getHealth
};
