-- M27a: Add referral source tracking for marketing attribution
alter table public.users add column referral_source text;

-- Update the handle_new_user trigger to capture referral source from auth metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, referral_source)
  values (
    new.id,
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 8),
    new.raw_user_meta_data ->> 'referral_source'
  );
  return new;
end;
$$ language plpgsql security definer;
