-- Seed: initial login account.
-- Run once in Supabase Dashboard > SQL Editor. Safe to re-run (skips if the email already exists).
-- DEV ONLY: change this password after first login, and don't reuse it in production.

create extension if not exists pgcrypto;

do $$
declare
  v_email    text := 'jessicac@ntv360.com';
  v_password text := 'Ntv360@PmDash2026';
  v_user_id  uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email = v_email) then
    raise notice 'User % already exists, skipping', v_email;
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    -- GoTrue expects these to be empty strings, not NULL, or sign-in fails.
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    v_email, crypt(v_password, gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id, v_user_id::text, 'email',
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    now(), now(), now()
  );
end $$;
