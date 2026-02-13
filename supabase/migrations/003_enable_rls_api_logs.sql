-- Enable RLS on api_logs (was missing from initial migration).
-- All app access uses the service_role key which bypasses RLS,
-- so no additional policies are needed.
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
