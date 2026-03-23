-- Schedule send-email-digest edge function via pg_cron
-- Runs every hour; the function itself checks each user's preferred time/frequency
-- Fully idempotent: safe to re-run

-- Enable pg_cron extension (available on Supabase Pro plans)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant usage so cron jobs can call net functions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Remove existing job if present (idempotent)
SELECT cron.unschedule('send-email-digest')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-email-digest'
);

-- Schedule: every hour at minute 0
-- Calls the edge function via pg_net (HTTP extension)
SELECT cron.schedule(
  'send-email-digest',        -- job name
  '0 * * * *',                -- every hour on the hour
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-email-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
