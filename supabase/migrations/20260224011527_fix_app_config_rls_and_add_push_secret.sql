
-- Drop overly permissive policy (was letting anon read private keys)
DROP POLICY IF EXISTS "Service role reads all config" ON app_config;

-- Runtime push credentials are provisioned out-of-band through Infisical.
-- The historical literal value is intentionally omitted from repository history.
;
