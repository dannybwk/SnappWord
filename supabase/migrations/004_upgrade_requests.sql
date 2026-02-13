-- Upgrade requests: track payment proof submissions and admin review.
CREATE TABLE upgrade_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    payment_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'waiting_image',
    -- 'waiting_image' → waiting for payment screenshot
    -- 'pending'       → screenshot received, awaiting review
    -- 'approved'      → approved by admin
    -- 'rejected'      → rejected by admin
    approved_tier TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_upgrade_requests_user_status ON upgrade_requests(user_id, status);
CREATE INDEX idx_upgrade_requests_status ON upgrade_requests(status);

-- RLS: service role has full access (same pattern as other tables)
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on upgrade_requests"
    ON upgrade_requests FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);
