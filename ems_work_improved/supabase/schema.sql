-- EMS Leave Management System schema for Supabase
-- Run this once inside Supabase SQL Editor.

create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin', 'manager', 'hr', 'supervisor', 'staff');
create type public.leave_status as enum ('pending_supervisor', 'pending_hr', 'approved', 'rejected', 'cancelled');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role public.app_role not null default 'staff',
  department text,
  manager_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  annual_days_allowed integer not null default 0,
  requires_document boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  number_of_days integer not null check (number_of_days > 0),
  reason text,
  status public.leave_status not null default 'pending_supervisor',
  supervisor_comment text,
  hr_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  year integer not null,
  total_days integer not null default 0,
  used_days integer not null default 0,
  remaining_days integer generated always as (total_days - used_days) stored,
  unique(employee_id, leave_type_id, year)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'staff')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leave_requests_updated_at on public.leave_requests;
create trigger set_leave_requests_updated_at
before update on public.leave_requests
for each row execute procedure public.set_updated_at();

create or replace function public.refresh_leave_balance()
returns trigger language plpgsql security definer as $$
begin
  insert into public.leave_balances(employee_id, leave_type_id, year, total_days, used_days)
  select
    new.employee_id,
    new.leave_type_id,
    extract(year from new.start_date)::integer,
    lt.annual_days_allowed,
    case when new.status = 'approved' then new.number_of_days else 0 end
  from public.leave_types lt
  where lt.id = new.leave_type_id
  on conflict (employee_id, leave_type_id, year)
  do update set used_days = (
    select coalesce(sum(number_of_days), 0)
    from public.leave_requests lr
    where lr.employee_id = excluded.employee_id
      and lr.leave_type_id = excluded.leave_type_id
      and extract(year from lr.start_date)::integer = excluded.year
      and lr.status = 'approved'
  );
  return new;
end;
$$;

drop trigger if exists refresh_leave_balance_after_request on public.leave_requests;
create trigger refresh_leave_balance_after_request
after insert or update on public.leave_requests
for each row execute procedure public.refresh_leave_balance();

alter table public.profiles enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_balances enable row level security;

-- Simple practical policies for the app. You can tighten these later.
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "leave_types_select_authenticated" on public.leave_types;
create policy "leave_types_select_authenticated" on public.leave_types for select to authenticated using (true);

drop policy if exists "leave_types_insert_hr_admin" on public.leave_types;
create policy "leave_types_insert_hr_admin" on public.leave_types for insert to authenticated with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin', 'hr'))
);

drop policy if exists "leave_requests_select_relevant" on public.leave_requests;
create policy "leave_requests_select_relevant" on public.leave_requests for select to authenticated using (
  employee_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin', 'manager', 'hr', 'supervisor'))
);

drop policy if exists "leave_requests_insert_own" on public.leave_requests;
create policy "leave_requests_insert_own" on public.leave_requests for insert to authenticated with check (employee_id = auth.uid());

drop policy if exists "leave_requests_update_approvers" on public.leave_requests;
create policy "leave_requests_update_approvers" on public.leave_requests for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin', 'manager', 'hr', 'supervisor'))
);

drop policy if exists "leave_balances_select_relevant" on public.leave_balances;
create policy "leave_balances_select_relevant" on public.leave_balances for select to authenticated using (
  employee_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin', 'manager', 'hr', 'supervisor'))
);

create or replace function public.bootstrap_super_admin(target_email text)
returns text
language plpgsql
security definer
as $$
declare
  target_user_id uuid;
begin
  select id into target_user_id from auth.users where email = target_email limit 1;

  if target_user_id is null then
    raise exception 'No auth user found with email %', target_email;
  end if;

  insert into public.profiles(id, full_name, email, role)
  select id, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email, 'super_admin'
  from auth.users where id = target_user_id
  on conflict (id) do update set role = 'super_admin';

  return 'Super admin created for ' || target_email;
end;
$$;

insert into public.leave_types(name, annual_days_allowed, requires_document)
values
  ('Annual Leave', 21, false),
  ('Sick Leave', 14, true),
  ('Emergency Leave', 5, false),
  ('Compassionate Leave', 5, false),
  ('Maternity Leave', 90, true),
  ('Paternity Leave', 14, true)
on conflict (name) do nothing;
