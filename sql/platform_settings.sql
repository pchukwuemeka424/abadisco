-- Create platform_settings table
create table public.platform_settings (
  key character varying(255) not null,
  value text not null,
  description text null,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_by uuid null,
  constraint platform_settings_pkey primary key (key),
  constraint platform_settings_updated_by_fkey foreign key (updated_by) references auth.users (id)
) TABLESPACE pg_default;