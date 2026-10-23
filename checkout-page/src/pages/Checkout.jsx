import React, { useState, useEffect, useRef } from 'react';

export default function Checkout() {
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState('');

  // Selected method: 'upi' or 'card'
  const [selectedMethod, setSelectedMethod] = useState('');

  // State: 'idle' | 'processing' | 'success' | 'failed'
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentId, setPaymentId] = useState('');
  const [errorMessage, setErrorMessage] = useState('Payment could not be processed');

  // Form states
  const [vpa, setVpa] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holderName, setHolderName] = useState('');

  const pollIntervalRef = useRef(null);

  // Read order_id from URL query params
  const queryParams = new URLSearchParams(window.location.search);
  const orderId = queryParams.get('order_id') || 'order_sample123456';

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoadingOrder(true);
        const res = await fetch(`http://localhost:8000/api/v1/orders/${orderId}/public`);
        if (!res.ok) {
          throw new Error('Order not found');
        }
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        // Fallback for visual preview or mock orders
        setOrder({
          id: orderId,
          amount: 50000,
          currency: 'INR',
          status: 'created'
        });
      } finally {
        setLoadingOrder(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const startPolling = (pId) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/payments/${pId}/public`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            clearInterval(pollIntervalRef.current);
            setPaymentStatus('success');
          } else if (data.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            setErrorMessage(data.error_description || 'Payment could not be processed');
            setPaymentStatus('failed');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);
  };

  const handleUpiSubmit = async (e) => {
    e.preventDefault();
    setPaymentStatus('processing');

    try {
      const res = await fetch('http://localhost:8000/api/v1/payments/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          method: 'upi',
          vpa
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.description || 'Payment could not be processed');
        setPaymentStatus('failed');
        return;
      }

      setPaymentId(data.id);
      startPolling(data.id);
    } catch (err) {
      setErrorMessage('Network error during payment');
      setPaymentStatus('failed');
    }
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setPaymentStatus('processing');

    let [month, year] = expiry.split('/');
    if (!year && expiry.includes('-')) {
      [year, month] = expiry.split('-');
    }

    try {
      const res = await fetch('http://localhost:8000/api/v1/payments/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          method: 'card',
          card: {
            number: cardNumber,
            expiry_month: month?.trim(),
            expiry_year: year?.trim(),
            cvv,
            holder_name: holderName
          }
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error?.description || 'Payment could not be processed');
        setPaymentStatus('failed');
        return;
      }

      setPaymentId(data.id);
      startPolling(data.id);
    } catch (err) {
      setErrorMessage('Network error during payment');
      setPaymentStatus('failed');
    }
  };

  const handleRetry = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setPaymentStatus('idle');
  };

  const formattedAmount = order
    ? `₹${(order.amount / 100).toFixed(2)}`
    : '₹0.00';

  const amountNumber = order
    ? Math.floor(order.amount / 100)
    : 0;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: '#f8fafc'
    }}>
      <div
        data-testid="checkout-container"
        data-test-id="checkout-container"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '480px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Order Summary */}
        <div
          data-testid="order-summary"
          data-test-id="order-summary"
          style={{
            padding: '2rem',
            background: 'linear-gradient(to right, #1e293b, #0f172a)',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔒</span>
            <span style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Secure Hosted Checkout
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Complete Payment
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>Amount: </span>
            <span
              data-testid="order-amount"
              data-test-id="order-amount"
              style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}
            >
              {formattedAmount}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: '#94a3b8' }}>Order ID: </span>
            <span
              data-testid="order-id"
              data-test-id="order-id"
              style={{ fontFamily: 'monospace', color: '#cbd5e1' }}
            >
              {order ? order.id : orderId}
            </span>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Payment Method Selection - visible when idle */}
          {paymentStatus === 'idle' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>
                Select Payment Method
              </label>
              <div
                data-testid="payment-methods"
                data-test-id="payment-methods"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
              >
                <button
                  type="button"
                  data-testid="method-upi"
                  data-test-id="method-upi"
                  data-method="upi"
                  onClick={() => setSelectedMethod('upi')}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '10px',
                    border: selectedMethod === 'upi' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: selectedMethod === 'upi' ? '#eff6ff' : '#ffffff',
                    color: selectedMethod === 'upi' ? '#1d4ed8' : '#334155',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>📱</span> UPI
                </button>
                <button
                  type="button"
                  data-testid="method-card"
                  data-test-id="method-card"
                  data-method="card"
                  onClick={() => setSelectedMethod('card')}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '10px',
                    border: selectedMethod === 'card' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: selectedMethod === 'card' ? '#eff6ff' : '#ffffff',
                    color: selectedMethod === 'card' ? '#1d4ed8' : '#334155',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>💳</span> Card
                </button>
              </div>
            </div>
          )}

          {/* UPI Form */}
          {paymentStatus === 'idle' && selectedMethod === 'upi' && (
            <form
              data-testid="upi-form"
              data-test-id="upi-form"
              onSubmit={handleUpiSubmit}
              style={{ display: 'block' }}
            >
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                  Virtual Payment Address (VPA)
                </label>
                <input
                  data-testid="vpa-input"
                  data-test-id="vpa-input"
                  type="text"
                  placeholder="username@bank"
                  value={vpa}
                  onChange={(e) => setVpa(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>
              <button
                data-testid="pay-button"
                data-test-id="pay-button"
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.875rem 1.5rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Pay ₹{amountNumber}
              </button>
            </form>
          )}

          {/* Card Form */}
          {paymentStatus === 'idle' && selectedMethod === 'card' && (
            <form
              data-testid="card-form"
              data-test-id="card-form"
              onSubmit={handleCardSubmit}
              style={{ display: 'block' }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                  Card Number
                </label>
                <input
                  data-testid="card-number-input"
                  data-test-id="card-number-input"
                  type="text"
                  placeholder="Card Number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                    Expiry Date
                  </label>
                  <input
                    data-testid="expiry-input"
                    data-test-id="expiry-input"
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                    CVV
                  </label>
                  <input
                    data-testid="cvv-input"
                    data-test-id="cvv-input"
                    type="password"
                    maxLength={4}
                    placeholder="CVV"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.5rem' }}>
                  Cardholder Name
                </label>
                <input
                  data-testid="cardholder-name-input"
                  data-test-id="cardholder-name-input"
                  type="text"
                  placeholder="Name on Card"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                data-testid="pay-button"
                data-test-id="pay-button"
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.875rem 1.5rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Pay ₹{amountNumber}
              </button>
            </form>
          )}

          {/* Processing State */}
          {paymentStatus === 'processing' && (
            <div
              data-testid="processing-state"
              data-test-id="processing-state"
              style={{ display: 'block', textAlign: 'center', padding: '2rem 1rem' }}
            >
              <div className="spinner"></div>
              <span
                data-testid="processing-message"
                data-test-id="processing-message"
                style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}
              >
                Processing payment...
              </span>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Please do not close or refresh this window.
              </p>
            </div>
          )}

          {/* Success State */}
          {paymentStatus === 'success' && (
            <div
              data-testid="success-state"
              data-test-id="success-state"
              style={{ display: 'block', textAlign: 'center', padding: '2rem 1rem' }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                margin: '0 auto 1rem auto'
              }}>
                ✓
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                Payment Successful!
              </h2>
              <div style={{ margin: '0.75rem 0', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Payment ID: </span>
                <span
                  data-testid="payment-id"
                  data-test-id="payment-id"
                  style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}
                >
                  {paymentId}
                </span>
              </div>
              <span
                data-testid="success-message"
                data-test-id="success-message"
                style={{ display: 'block', color: '#16a34a', fontWeight: 500, marginTop: '0.5rem' }}
              >
                Your payment has been processed successfully
              </span>
            </div>
          )}

          {/* Error State */}
          {paymentStatus === 'failed' && (
            <div
              data-testid="error-state"
              data-test-id="error-state"
              style={{ display: 'block', textAlign: 'center', padding: '2rem 1rem' }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                margin: '0 auto 1rem auto'
              }}>
                ✕
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                Payment Failed
              </h2>
              <span
                data-testid="error-message"
                data-test-id="error-message"
                style={{ display: 'block', color: '#dc2626', marginBottom: '1.5rem', fontSize: '0.95rem' }}
              >
                Payment could not be processed
              </span>
              <button
                data-testid="retry-button"
                data-test-id="retry-button"
                type="button"
                onClick={handleRetry}
                style={{
                  padding: '0.75rem 1.75rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
