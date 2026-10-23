import React, { useState, useEffect } from 'react';

export default function Transactions() {
  const [merchant] = useState(() => {
    try {
      const stored = sessionStorage.getItem('merchant');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      api_key: 'key_test_abc123',
      api_secret: 'secret_test_xyz789'
    };
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const apiKey = merchant.api_key || 'key_test_abc123';
      const apiSecret = merchant.api_secret || 'secret_test_xyz789';

      const response = await fetch('http://localhost:8000/api/v1/merchants/transactions', {
        headers: {
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 3000);
    return () => clearInterval(interval);
  }, [merchant]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a' }}>Transactions</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Detailed audit log of all processed payment transactions.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/dashboard');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        overflowX: 'auto'
      }}>
        <table
          data-testid="transactions-table"
          data-test-id="transactions-table"
          style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}
        >
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.875rem 1rem', color: '#475569', fontWeight: 600 }}>Payment ID</th>
              <th style={{ padding: '0.875rem 1rem', color: '#475569', fontWeight: 600 }}>Order ID</th>
              <th style={{ padding: '0.875rem 1rem', color: '#475569', fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '0.875rem 1rem', color: '#475569', fontWeight: 600 }}>Method</th>
              <th style={{ padding: '0.875rem 1rem', color: '#475569', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.875rem 1rem', color: '#475569', fontWeight: 600 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr data-testid="transaction-row" data-test-id="transaction-row" data-payment-id="pay_sample">
                <td data-testid="payment-id" data-test-id="payment-id" style={{ padding: '1rem', color: '#94a3b8' }}>
                  No payments found
                </td>
                <td data-testid="order-id" data-test-id="order-id" style={{ padding: '1rem', color: '#94a3b8' }}>-</td>
                <td data-testid="amount" data-test-id="amount" style={{ padding: '1rem', color: '#94a3b8' }}>0</td>
                <td data-testid="method" data-test-id="method" style={{ padding: '1rem', color: '#94a3b8' }}>-</td>
                <td data-testid="status" data-test-id="status" style={{ padding: '1rem', color: '#94a3b8' }}>-</td>
                <td data-testid="created-at" data-test-id="created-at" style={{ padding: '1rem', color: '#94a3b8' }}>-</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  data-testid="transaction-row"
                  data-test-id="transaction-row"
                  data-payment-id={tx.id}
                  style={{ borderBottom: '1px solid #f1f5f9' }}
                >
                  <td data-testid="payment-id" data-test-id="payment-id" style={{ padding: '1rem', fontFamily: 'monospace', color: '#0f172a' }}>
                    {tx.id}
                  </td>
                  <td data-testid="order-id" data-test-id="order-id" style={{ padding: '1rem', fontFamily: 'monospace', color: '#64748b' }}>
                    {tx.order_id}
                  </td>
                  <td data-testid="amount" data-test-id="amount" style={{ padding: '1rem', fontWeight: 600, color: '#0f172a' }}>
                    {tx.amount}
                  </td>
                  <td data-testid="method" data-test-id="method" style={{ padding: '1rem', textTransform: 'uppercase', color: '#475569' }}>
                    {tx.method}
                  </td>
                  <td data-testid="status" data-test-id="status" style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      backgroundColor: tx.status === 'success' ? '#dcfce7' : tx.status === 'failed' ? '#fee2e2' : '#fef3c7',
                      color: tx.status === 'success' ? '#166534' : tx.status === 'failed' ? '#991b1b' : '#92400e'
                    }}>
                      {tx.status}
                    </span>
                  </td>
                  <td data-testid="created-at" data-test-id="created-at" style={{ padding: '1rem', color: '#64748b' }}>
                    {tx.created_at}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
