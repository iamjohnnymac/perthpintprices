do $$
begin
  if exists (
    select call_sid
    from phone_call_log
    where call_sid is not null
    group by call_sid
    having count(*) > 1
  ) then
    raise exception 'phone_call_log contains duplicate call_sid values; audit before applying idempotency index';
  end if;
end $$;

create unique index if not exists phone_call_log_call_sid_unique
  on phone_call_log (call_sid)
  where call_sid is not null;

create or replace function process_agent_post_call(
  p_call_log jsonb,
  p_pub_id bigint,
  p_pub_updates jsonb,
  p_price_history jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fallback_written boolean := false;
begin
  insert into phone_call_log (
    pub_id,
    call_sid,
    transcript,
    recording_url,
    parsed_price,
    parsed_beer_type,
    parsed_confidence,
    parsed_notes
  ) values (
    (p_call_log->>'pub_id')::bigint,
    p_call_log->>'call_sid',
    p_call_log->>'transcript',
    p_call_log->>'recording_url',
    (p_call_log->>'parsed_price')::numeric,
    p_call_log->>'parsed_beer_type',
    p_call_log->>'parsed_confidence',
    p_call_log->>'parsed_notes'
  )
  on conflict (call_sid) where call_sid is not null do nothing;

  if not found then
    return jsonb_build_object('processed', false, 'fallback_written', false);
  end if;

  if p_pub_id is not null and p_pub_updates <> '{}'::jsonb then
    update pubs
    set
      price = case when p_pub_updates ? 'price' then (p_pub_updates->>'price')::numeric else price end,
      price_verified = case when p_pub_updates ? 'price_verified' then (p_pub_updates->>'price_verified')::boolean else price_verified end,
      last_verified = case when p_pub_updates ? 'last_verified' then (p_pub_updates->>'last_verified')::timestamptz else last_verified end,
      price_verified_at = case when p_pub_updates ? 'price_verified_at' then (p_pub_updates->>'price_verified_at')::timestamptz else price_verified_at end,
      price_source = case when p_pub_updates ? 'price_source' then p_pub_updates->>'price_source' else price_source end,
      price_confidence = case when p_pub_updates ? 'price_confidence' then p_pub_updates->>'price_confidence' else price_confidence end,
      beer_type = case when p_pub_updates ? 'beer_type' then p_pub_updates->>'beer_type' else beer_type end,
      happy_hour = case when p_pub_updates ? 'happy_hour' then p_pub_updates->>'happy_hour' else happy_hour end
    where id = p_pub_id
      and price_verified is not true;

    v_fallback_written := found;
  end if;

  if p_price_history is not null and v_fallback_written then
    insert into price_history (
      pub_id,
      price,
      beer_type,
      change_type,
      source,
      verified_at,
      confidence
    ) values (
      (p_price_history->>'pub_id')::bigint,
      (p_price_history->>'price')::numeric,
      p_price_history->>'beer_type',
      p_price_history->>'change_type',
      p_price_history->>'source',
      (p_price_history->>'verified_at')::timestamptz,
      p_price_history->>'confidence'
    );
  end if;

  return jsonb_build_object('processed', true, 'fallback_written', v_fallback_written);
end;
$$;

revoke all on function process_agent_post_call(jsonb, bigint, jsonb, jsonb) from public;
grant execute on function process_agent_post_call(jsonb, bigint, jsonb, jsonb) to service_role;

create or replace function record_agent_price(
  p_pub_id bigint,
  p_pub_updates jsonb,
  p_price_history jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update pubs
  set
    price = case when p_pub_updates ? 'price' then (p_pub_updates->>'price')::numeric else price end,
    price_verified = case when p_pub_updates ? 'price_verified' then (p_pub_updates->>'price_verified')::boolean else price_verified end,
    last_verified = case when p_pub_updates ? 'last_verified' then (p_pub_updates->>'last_verified')::timestamptz else last_verified end,
    price_verified_at = case when p_pub_updates ? 'price_verified_at' then (p_pub_updates->>'price_verified_at')::timestamptz else price_verified_at end,
    price_source = case when p_pub_updates ? 'price_source' then p_pub_updates->>'price_source' else price_source end,
    price_confidence = case when p_pub_updates ? 'price_confidence' then p_pub_updates->>'price_confidence' else price_confidence end,
    beer_type = case when p_pub_updates ? 'beer_type' then p_pub_updates->>'beer_type' else beer_type end,
    happy_hour = case when p_pub_updates ? 'happy_hour' then p_pub_updates->>'happy_hour' else happy_hour end
  where id = p_pub_id;

  if not found then
    raise exception 'agent price pub % not found', p_pub_id;
  end if;

  if p_price_history is not null then
    insert into price_history (
      pub_id,
      price,
      beer_type,
      change_type,
      source,
      verified_at,
      confidence
    ) values (
      (p_price_history->>'pub_id')::bigint,
      (p_price_history->>'price')::numeric,
      p_price_history->>'beer_type',
      p_price_history->>'change_type',
      p_price_history->>'source',
      (p_price_history->>'verified_at')::timestamptz,
      p_price_history->>'confidence'
    );
  end if;
end;
$$;

revoke all on function record_agent_price(bigint, jsonb, jsonb) from public;
grant execute on function record_agent_price(bigint, jsonb, jsonb) to service_role;

create table if not exists admin_auth_rate_limits (
  client_hash text primary key,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table admin_auth_rate_limits enable row level security;
revoke all on admin_auth_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on admin_auth_rate_limits to service_role;

create or replace function reserve_admin_auth_attempt(p_client_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts integer;
  v_window_started timestamptz;
  v_blocked_until timestamptz;
begin
  insert into admin_auth_rate_limits (client_hash, attempts, window_started_at, updated_at)
  values (p_client_hash, 0, now(), now())
  on conflict (client_hash) do nothing;

  select attempts, window_started_at, blocked_until
    into v_attempts, v_window_started, v_blocked_until
  from admin_auth_rate_limits
  where client_hash = p_client_hash
  for update;

  if v_blocked_until is not null and v_blocked_until > now() then
    return jsonb_build_object(
      'allowed', false,
      'retry_after_seconds', greatest(1, ceil(extract(epoch from (v_blocked_until - now())))::integer)
    );
  end if;

  if v_window_started < now() - interval '15 minutes' then
    v_attempts := 1;
    v_window_started := now();
  else
    v_attempts := v_attempts + 1;
  end if;

  update admin_auth_rate_limits
  set attempts = v_attempts,
      window_started_at = v_window_started,
      blocked_until = case when v_attempts >= 5 then now() + interval '15 minutes' else null end,
      updated_at = now()
  where client_hash = p_client_hash;

  -- The fifth attempt is allowed to complete; the row is already blocked so
  -- every concurrently queued or subsequent attempt is rejected.
  return jsonb_build_object('allowed', true);
end;
$$;

create or replace function clear_admin_rate_limit(p_client_hash text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from admin_auth_rate_limits where client_hash = p_client_hash;
$$;

revoke all on function reserve_admin_auth_attempt(text) from public;
revoke all on function clear_admin_rate_limit(text) from public;
grant execute on function reserve_admin_auth_attempt(text) to service_role;
grant execute on function clear_admin_rate_limit(text) to service_role;
