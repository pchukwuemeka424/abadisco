create table public.users (
  id uuid not null default gen_random_uuid (),
  business_name text null,
  business_type text null,
  registration_number text null,
  description text null,
  phone text null,
  email text null,
  website text null,
  address text null,
  logo_url text null,
  facebook text null,
  instagram text null,
  whatsapp text null,
  custom_services text[] null,
  created_at timestamp with time zone null default now(),
  full_name text null,
  image text null,
  status text null default 'Now Open'::text,
  category text null,
  services text null,
  market text null,
  rating text null,
  role text null default 'users'::text,
  last_sign_in_at text null,
  created_by text null,
  agent_user_id text null,
  updated_at text null,
  constraint business_profiles_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_users_agent_user_id on public.users using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_users_agent_created_at on public.users using btree (created_by, created_at) TABLESPACE pg_default;

create trigger update_agent_stats_on_user_change
after INSERT
or
update OF created_by on users for EACH row
execute FUNCTION update_agent_statistics ();