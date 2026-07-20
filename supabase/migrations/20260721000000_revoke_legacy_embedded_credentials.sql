-- Legacy credentials were historically embedded in app_config and Tasklet
-- webhook function definitions. Runtime credentials now come from Infisical.
delete from app_config where key = 'push_api_secret';

drop trigger if exists on_new_price_report on price_reports;
drop trigger if exists on_new_pub_submission on pub_submissions;
drop function if exists notify_new_price_report();
drop function if exists notify_new_pub_submission();
