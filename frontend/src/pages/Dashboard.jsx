import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [merchant, setMerchant] = useState(() => {
    try {
      const stored = sessionStorage.getItem('merchant');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      api_key: 'key_test_abc123',
      api_secret: 'secret_test_xyz789'
    };
  });

  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: '₹0',
    successRate: '0%'
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const apiKey = merchant.api_key || 'key_test_abc123';
      const apiSecret = merchant.api_secret || 'secret_test_xyz789';

      const response = await fetch('http://localhost:8000/api/v1/merchants/stats', {
        headers: {
          'X-Api-Key': apiKey,
          'X-Api-Secret': apiSecret
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedAmount = '₹' + Number(data.total_amount_rupees || 0).toLocaleString('en-IN');
        setStats({
          totalTransactions: data.total_transactions ?? 0,
          totalAmount: formattedAmount,
          successRate: `${data.success_rate ?? 0}%`
        });
      }
    } catch (err) {
      console.error('Error fetching merchant stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [merchant]);

  return (
    <div data-testid="dashboard" data-test-id="dashboard" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a' }}>Merchant Overview</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Monitor your API integration, transactions, and live gateway performance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/dashboard/transactions');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            View Transactions
          </button>
        </div>
      </header>

      {/* API Credentials Section */}
      <div
        data-testid="api-credentials"
        data-test-id="api-credentials"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          border: '1px solid #e2e8f0'
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
          API Credentials
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>
              API Key
            </label>
            <span
              data-testid="api-key"
              data-test-id="api-key"
              style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#0f172a', fontWeight: 600, wordBreak: 'break-all' }}
            >
              {merchant.api_key || 'key_test_abc123'}
            </span>
          </div>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>
              API Secret
            </label>
            <span
              data-testid="api-secret"
              data-test-id="api-secret"
              style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#0f172a', fontWeight: 600, wordBreak: 'break-all' }}
            >
              {merchant.api_secret || 'secret_test_xyz789'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem' }}>
        Performance Metrics
      </h2>
      <div
        data-testid="stats-container"
        data-test-id="stats-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem'
        }}
      >
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}>
            Total Transactions
          </p>
          <div
            data-testid="total-transactions"
            data-test-id="total-transactions"
            style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}
          >
            {stats.totalTransactions}
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}>
            Total Settled Amount
          </p>
          <div
            data-testid="total-amount"
            data-test-id="total-amount"
            style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}
          >
            {stats.totalAmount}
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}>
            Success Rate
          </p>
          <div
            data-testid="success-rate"
            data-test-id="success-rate"
            style={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}
          >
            {stats.successRate}
          </div>
        </div>
      </div>
    </div>
  );
}
