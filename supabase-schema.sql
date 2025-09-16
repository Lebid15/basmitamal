-- ============ Tables ============
-- Donations: donor name + amount only
create table if not exists public.donations (
  id bigserial primary key,
  donor_name text not null,
  amount_usd numeric(12,2) not null check (amount_usd >= 0),
  created_at timestamptz default now()
);

-- Payment details: title + entity + phone
create table if not exists public.payment_details (
  id bigserial primary key,
  title text not null,
  entity_name text not null,
  phone text not null,
  created_at timestamptz default now()
);

-- Admins: link to auth.users
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- ============ RLS ============
alter table public.donations enable row level security;
alter table public.payment_details enable row level security;
alter table public.admins enable row level security;

-- Donations policies
drop policy if exists donations_select_all on public.donations;
create policy donations_select_all on public.donations
  for select using (true);

drop policy if exists donations_admin_write on public.donations;
create policy donations_admin_write on public.donations
  for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Payment details policies
drop policy if exists payment_details_select_all on public.payment_details;
create policy payment_details_select_all on public.payment_details
  for select using (true);

drop policy if exists payment_details_admin_write on public.payment_details;
create policy payment_details_admin_write on public.payment_details
  for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Admins policies
drop policy if exists admins_self_select on public.admins;
create policy admins_self_select on public.admins
  for select using (auth.uid() = user_id);

drop policy if exists admins_insert_only_admin on public.admins;
create policy admins_insert_only_admin on public.admins
  for insert
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ============ Function (atomic insert to both tables) ============
create or replace function public.insert_donation_and_payment(
  p_donor_name text,
  p_amount_usd numeric,
  p_title text,
  p_entity_name text,
  p_phone text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- require admin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  insert into public.donations (donor_name, amount_usd)
  values (p_donor_name, p_amount_usd);

  insert into public.payment_details (title, entity_name, phone)
  values (p_title, p_entity_name, p_phone);
end;
$$;

-- Limit function execution
revoke all on function public.insert_donation_and_payment(text, numeric, text, text, text) from public;
grant execute on function public.insert_donation_and_payment(text, numeric, text, text, text) to authenticated;
