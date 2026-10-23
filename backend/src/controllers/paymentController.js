const paymentService = require('../services/paymentService');

async function createPayment(req, res, next) {
  try {
    const payment = await paymentService.processPayment(req.merchant.id, req.body);
    return res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
}

async function getPayment(req, res, next) {
  try {
    const { payment_id } = req.params;
    const payment = await paymentService.getPaymentById(req.merchant.id, payment_id);
    return res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
}

async function createPublicPayment(req, res, next) {
  try {
    // merchantId is null; paymentService will lookup merchant from order_id
    const payment = await paymentService.processPayment(null, req.body);
    return res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
}

async function getPublicPayment(req, res, next) {
  try {
    const { payment_id } = req.params;
    const payment = await paymentService.getPaymentById(null, payment_id);
    return res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPayment,
  getPayment,
  createPublicPayment,
  getPublicPayment
};
