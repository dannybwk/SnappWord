-- Track subscription expiry on users and months paid on upgrade requests.

-- Users: when their current paid plan expires
ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMPTZ;
CREATE INDEX idx_users_subscription_expires ON users(subscription_expires_at)
  WHERE subscription_expires_at IS NOT NULL;

-- Upgrade requests: how many months the user paid for
ALTER TABLE upgrade_requests ADD COLUMN months_paid INT NOT NULL DEFAULT 1;
