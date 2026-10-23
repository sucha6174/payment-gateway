const orderService = require('../services/orderService');

async function createOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.merchant.id, req.body);
    return res.status(201).json({
      id: order.id,
      merchant_id: order.merchant_id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: typeof order.notes === 'string' ? JSON.parse(order.notes) : (order.notes || {}),
      status: order.status,
      created_at: order.created_at instanceof Date ? order.created_at.toISOString() : new Date(order.created_at).toISOString()
    });
  } catch (error) {
    next(error);
  }
}

async function getOrder(req, res, next) {
  try {
    const { order_id } = req.params;
    const order = await orderService.getOrderById(req.merchant.id, order_id);
    return res.status(200).json({
      id: order.id,
      merchant_id: order.merchant_id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: typeof order.notes === 'string' ? JSON.parse(order.notes) : (order.notes || {}),
      status: order.status,
      created_at: order.created_at instanceof Date ? order.created_at.toISOString() : new Date(order.created_at).toISOString(),
      updated_at: order.updated_at instanceof Date ? order.updated_at.toISOString() : new Date(order.updated_at).toISOString()
    });
  } catch (error) {
    next(error);
  }
}

async function getPublicOrder(req, res, next) {
  try {
    const { order_id } = req.params;
    const order = await orderService.getPublicOrderById(order_id);
    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getOrder,
  getPublicOrder
};
