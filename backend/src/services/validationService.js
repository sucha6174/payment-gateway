/**
 * Validation service for payments
 */

// VPA regex pattern: ^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$
const VPA_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

function validateVPA(vpa) {
  if (typeof vpa !== 'string') return false;
  return VPA_REGEX.test(vpa);
}

function cleanCardNumber(cardNumber) {
  if (typeof cardNumber !== 'string') return '';
  return cardNumber.replace(/[\s-]/g, '');
}

function validateLuhn(cardNumber) {
  const cleaned = cleanCardNumber(cardNumber);
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function detectCardNetwork(cardNumber) {
  const cleaned = cleanCardNumber(cardNumber);
  if (!cleaned) return 'unknown';

  if (cleaned.startsWith('4')) {
    return 'visa';
  }

  const prefix2 = cleaned.substring(0, 2);
  const prefix2Num = parseInt(prefix2, 10);

  if (prefix2Num >= 51 && prefix2Num <= 55) {
    return 'mastercard';
  }

  if (prefix2 === '34' || prefix2 === '37') {
    return 'amex';
  }

  if (prefix2 === '60' || prefix2 === '65' || (prefix2Num >= 81 && prefix2Num <= 89)) {
    return 'rupay';
  }

  return 'unknown';
}

function validateExpiry(month, year) {
  const m = parseInt(month, 10);
  if (isNaN(m) || m < 1 || m > 12) {
    return false;
  }

  let y = parseInt(year, 10);
  if (isNaN(y)) {
    return false;
  }

  if (y < 100) {
    y = 2000 + y;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  if (y < currentYear) {
    return false;
  }

  if (y === currentYear && m < currentMonth) {
    return false;
  }

  return true;
}

function getCardLast4(cardNumber) {
  const cleaned = cleanCardNumber(cardNumber);
  return cleaned.slice(-4);
}

module.exports = {
  validateVPA,
  cleanCardNumber,
  validateLuhn,
  detectCardNetwork,
  validateExpiry,
  getCardLast4,
};
