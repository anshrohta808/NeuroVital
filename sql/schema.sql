-- NeuroVital database schema

create extension if not exists "vector";
create extension if not exists "pgcrypto";

create table if not exists vitals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  height_cm numeric not null,
  weight_kg numeric not null,
  created_at timestamptz default now()
);

create table if not exists family_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  has_diabetes boolean default false,
  has_heart_disease boolean default false,
  has_hypertension boolean default false,
  has_cancer boolean default false,
  notes text,
  created_at timestamptz default now()
);

create table if not exists lab_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  report_name text,
  raw_text text,
  hemoglobin numeric,
  cholesterol numeric,
  vitamin_d numeric,
  tsh numeric,
  fasting_glucose numeric,
  uric_acid numeric,
  creatinine numeric,
  systolic_bp numeric,
  diastolic_bp numeric,
  created_at timestamptz default now()
);

create table if not exists mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  mood_score integer not null,
  energy_score integer not null,
  stress_score integer not null,
  notes text,
  logged_at timestamptz default now()
);

create table if not exists mental_chat (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  source_table text not null,
  source_id uuid not null,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz default now()
);

create index if not exists vitals_user_idx on vitals(user_id, created_at desc);
create index if not exists family_history_user_idx on family_history(user_id, created_at desc);
create index if not exists lab_reports_user_idx on lab_reports(user_id, created_at desc);
create index if not exists mood_logs_user_idx on mood_logs(user_id, logged_at desc);
create index if not exists mental_chat_user_idx on mental_chat(user_id, created_at desc);

create index if not exists embeddings_user_idx on embeddings(user_id, created_at desc);
create index if not exists embeddings_embedding_idx on embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table vitals enable row level security;
alter table family_history enable row level security;
alter table lab_reports enable row level security;
alter table mood_logs enable row level security;
alter table mental_chat enable row level security;
alter table embeddings enable row level security;

create policy "vitals_select" on vitals for select using (auth.uid() = user_id);
create policy "vitals_insert" on vitals for insert with check (auth.uid() = user_id);
create policy "vitals_update" on vitals for update using (auth.uid() = user_id);
create policy "vitals_delete" on vitals for delete using (auth.uid() = user_id);

create policy "family_select" on family_history for select using (auth.uid() = user_id);
create policy "family_insert" on family_history for insert with check (auth.uid() = user_id);
create policy "family_update" on family_history for update using (auth.uid() = user_id);
create policy "family_delete" on family_history for delete using (auth.uid() = user_id);

create policy "labs_select" on lab_reports for select using (auth.uid() = user_id);
create policy "labs_insert" on lab_reports for insert with check (auth.uid() = user_id);
create policy "labs_update" on lab_reports for update using (auth.uid() = user_id);
create policy "labs_delete" on lab_reports for delete using (auth.uid() = user_id);

create policy "mood_select" on mood_logs for select using (auth.uid() = user_id);
create policy "mood_insert" on mood_logs for insert with check (auth.uid() = user_id);
create policy "mood_update" on mood_logs for update using (auth.uid() = user_id);
create policy "mood_delete" on mood_logs for delete using (auth.uid() = user_id);

create policy "chat_select" on mental_chat for select using (auth.uid() = user_id);
create policy "chat_insert" on mental_chat for insert with check (auth.uid() = user_id);
create policy "chat_update" on mental_chat for update using (auth.uid() = user_id);
create policy "chat_delete" on mental_chat for delete using (auth.uid() = user_id);

create policy "embeddings_select" on embeddings for select using (auth.uid() = user_id);
create policy "embeddings_insert" on embeddings for insert with check (auth.uid() = user_id);
create policy "embeddings_update" on embeddings for update using (auth.uid() = user_id);
create policy "embeddings_delete" on embeddings for delete using (auth.uid() = user_id);

create or replace function match_embeddings(
  query_embedding vector(1536),
  match_count int,
  user_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable as $$
  select id, content, 1 - (embedding <=> query_embedding) as similarity
  from embeddings
  where embeddings.user_id = match_embeddings.user_id
  order by embedding <=> query_embedding
  limit match_count;
$$;
