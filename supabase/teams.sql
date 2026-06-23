-- ════════════════════════════════════════════════════════════════
--  Offset — Teams / shared access (read-only sharing)
--
--  Run this AFTER schema.sql. It is ADDITIVE and owner-preserving: it only
--  GRANTS members read access to a workspace; it never changes who can write
--  (owners keep full control; shared users are read-only). Safe to re-run.
--
--  ⚠️ This touches row-level security. Test on a copy/branch first if you can.
-- ════════════════════════════════════════════════════════════════

-- Who can see whose workspace. The "owner" is the user_id that owns the data
-- rows; a "member" is granted read access. Emails are denormalised so the UI
-- can show them without reading auth.users.
create table if not exists public.memberships (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  member_id    uuid not null references auth.users(id) on delete cascade,
  owner_email  text,
  member_email text,
  role         text not null default 'viewer',
  created_at   timestamptz not null default now(),
  unique (owner_id, member_id)
);

alter table public.memberships enable row level security;

-- A user can see memberships that involve them (as owner or member).
drop policy if exists "memberships involve me" on public.memberships;
create policy "memberships involve me" on public.memberships
  for select using (auth.uid() = owner_id or auth.uid() = member_id);

-- Owners can manage (remove) their own shares from the app. New invites are
-- created by the /api/team/invite function with the service role.
drop policy if exists "owner manages memberships" on public.memberships;
create policy "owner manages memberships" on public.memberships
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- SECURITY DEFINER so it can read memberships without recursive RLS checks.
create or replace function public.can_read_workspace(owner uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select owner = auth.uid()
      or exists (
        select 1 from public.memberships m
        where m.owner_id = owner and m.member_id = auth.uid()
      );
$$;

-- Add a READ policy so members can select an owner's rows. The existing
-- "own …" policies (full owner access incl. writes) stay exactly as they were,
-- so nothing the owner can do changes.
drop policy if exists "read shared properties" on public.properties;
create policy "read shared properties" on public.properties
  for select using (public.can_read_workspace(user_id));

drop policy if exists "read shared expenses" on public.expenses;
create policy "read shared expenses" on public.expenses
  for select using (public.can_read_workspace(user_id));

drop policy if exists "read shared income" on public.income;
create policy "read shared income" on public.income
  for select using (public.can_read_workspace(user_id));

-- Let the function be called by signed-in users.
grant execute on function public.can_read_workspace(uuid) to authenticated;
