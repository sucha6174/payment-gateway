const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/merchant', testController.getTestMerchant);

module.exports = router;
