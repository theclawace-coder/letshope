-- ============================================================
-- NDIS Plans table & Service Agreement ↔ Plan linkage
-- ============================================================

-- 1. NDIS PLANS – one row per plan period a participant holds
CREATE TABLE IF NOT EXISTS ndis_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  plan_number TEXT,
  funding_type TEXT CHECK (funding_type IN ('ndia_managed', 'plan_managed', 'self_managed', 'combination')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'expired', 'superseded')) DEFAULT 'active',
  budget_core DECIMAL(10,2) DEFAULT 0,
  budget_capacity_building DECIMAL(10,2) DEFAULT 0,
  budget_capital DECIMAL(10,2) DEFAULT 0,
  support_coordinator_name TEXT,
  support_coordinator_phone TEXT,
  support_coordinator_email TEXT,
  lac_name TEXT,
  lac_contact TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ndis_plans_participant ON ndis_plans(participant_id);
CREATE INDEX IF NOT EXISTS idx_ndis_plans_status ON ndis_plans(status);

-- 2. Link service agreements to a specific NDIS plan
ALTER TABLE service_agreements ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES ndis_plans(id);
CREATE INDEX IF NOT EXISTS idx_service_agreements_plan ON service_agreements(plan_id);
