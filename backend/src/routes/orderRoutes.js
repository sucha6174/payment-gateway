const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public route for checkout page
router.get('/:order_id/public', orderController.getPublicOrder);

// Authenticated merchant routes
router.post('/', authMiddleware, orderController.createOrder);
router.get('/:order_id', authMiddleware, orderController.getOrder);

module.exports = router;
