-- Admin table definition with PK and unique constraints
CREATE TABLE public.admin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying(255) NOT NULL,
  password_hash character varying(255) NOT NULL,
  name character varying(100) NULL,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT admin_pkey PRIMARY KEY (id),
  CONSTRAINT admin_email_key UNIQUE (email)
) TABLESPACE pg_default;