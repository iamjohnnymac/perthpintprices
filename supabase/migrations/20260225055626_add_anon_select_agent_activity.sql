
-- Allow anon to read agent_activity (operational logs, not sensitive)
-- The admin API endpoint is password-protected server-side
CREATE POLICY "Allow anon to read agent_activity"
ON agent_activity
FOR SELECT
TO anon
USING (true);

-- Allow anon to insert (for logging failed auth attempts from API route)
CREATE POLICY "Allow anon to insert agent_activity"
ON agent_activity
FOR INSERT
TO anon
WITH CHECK (true);
;
