-- ============================================================
-- Cottage Management App — Initial Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz default now() not null
);

-- Knowledge categories
create table if not exists public.knowledge_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  icon text not null default '📋',
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Knowledge articles
create table if not exists public.knowledge_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  content text not null default '',
  category_id uuid references public.knowledge_categories(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_published boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Trips
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Trip attendees (join table)
create table if not exists public.trip_attendees (
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  primary key (trip_id, user_id)
);

-- Meals
create table if not exists public.meals (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  name text not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  date date not null,
  notes text,
  created_at timestamptz default now() not null
);

-- Meal items (ingredients)
create table if not exists public.meal_items (
  id uuid default gen_random_uuid() primary key,
  meal_id uuid references public.meals(id) on delete cascade not null,
  name text not null,
  quantity text,
  unit text,
  assigned_to uuid references public.profiles(id) on delete set null,
  cost numeric(10,2),
  is_brought boolean default false not null,
  created_at timestamptz default now() not null
);

-- Supply items
create table if not exists public.supply_items (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  name text not null,
  category text not null check (category in ('food', 'water', 'alcohol', 'supplies', 'other')),
  quantity text,
  unit text,
  assigned_to uuid references public.profiles(id) on delete set null,
  cost numeric(10,2),
  is_brought boolean default false not null,
  is_at_cottage boolean default false not null,
  created_at timestamptz default now() not null
);

-- Pantry items (permanent cottage inventory)
create table if not exists public.pantry_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null default 'general',
  quantity text,
  unit text,
  last_updated_by uuid references public.profiles(id) on delete set null,
  last_updated_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Maintenance tasks
create table if not exists public.maintenance_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text not null default 'general',
  frequency text not null check (frequency in ('annual', 'seasonal', 'monthly', 'as-needed')),
  month_due integer check (month_due between 1 and 12),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  notes text,
  created_at timestamptz default now() not null
);

-- Maintenance logs
create table if not exists public.maintenance_logs (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.maintenance_tasks(id) on delete cascade not null,
  completed_by uuid references public.profiles(id) on delete set null not null,
  completed_date date not null,
  notes text,
  created_at timestamptz default now() not null
);

-- Improvements / wishlist
create table if not exists public.improvements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'idea' check (status in ('idea', 'planned', 'in-progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  suggested_by uuid references public.profiles(id) on delete set null not null,
  estimated_cost numeric(10,2),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Cottage stays (who's there when)
create table if not exists public.cottage_stays (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  notes text,
  is_confirmed boolean default true not null,
  created_at timestamptz default now() not null
);

-- Expenses
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  description text not null,
  amount numeric(10,2) not null,
  paid_by uuid references public.profiles(id) on delete set null not null,
  date date not null,
  created_at timestamptz default now() not null
);

-- Expense splits
create table if not exists public.expense_splits (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount_owed numeric(10,2) not null,
  is_settled boolean default false not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.knowledge_categories enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_attendees enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.supply_items enable row level security;
alter table public.pantry_items enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.improvements enable row level security;
alter table public.cottage_stays enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;

-- All authenticated users can read and write everything (family trust model)
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'knowledge_categories', 'knowledge_articles',
    'trips', 'trip_attendees', 'meals', 'meal_items', 'supply_items',
    'pantry_items', 'maintenance_tasks', 'maintenance_logs', 'improvements',
    'cottage_stays', 'expenses', 'expense_splits'
  ]
  loop
    execute format('create policy "Authenticated users can read %I" on public.%I for select using (auth.role() = ''authenticated'')', t, t);
    execute format('create policy "Authenticated users can insert %I" on public.%I for insert with check (auth.role() = ''authenticated'')', t, t);
    execute format('create policy "Authenticated users can update %I" on public.%I for update using (auth.role() = ''authenticated'')', t, t);
    execute format('create policy "Authenticated users can delete %I" on public.%I for delete using (auth.role() = ''authenticated'')', t, t);
  end loop;
end $$;

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on articles and improvements
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_articles_updated_at
  before update on public.knowledge_articles
  for each row execute function public.set_updated_at();

create trigger set_improvements_updated_at
  before update on public.improvements
  for each row execute function public.set_updated_at();

-- ============================================================
-- Seed Data: Knowledge Categories
-- ============================================================

insert into public.knowledge_categories (name, slug, icon, sort_order) values
  ('Opening Up',        'opening',     '🌱', 1),
  ('Closing for Winter','closing',     '❄️', 2),
  ('Boats',             'boats',       '⛵', 3),
  ('Propane Systems',   'propane',     '🔥', 4),
  ('Solar & Power',     'solar',       '☀️', 5),
  ('Water Systems',     'water',       '💧', 6),
  ('Emergency',         'emergency',   '🚨', 7),
  ('General',           'general',     '📋', 8)
on conflict (slug) do nothing;

-- ============================================================
-- Seed Data: Maintenance Tasks
-- ============================================================

insert into public.maintenance_tasks (title, description, category, frequency, month_due, priority) values
  -- Spring (May)
  ('Open water system', 'Turn on main water, check all pipes for winter damage, prime pump', 'Water', 'annual', 5, 'high'),
  ('Start propane system', 'Check propane lines, light fridge pilot, test all burners', 'Propane', 'annual', 5, 'high'),
  ('Launch boats', 'Remove storage covers, check hull, test motor, launch from dock', 'Boats', 'annual', 5, 'high'),
  ('Check solar system', 'Inspect panels, clean if needed, test battery bank charge level', 'Solar', 'annual', 5, 'medium'),
  ('Dock setup', 'Install dock sections, check fasteners and decking, add ladder', 'Dock', 'annual', 5, 'medium'),
  ('Opening inspection', 'Check for winter damage: roof, windows, doors, deck, foundation', 'General', 'annual', 5, 'high'),

  -- Fall (October)
  ('Winterize water system', 'Drain all pipes, add antifreeze to traps, shut off main valve', 'Water', 'annual', 10, 'high'),
  ('Propane shutdown', 'Turn off all propane appliances, close tank valves, remove regulators if needed', 'Propane', 'annual', 10, 'high'),
  ('Haul out boats', 'Pull boats from water, flush motors, fog engine, cover and store', 'Boats', 'annual', 10, 'high'),
  ('Solar battery storage', 'Bring batteries inside or disconnect for winter to prevent freezing', 'Solar', 'annual', 10, 'medium'),
  ('Remove dock', 'Pull dock sections, store on shore, secure against ice', 'Dock', 'annual', 10, 'medium'),
  ('Closing inspection', 'Board up windows if needed, mouse-proof openings, document any issues', 'General', 'annual', 10, 'high'),

  -- Summer monthly
  ('Monthly water quality test', 'Test water from lake intake, check chlorine/UV system', 'Water', 'monthly', null, 'medium'),
  ('Check propane levels', 'Read gauge on all propane tanks, order refill if below 25%', 'Propane', 'monthly', null, 'medium'),
  ('Boat motor service check', 'Check oil, impeller, zincs; grease fittings; inspect prop', 'Boats', 'monthly', null, 'low'),
  ('Solar battery check', 'Check voltage levels, inspect connections for corrosion', 'Solar', 'monthly', null, 'low'),

  -- As-needed
  ('Replace water filter', 'Replace sediment and carbon filters in water treatment system', 'Water', 'as-needed', null, 'medium'),
  ('Outboard tune-up', 'Full service: plugs, filters, impeller, gear oil', 'Boats', 'as-needed', null, 'medium')
on conflict do nothing;
