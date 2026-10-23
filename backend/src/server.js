require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const healthRoutes = require('./routes/healthRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const testRoutes = require('./routes/testRoutes');
const merchantRoutes = require('./routes/merchantRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Routes
app.use('/', healthRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/merchants', merchantRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND_ERROR',
      description: 'Endpoint not found'
    }
  });
});

// Standardized Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const description = err.message || 'An unexpected error occurred';

  res.status(status).json({
    error: {
      code,
      description
    }
  });
});

let server;

async function startServer() {
  await db.initDb();

  server = app.listen(PORT, () => {
    console.log(`Payment Gateway API running on port ${PORT}`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};
