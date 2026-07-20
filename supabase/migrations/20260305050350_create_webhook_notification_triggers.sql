
-- Function to send webhook on new price report
CREATE OR REPLACE FUNCTION notify_new_price_report()
RETURNS TRIGGER AS $
DECLARE
  webhook_url text := current_setting('app.settings.tasklet_price_report_webhook_url', true);
BEGIN
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN NEW;
  END IF;
  PERFORM net.http_post(
    url := webhook_url,
    body := jsonb_build_object(
      'table', 'price_reports',
      'event', 'INSERT',
      'record', jsonb_build_object(
        'id', NEW.id,
        'pub_slug', NEW.pub_slug,
        'reported_price', NEW.reported_price,
        'beer_type', NEW.beer_type,
        'reporter_name', NEW.reporter_name,
        'report_type', NEW.report_type,
        'notes', NEW.notes,
        'status', NEW.status,
        'created_at', NEW.created_at
      )
    ),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send webhook on new pub submission
CREATE OR REPLACE FUNCTION notify_new_pub_submission()
RETURNS TRIGGER AS $
DECLARE
  webhook_url text := current_setting('app.settings.tasklet_pub_submission_webhook_url', true);
BEGIN
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN NEW;
  END IF;
  PERFORM net.http_post(
    url := webhook_url,
    body := jsonb_build_object(
      'table', 'pub_submissions',
      'event', 'INSERT',
      'record', jsonb_build_object(
        'id', NEW.id,
        'name', NEW.name,
        'suburb', NEW.suburb,
        'address', NEW.address,
        'reported_price', NEW.reported_price,
        'beer_type', NEW.beer_type,
        'reporter_name', NEW.reporter_name,
        'status', NEW.status,
        'created_at', NEW.created_at
      )
    ),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on price_reports
DROP TRIGGER IF EXISTS on_new_price_report ON price_reports;
CREATE TRIGGER on_new_price_report
  AFTER INSERT ON price_reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_price_report();

-- Trigger on pub_submissions
DROP TRIGGER IF EXISTS on_new_pub_submission ON pub_submissions;
CREATE TRIGGER on_new_pub_submission
  AFTER INSERT ON pub_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_pub_submission();
;
