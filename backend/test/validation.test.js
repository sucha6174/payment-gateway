const test = require('node:test');
const assert = require('node:assert');
const validationService = require('../src/services/validationService');
const orderService = require('../src/services/orderService');
const paymentService = require('../src/services/paymentService');

test('VPA format validation', () => {
  // Valid VPAs
  assert.strictEqual(validationService.validateVPA('user@paytm'), true);
  assert.strictEqual(validationService.validateVPA('john.doe@okhdfcbank'), true);
  assert.strictEqual(validationService.validateVPA('user_123@phonepe'), true);
  assert.strictEqual(validationService.validateVPA('valid.user-123@icici'), true);

  // Invalid VPAs
  assert.strictEqual(validationService.validateVPA('user @paytm'), false);
  assert.strictEqual(validationService.validateVPA('@paytm'), false);
  assert.strictEqual(validationService.validateVPA('user@@bank'), false);
  assert.strictEqual(validationService.validateVPA('user@'), false);
  assert.strictEqual(validationService.validateVPA('user@bank@extra'), false);
  assert.strictEqual(validationService.validateVPA(''), false);
  assert.strictEqual(validationService.validateVPA(null), false);
  assert.strictEqual(validationService.validateVPA(undefined), false);
});

test('Card number Luhn validation', () => {
  // Valid cards
  assert.strictEqual(validationService.validateLuhn('4111111111111111'), true);
  assert.strictEqual(validationService.validateLuhn('4111 1111 1111 1111'), true);
  assert.strictEqual(validationService.validateLuhn('4111-1111-1111-1111'), true);
  assert.strictEqual(validationService.validateLuhn('5500000000000004'), true);

  // Invalid cards
  assert.strictEqual(validationService.validateLuhn('4111111111111112'), false);
  assert.strictEqual(validationService.validateLuhn('411111111111111'), false);
  assert.strictEqual(validationService.validateLuhn('invalid12345'), false);
  assert.strictEqual(validationService.validateLuhn(''), false);
  assert.strictEqual(validationService.validateLuhn(null), false);
});

test('Card network detection', () => {
  assert.strictEqual(validationService.detectCardNetwork('4111111111111111'), 'visa');
  assert.strictEqual(validationService.detectCardNetwork('4222 2222 2222 2222'), 'visa');
  assert.strictEqual(validationService.detectCardNetwork('5100000000000000'), 'mastercard');
  assert.strictEqual(validationService.detectCardNetwork('5200000000000000'), 'mastercard');
  assert.strictEqual(validationService.detectCardNetwork('5500000000000004'), 'mastercard');
  assert.strictEqual(validationService.detectCardNetwork('340000000000000'), 'amex');
  assert.strictEqual(validationService.detectCardNetwork('370000000000000'), 'amex');
  assert.strictEqual(validationService.detectCardNetwork('601111111111111'), 'rupay');
  assert.strictEqual(validationService.detectCardNetwork('651111111111111'), 'rupay');
  assert.strictEqual(validationService.detectCardNetwork('811111111111111'), 'rupay');
  assert.strictEqual(validationService.detectCardNetwork('891111111111111'), 'rupay');
  assert.strictEqual(validationService.detectCardNetwork('123456789012345'), 'unknown');
  assert.strictEqual(validationService.detectCardNetwork(''), 'unknown');
});

test('Card expiry validation', () => {
  assert.strictEqual(validationService.validateExpiry('12', '2030'), true);
  assert.strictEqual(validationService.validateExpiry('12', '30'), true);
  assert.strictEqual(validationService.validateExpiry('12', '2020'), false);
  assert.strictEqual(validationService.validateExpiry('12', '20'), false);
  assert.strictEqual(validationService.validateExpiry('13', '2030'), false);
  assert.strictEqual(validationService.validateExpiry('0', '2030'), false);
  assert.strictEqual(validationService.validateExpiry('invalid', '2030'), false);
});

test('Extract card last4 digits', () => {
  assert.strictEqual(validationService.getCardLast4('4111111111111111'), '1111');
  assert.strictEqual(validationService.getCardLast4('4111 1111 1111 1111'), '1111');
  assert.strictEqual(validationService.getCardLast4('5500000000000004'), '0004');
});

test('Order ID and Payment ID formats', () => {
  const orderId = orderService.generateOrderId();
  assert.match(orderId, /^order_[a-zA-Z0-9]{16}$/);
  assert.strictEqual(orderId.length, 22);

  const paymentId = paymentService.generatePaymentId();
  assert.match(paymentId, /^pay_[a-zA-Z0-9]{16}$/);
  assert.strictEqual(paymentId.length, 20);
});
