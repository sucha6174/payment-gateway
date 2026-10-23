-- Create extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Merchants Table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    api_secret VARCHAR(64) NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount >= 100),
    currency VARCHAR(3) DEFAULT 'INR',
    receipt VARCHAR(255),
    notes JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_order_id_format CHECK (id ~ '^order_[a-zA-Z0-9]{16}$')
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    method VARCHAR(20) NOT NULL CHECK (method IN ('upi', 'card')),
    status VARCHAR(20) DEFAULT 'processing',
    vpa VARCHAR(255),
    card_network VARCHAR(20),
    card_last4 VARCHAR(4),
    error_code VARCHAR(50),
    error_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_payment_id_format CHECK (id ~ '^pay_[a-zA-Z0-9]{16}$')
);

-- Required Indexes
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Automatic Seed for Test Merchant
INSERT INTO merchants (id, name, email, api_key, api_secret, is_active, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Test Merchant',
    'test@example.com',
    'key_test_abc123',
    'secret_test_xyz789',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;
