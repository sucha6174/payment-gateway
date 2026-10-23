const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes for hosted checkout page
router.post('/public', paymentController.createPublicPayment);
router.get('/:payment_id/public', paymentController.getPublicPayment);

// Authenticated merchant routes
router.post('/', authMiddleware, paymentController.createPayment);
router.get('/:payment_id', authMiddleware, paymentController.getPayment);

module.exports = router;
