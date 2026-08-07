CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Administrador',
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS diagnostic_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  sector TEXT NOT NULL,
  sector_other TEXT,
  company_size TEXT NOT NULL,
  commune TEXT NOT NULL,
  commune_other TEXT,
  demand_timing TEXT NOT NULL,
  has_gaps TEXT NOT NULL,
  gap_details TEXT,
  wants_support TEXT NOT NULL,
  contact_consent TEXT NOT NULL,
  comments TEXT,
  source_ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demanded_profiles (
  id UUID PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES diagnostic_responses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  requirement_other TEXT,
  technical_competencies TEXT NOT NULL,
  experience TEXT NOT NULL,
  study_type TEXT NOT NULL,
  education_level TEXT NOT NULL,
  shift_system TEXT NOT NULL,
  gender_preference TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity < 10000),
  behaviours JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES admin_users(id),
  subject TEXT NOT NULL,
  template TEXT NOT NULL DEFAULT 'custom',
  recipient_count INTEGER NOT NULL CHECK (recipient_count > 0 AND recipient_count <= 100),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS diagnostic_responses_created_at_idx ON diagnostic_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS diagnostic_responses_company_idx ON diagnostic_responses(company);
CREATE INDEX IF NOT EXISTS diagnostic_responses_commune_idx ON diagnostic_responses(commune);
CREATE INDEX IF NOT EXISTS demanded_profiles_response_id_idx ON demanded_profiles(response_id);
CREATE INDEX IF NOT EXISTS demanded_profiles_name_idx ON demanded_profiles(name);
CREATE INDEX IF NOT EXISTS email_campaigns_created_at_idx ON email_campaigns(created_at DESC);
