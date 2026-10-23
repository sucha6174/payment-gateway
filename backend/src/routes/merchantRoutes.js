const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/login', merchantController.login);
router.get('/stats', authMiddleware, merchantController.getStats);
router.get('/transactions', authMiddleware, merchantController.getTransactions);

module.exports = router;
