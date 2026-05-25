
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  career text default '',
  semester int default 1,
  phone text default '',
  avatar_initials text default 'JC',
  rating numeric(3,2) default 5.0,
  trips_count int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles for update to authenticated using (auth.uid() = id);

-- RIDES
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  origin text not null,
  destination text not null,
  departure_time timestamptz not null,
  seats_total int not null default 1 check (seats_total between 1 and 6),
  seats_available int not null default 1,
  price numeric(10,2) default 0,
  vehicle text default '',
  notes text default '',
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  created_at timestamptz not null default now()
);
alter table public.rides enable row level security;
create index rides_departure_idx on public.rides (departure_time);
create index rides_driver_idx on public.rides (driver_id);

create policy "rides_select_auth" on public.rides for select to authenticated using (true);
create policy "rides_insert_owner" on public.rides for insert to authenticated with check (auth.uid() = driver_id);
create policy "rides_update_owner" on public.rides for update to authenticated using (auth.uid() = driver_id);
create policy "rides_delete_owner" on public.rides for delete to authenticated using (auth.uid() = driver_id);

-- RIDE REQUESTS
create table public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(),
  unique (ride_id, passenger_id)
);
alter table public.ride_requests enable row level security;

create policy "requests_select_involved" on public.ride_requests for select to authenticated using (
  auth.uid() = passenger_id or auth.uid() in (select driver_id from public.rides where id = ride_id)
);
create policy "requests_insert_passenger" on public.ride_requests for insert to authenticated with check (auth.uid() = passenger_id);
create policy "requests_update_involved" on public.ride_requests for update to authenticated using (
  auth.uid() = passenger_id or auth.uid() in (select driver_id from public.rides where id = ride_id)
);

-- RATINGS
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid references public.rides(id) on delete set null,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  rated_id uuid not null references public.profiles(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  tags text[] default '{}',
  comment text default '',
  created_at timestamptz not null default now()
);
alter table public.ratings enable row level security;

create policy "ratings_select_all" on public.ratings for select to authenticated using (true);
create policy "ratings_insert_self" on public.ratings for insert to authenticated with check (auth.uid() = rater_id);

-- TRIGGER: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  initials text;
  name text;
begin
  name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  initials := upper(substring(regexp_replace(name, '[^A-Za-z ]', '', 'g') from 1 for 1)) ||
              upper(coalesce(substring((select split_part(name, ' ', 2)) from 1 for 1), 'C'));
  insert into public.profiles (id, full_name, email, career, semester, phone, avatar_initials)
  values (
    new.id,
    name,
    new.email,
    coalesce(new.raw_user_meta_data->>'career', ''),
    coalesce((new.raw_user_meta_data->>'semester')::int, 1),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(nullif(initials,''), 'JC')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
