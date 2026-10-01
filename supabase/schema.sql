-- Jalankan di Supabase Dashboard > SQL Editor
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null check (role in ('manager','staff')),
  avatar text,
  created_at timestamptz default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'pending' check (status in ('active','pending')),
  created_by uuid references public.users(id),
  assigned_staff uuid[] default '{}',
  created_at timestamptz default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  sku text not null,
  name text not null,
  current_stock integer not null default 0,
  min_stock_threshold integer not null default 0,
  cost_price numeric not null default 0,
  sell_price numeric not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items(id) on delete cascade,
  user_id uuid references public.users(id),
  type text not null check (type in ('IN','OUT','ADJUST')),
  quantity integer not null,
  notes text default '',
  created_at timestamptz default now()
);

-- RLS: aktifkan & izinkan akses via anon key (ketatkan lagi sesuai kebutuhan auth)
alter table public.users enable row level security;
alter table public.brands enable row level security;
alter table public.items enable row level security;
alter table public.transactions enable row level security;

create policy "read all"   on public.users        for select using (true);
create policy "write all"  on public.users        for insert with check (true);
create policy "read all"   on public.brands       for select using (true);
create policy "write all"  on public.brands       for insert with check (true);
create policy "update all" on public.brands       for update using (true);
create policy "read all"   on public.items        for select using (true);
create policy "write all"  on public.items        for insert with check (true);
create policy "update all" on public.items        for update using (true);
create policy "read all"   on public.transactions for select using (true);
create policy "write all"  on public.transactions for insert with check (true);

-- Data awal (opsional, sama dengan mockData.ts)
insert into public.users (id, full_name, role) values
 ('11111111-1111-1111-1111-111111111111','Ahmad Manager','manager'),
 ('22222222-2222-2222-2222-222222222222','Budi Staff','staff'),
 ('33333333-3333-3333-3333-333333333333','Citra Staff','staff'),
 ('44444444-4444-4444-4444-444444444444','Dedi Staff','staff')
on conflict do nothing;
