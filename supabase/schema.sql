-- ============================================================
-- FINVOX — Schema completo do banco de dados (Supabase/PostgreSQL)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text,
  email       text,
  avatar_url  text,
  currency    text default 'BRL',
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "Usuário vê seu próprio perfil"
  on profiles for select using (auth.uid() = id);

create policy "Usuário atualiza seu próprio perfil"
  on profiles for update using (auth.uid() = id);

create policy "Inserir perfil próprio"
  on profiles for insert with check (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao cadastrar
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- TABELA: categories
-- ============================================================
create table if not exists categories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade,
  name       text not null,
  icon       text default '💰',
  color      text default '#22c55e',
  type       text check (type in ('income', 'expense')) not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

alter table categories enable row level security;

create policy "Usuário vê suas categorias e padrões"
  on categories for select using (auth.uid() = user_id or is_default = true);

create policy "Usuário cria suas categorias"
  on categories for insert with check (auth.uid() = user_id);

create policy "Usuário atualiza suas categorias"
  on categories for update using (auth.uid() = user_id);

create policy "Usuário deleta suas categorias"
  on categories for delete using (auth.uid() = user_id);

-- Categorias padrão (inseridas uma vez)
insert into categories (user_id, name, icon, color, type, is_default) values
  (null, 'Salário',        '💼', '#22c55e', 'income',  true),
  (null, 'Freelance',      '💻', '#3b82f6', 'income',  true),
  (null, 'Investimentos',  '📈', '#8b5cf6', 'income',  true),
  (null, 'Outros (entrada)','➕', '#06b6d4', 'income',  true),
  (null, 'Alimentação',    '🍔', '#f97316', 'expense', true),
  (null, 'Transporte',     '🚗', '#eab308', 'expense', true),
  (null, 'Moradia',        '🏠', '#ef4444', 'expense', true),
  (null, 'Saúde',          '❤️', '#ec4899', 'expense', true),
  (null, 'Educação',       '📚', '#6366f1', 'expense', true),
  (null, 'Lazer',          '🎮', '#14b8a6', 'expense', true),
  (null, 'Roupas',         '👕', '#f43f5e', 'expense', true),
  (null, 'Assinaturas',    '📱', '#8b5cf6', 'expense', true),
  (null, 'Outros (saída)', '➖', '#64748b', 'expense', true);

-- ============================================================
-- TABELA: accounts (contas bancárias/carteiras)
-- ============================================================
create table if not exists accounts (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade,
  name       text not null,
  type       text check (type in ('checking', 'savings', 'credit', 'investment', 'cash', 'other')) default 'checking',
  balance    numeric(15,2) default 0,
  color      text default '#22c55e',
  icon       text default '🏦',
  created_at timestamptz default now()
);

alter table accounts enable row level security;

create policy "Usuário vê suas contas"
  on accounts for select using (auth.uid() = user_id);

create policy "Usuário cria suas contas"
  on accounts for insert with check (auth.uid() = user_id);

create policy "Usuário atualiza suas contas"
  on accounts for update using (auth.uid() = user_id);

create policy "Usuário deleta suas contas"
  on accounts for delete using (auth.uid() = user_id);

-- ============================================================
-- TABELA: transactions
-- ============================================================
create table if not exists transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references profiles(id) on delete cascade,
  account_id      uuid references accounts(id) on delete set null,
  category_id     uuid references categories(id) on delete set null,
  type            text check (type in ('income', 'expense', 'transfer')) not null,
  amount          numeric(15,2) not null,
  description     text not null,
  date            date not null default current_date,
  notes           text,
  voice_input     text,   -- transcrição original se veio por voz
  is_recurring    boolean default false,
  recurring_id    uuid,   -- agrupa recorrências
  created_at      timestamptz default now()
);

alter table transactions enable row level security;

create policy "Usuário vê suas transações"
  on transactions for select using (auth.uid() = user_id);

create policy "Usuário cria suas transações"
  on transactions for insert with check (auth.uid() = user_id);

create policy "Usuário atualiza suas transações"
  on transactions for update using (auth.uid() = user_id);

create policy "Usuário deleta suas transações"
  on transactions for delete using (auth.uid() = user_id);

-- Index para buscas por data
create index idx_transactions_user_date on transactions(user_id, date desc);
create index idx_transactions_user_type on transactions(user_id, type);

-- ============================================================
-- TABELA: goals (objetivos financeiros)
-- ============================================================
create table if not exists goals (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references profiles(id) on delete cascade,
  name          text not null,
  target_amount numeric(15,2) not null,
  current_amount numeric(15,2) default 0,
  deadline      date,
  icon          text default '🎯',
  color         text default '#22c55e',
  status        text check (status in ('active', 'completed', 'paused')) default 'active',
  created_at    timestamptz default now()
);

alter table goals enable row level security;

create policy "Usuário vê seus objetivos"
  on goals for select using (auth.uid() = user_id);

create policy "Usuário cria seus objetivos"
  on goals for insert with check (auth.uid() = user_id);

create policy "Usuário atualiza seus objetivos"
  on goals for update using (auth.uid() = user_id);

create policy "Usuário deleta seus objetivos"
  on goals for delete using (auth.uid() = user_id);

-- ============================================================
-- TABELA: budgets (planejamento mensal)
-- ============================================================
create table if not exists budgets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  month       int check (month between 1 and 12),
  year        int,
  amount      numeric(15,2) not null,
  created_at  timestamptz default now(),
  unique(user_id, category_id, month, year)
);

alter table budgets enable row level security;

create policy "Usuário vê seu planejamento"
  on budgets for select using (auth.uid() = user_id);

create policy "Usuário cria seu planejamento"
  on budgets for insert with check (auth.uid() = user_id);

create policy "Usuário atualiza seu planejamento"
  on budgets for update using (auth.uid() = user_id);

create policy "Usuário deleta seu planejamento"
  on budgets for delete using (auth.uid() = user_id);

-- ============================================================
-- TABELA: assets (patrimônio)
-- ============================================================
create table if not exists assets (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade,
  name       text not null,
  type       text check (type in ('real_estate', 'vehicle', 'investment', 'crypto', 'other')) default 'other',
  value      numeric(15,2) not null,
  notes      text,
  created_at timestamptz default now()
);

alter table assets enable row level security;

create policy "Usuário vê seu patrimônio"
  on assets for select using (auth.uid() = user_id);

create policy "Usuário cria seu patrimônio"
  on assets for insert with check (auth.uid() = user_id);

create policy "Usuário atualiza seu patrimônio"
  on assets for update using (auth.uid() = user_id);

create policy "Usuário deleta seu patrimônio"
  on assets for delete using (auth.uid() = user_id);

-- ============================================================
-- VIEW: monthly_summary
-- ============================================================
create or replace view monthly_summary as
select
  user_id,
  extract(year  from date)::int as year,
  extract(month from date)::int as month,
  sum(case when type = 'income'  then amount else 0 end) as total_income,
  sum(case when type = 'expense' then amount else 0 end) as total_expense,
  sum(case when type = 'income'  then amount
           when type = 'expense' then -amount
           else 0 end) as balance
from transactions
group by user_id, year, month;
