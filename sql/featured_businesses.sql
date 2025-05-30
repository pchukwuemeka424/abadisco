-- Create featured_businesses table
create table public.featured_businesses (
  id serial not null,
  name character varying(100) not null,
  category character varying(50) not null,
  rating numeric(2, 1) not null,
  reviews integer not null,
  image_path character varying(255) not null,
  is_featured boolean null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint featured_businesses_pkey primary key (id)
) TABLESPACE pg_default;

-- Index on category
create index IF not exists idx_featured_businesses_category 
  on public.featured_businesses using btree (category) TABLESPACE pg_default;