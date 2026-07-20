
ALTER TABLE price_reports
  ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'price_report',
  ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN price_reports.report_type IS 'price_report or outdated_flag';
COMMENT ON COLUMN price_reports.notes IS 'Optional user notes about the report';
;
