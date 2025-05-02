-- Create notification_preferences table
create table public.notification_preferences (
  role integer not null,
  system_updates boolean null default true,
  marketing boolean null default true,
  security_alerts boolean null default true,
  new_features boolean null default true,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint notification_preferences_pkey primary key (role)
) TABLESPACE pg_default;