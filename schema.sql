-- Run in Supabase SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  plan text not null default 'free' check (plan in ('free','pro')),
  monthly_generations integer not null default 0,
  quota_reset_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null,
  topic text,
  language text default 'both',
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
create policy "Users read own profile" on public.profiles for select using (auth.uid()=id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid()=id);
create policy "Users manage own projects" on public.projects for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
 insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''));
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();


-- Atomic quota consumption. Users cannot edit plan/quota columns directly.
create or replace function public.consume_generation()
returns table(allowed boolean, remaining integer, current_plan text)
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles%rowtype;
  cap integer;
begin
  insert into public.profiles(id) values(auth.uid()) on conflict(id) do nothing;
  select * into p from public.profiles where id=auth.uid() for update;
  if p.quota_reset_at < date_trunc('month', now()) then
    update public.profiles set monthly_generations=0, quota_reset_at=now()
    where id=auth.uid() returning * into p;
  end if;
  cap := case when p.plan='pro' then 300 else 10 end;
  if p.monthly_generations >= cap then
    return query select false, 0, p.plan;
  else
    update public.profiles set monthly_generations=monthly_generations+1
    where id=auth.uid() returning * into p;
    return query select true, greatest(cap-p.monthly_generations,0), p.plan;
  end if;
end; $$;
revoke all on function public.consume_generation() from public;
grant execute on function public.consume_generation() to authenticated;
