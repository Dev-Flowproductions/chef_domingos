-- LKM credentials for Edge Functions (readable only with service role; no client policies)

create table if not exists lkm_runtime_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);

alter table lkm_runtime_config enable row level security;

comment on table lkm_runtime_config is 'LKM API credentials for Edge Functions. No RLS policies — only service role can read/write.';

-- Allow authenticated users to create their own profile row on first login
create policy "Users can insert own profile"
  on users for insert
  with check (auth.uid() = id);
