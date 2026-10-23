const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('Contract 9: Login page has all required data-testid elements', () => {
  const loginJsx = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/Login.jsx'), 'utf8');

  assert.ok(loginJsx.includes('data-testid="login-form"'), 'Missing data-testid="login-form"');
  assert.ok(loginJsx.includes('data-testid="email-input"'), 'Missing data-testid="email-input"');
  assert.ok(loginJsx.includes('type="email"'), 'Missing type="email" on email input');
  assert.ok(loginJsx.includes('data-testid="password-input"'), 'Missing data-testid="password-input"');
  assert.ok(loginJsx.includes('type="password"'), 'Missing type="password" on password input');
  assert.ok(loginJsx.includes('data-testid="login-button"'), 'Missing data-testid="login-button"');
});

test('Contract 10: Dashboard home has all required data-testid elements', () => {
  const dashJsx = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/Dashboard.jsx'), 'utf8');

  assert.ok(dashJsx.includes('data-testid="dashboard"'), 'Missing data-testid="dashboard"');
  assert.ok(dashJsx.includes('data-testid="api-credentials"'), 'Missing data-testid="api-credentials"');
  assert.ok(dashJsx.includes('data-testid="api-key"'), 'Missing data-testid="api-key"');
  assert.ok(dashJsx.includes('data-testid="api-secret"'), 'Missing data-testid="api-secret"');
  assert.ok(dashJsx.includes('data-testid="stats-container"'), 'Missing data-testid="stats-container"');
  assert.ok(dashJsx.includes('data-testid="total-transactions"'), 'Missing data-testid="total-transactions"');
  assert.ok(dashJsx.includes('data-testid="total-amount"'), 'Missing data-testid="total-amount"');
  assert.ok(dashJsx.includes('data-testid="success-rate"'), 'Missing data-testid="success-rate"');
});

test('Contract 11: Transactions table has all required data-testid elements and structure', () => {
  const txJsx = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/Transactions.jsx'), 'utf8');

  assert.ok(txJsx.includes('data-testid="transactions-table"'), 'Missing data-testid="transactions-table"');
  assert.ok(txJsx.includes('<thead'), 'Missing thead');
  assert.ok(txJsx.includes('<tbody'), 'Missing tbody');
  assert.ok(txJsx.includes('data-testid="transaction-row"'), 'Missing data-testid="transaction-row"');
  assert.ok(txJsx.includes('data-testid="payment-id"'), 'Missing data-testid="payment-id"');
  assert.ok(txJsx.includes('data-testid="order-id"'), 'Missing data-testid="order-id"');
  assert.ok(txJsx.includes('data-testid="amount"'), 'Missing data-testid="amount"');
  assert.ok(txJsx.includes('data-testid="method"'), 'Missing data-testid="method"');
  assert.ok(txJsx.includes('data-testid="status"'), 'Missing data-testid="status"');
  assert.ok(txJsx.includes('data-testid="created-at"'), 'Missing data-testid="created-at"');
});

test('Contracts 12, 13, 14, 15: Checkout page has all required data-testid elements', () => {
  const checkoutJsx = fs.readFileSync(path.join(__dirname, '../checkout-page/src/pages/Checkout.jsx'), 'utf8');

  // Contract 12: Order display and method selection
  assert.ok(checkoutJsx.includes('data-testid="checkout-container"'), 'Missing data-testid="checkout-container"');
  assert.ok(checkoutJsx.includes('data-testid="order-summary"'), 'Missing data-testid="order-summary"');
  assert.ok(checkoutJsx.includes('data-testid="order-amount"'), 'Missing data-testid="order-amount"');
  assert.ok(checkoutJsx.includes('data-testid="order-id"'), 'Missing data-testid="order-id"');
  assert.ok(checkoutJsx.includes('data-testid="payment-methods"'), 'Missing data-testid="payment-methods"');
  assert.ok(checkoutJsx.includes('data-testid="method-upi"'), 'Missing data-testid="method-upi"');
  assert.ok(checkoutJsx.includes('data-method="upi"'), 'Missing data-method="upi"');
  assert.ok(checkoutJsx.includes('data-testid="method-card"'), 'Missing data-testid="method-card"');
  assert.ok(checkoutJsx.includes('data-method="card"'), 'Missing data-method="card"');

  // Contract 13: UPI Form and processing/success state
  assert.ok(checkoutJsx.includes('data-testid="upi-form"'), 'Missing data-testid="upi-form"');
  assert.ok(checkoutJsx.includes('data-testid="vpa-input"'), 'Missing data-testid="vpa-input"');
  assert.ok(checkoutJsx.includes('data-testid="pay-button"'), 'Missing data-testid="pay-button"');
  assert.ok(checkoutJsx.includes('data-testid="processing-state"'), 'Missing data-testid="processing-state"');
  assert.ok(checkoutJsx.includes('data-testid="processing-message"'), 'Missing data-testid="processing-message"');
  assert.ok(checkoutJsx.includes('data-testid="success-state"'), 'Missing data-testid="success-state"');
  assert.ok(checkoutJsx.includes('data-testid="payment-id"'), 'Missing data-testid="payment-id"');
  assert.ok(checkoutJsx.includes('data-testid="success-message"'), 'Missing data-testid="success-message"');

  // Contract 14: Card Form
  assert.ok(checkoutJsx.includes('data-testid="card-form"'), 'Missing data-testid="card-form"');
  assert.ok(checkoutJsx.includes('data-testid="card-number-input"'), 'Missing data-testid="card-number-input"');
  assert.ok(checkoutJsx.includes('data-testid="expiry-input"'), 'Missing data-testid="expiry-input"');
  assert.ok(checkoutJsx.includes('data-testid="cvv-input"'), 'Missing data-testid="cvv-input"');
  assert.ok(checkoutJsx.includes('data-testid="cardholder-name-input"'), 'Missing data-testid="cardholder-name-input"');

  // Contract 15: Error State and Retry Button
  assert.ok(checkoutJsx.includes('data-testid="error-state"'), 'Missing data-testid="error-state"');
  assert.ok(checkoutJsx.includes('data-testid="error-message"'), 'Missing data-testid="error-message"');
  assert.ok(checkoutJsx.includes('data-testid="retry-button"'), 'Missing data-testid="retry-button"');
});
