-- v2 Phase 8: Financial Intelligence
-- Budget burn-rate analytics, claim lifecycle management, revenue forecasting,
-- payment reconciliation, NDIS price guide compliance checks, financial alerts,
-- worker pay-run tracking, and comprehensive financial reporting views
-- Fully idempotent: safe to re-run

-- =============================================
-- ENUMS
-- =============================================

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'processing', 'paid', 'partially_paid', 'overdue', 'written_off'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE claim_status AS ENUM (
    'draft', 'ready', 'submitted', 'accepted', 'partially_accepted',
    'rejected', 'resubmitted', 'paid', 'appealed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE financial_alert_severity AS ENUM (
    'info', 'warning', 'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE financial_alert_type AS ENUM (
    'budget_threshold', 'plan_expiry', 'claim_rejection', 'overdue_payment',
    'price_limit_breach', 'utilisation_low', 'utilisation_high',
    'pay_run_discrepancy', 'reconciliation_mismatch'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pay_run_status AS ENUM (
    'draft', 'calculated', 'approved', 'exported', 'paid', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reconciliation_status AS ENUM (
    'pending', 'matched', 'partial_match', 'unmatched', 'disputed', 'resolved'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 1. NDIS CLAIM BATCHES (group claims for submission)
-- =============================================
CREATE TABLE IF NOT EXISTS claim_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  submission_channel TEXT NOT NULL CHECK (submission_channel IN (
    'proda', 'plan_manager', 'self_managed_invoice', 'bulk_upload'
  )),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status claim_status NOT NULL DEFAULT 'draft',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  accepted_amount NUMERIC(12,2),
  rejected_amount NUMERIC(12,2),
  claim_count INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  response_received_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  notes TEXT,
  error_details JSONB DEFAULT '[]',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_batches_status ON claim_batches(status);
CREATE INDEX IF NOT EXISTS idx_claim_batches_period ON claim_batches(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_claim_batches_number ON claim_batches(batch_number);

-- =============================================
-- 2. CLAIM LINE ITEMS (individual claim entries)
-- =============================================
CREATE TABLE IF NOT EXISTS claim_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES claim_batches(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  invoice_line_item_id UUID REFERENCES invoice_line_items(id),
  participant_id UUID NOT NULL REFERENCES participants(id),
  ndis_number TEXT NOT NULL,
  support_item_number TEXT NOT NULL,
  support_item_name TEXT NOT NULL,
  date_of_service DATE NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  claim_type TEXT CHECK (claim_type IN (
    'standard', 'cancellation_short_notice', 'cancellation_no_show',
    'provider_travel', 'non_face_to_face', 'report_writing',
    'irregular_sil_supports', 'telehealth'
  )) DEFAULT 'standard',
  status claim_status NOT NULL DEFAULT 'draft',
  rejection_code TEXT,
  rejection_reason TEXT,
  resubmission_of UUID REFERENCES claim_items(id), -- links to original rejected claim
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_items_batch ON claim_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_claim_items_invoice ON claim_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_claim_items_participant ON claim_items(participant_id);
CREATE INDEX IF NOT EXISTS idx_claim_items_status ON claim_items(status);
CREATE INDEX IF NOT EXISTS idx_claim_items_date ON claim_items(date_of_service);

-- =============================================
-- 3. PAYMENT TRACKING (inbound payments received)
-- =============================================
CREATE TABLE IF NOT EXISTS payments_received (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference TEXT NOT NULL,
  payer_type TEXT NOT NULL CHECK (payer_type IN ('ndia', 'plan_manager', 'self_managed', 'other')),
  payer_name TEXT,
  payment_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN (
    'eft', 'bpay', 'direct_debit', 'cheque', 'cash', 'other'
  )),
  bank_reference TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_received_date ON payments_received(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_received_status ON payments_received(status);
CREATE INDEX IF NOT EXISTS idx_payments_received_payer ON payments_received(payer_type);
CREATE INDEX IF NOT EXISTS idx_payments_received_ref ON payments_received(payment_reference);

-- =============================================
-- 4. PAYMENT ALLOCATIONS (link payments to invoices)
-- =============================================
CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments_received(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_alloc_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_alloc_invoice ON payment_allocations(invoice_id);

-- =============================================
-- 5. WORKER PAY RATES
-- =============================================
CREATE TABLE IF NOT EXISTS worker_pay_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  rate_name TEXT NOT NULL, -- e.g. 'Weekday', 'Saturday', 'Sunday', 'Public Holiday', 'Sleepover'
  hourly_rate NUMERIC(8,2) NOT NULL,
  applies_to TEXT[] DEFAULT '{}', -- e.g. ['weekday'], ['saturday'], ['public_holiday']
  is_default BOOLEAN NOT NULL DEFAULT false,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(worker_id, rate_name, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_worker_pay_rates_worker ON worker_pay_rates(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_pay_rates_effective ON worker_pay_rates(effective_from, effective_until);

-- =============================================
-- 6. PAY RUNS (batch payment processing for workers)
-- =============================================
CREATE TABLE IF NOT EXISTS pay_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_run_number TEXT NOT NULL UNIQUE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status pay_run_status NOT NULL DEFAULT 'draft',
  total_gross NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_super NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_net NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_km_allowance NUMERIC(10,2) NOT NULL DEFAULT 0,
  worker_count INTEGER NOT NULL DEFAULT 0,
  shift_count INTEGER NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  exported_at TIMESTAMPTZ,
  export_format TEXT CHECK (export_format IN ('xero', 'myob', 'csv', 'stp')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_runs_status ON pay_runs(status);
CREATE INDEX IF NOT EXISTS idx_pay_runs_period ON pay_runs(period_start, period_end);

-- =============================================
-- 7. PAY RUN LINE ITEMS (per-worker pay details)
-- =============================================
CREATE TABLE IF NOT EXISTS pay_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_run_id UUID NOT NULL REFERENCES pay_runs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id),
  shift_id UUID REFERENCES shifts(id),
  shift_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  hours_worked NUMERIC(6,2) NOT NULL DEFAULT 0,
  break_minutes INTEGER DEFAULT 0,
  rate_name TEXT NOT NULL,
  hourly_rate NUMERIC(8,2) NOT NULL,
  base_pay NUMERIC(10,2) NOT NULL DEFAULT 0,
  loading_pct NUMERIC(5,2) DEFAULT 0,      -- e.g. 25% for Saturday
  loading_amount NUMERIC(10,2) DEFAULT 0,
  km_travelled NUMERIC(6,1) DEFAULT 0,
  km_rate NUMERIC(4,2) DEFAULT 0.91,       -- ATO rate
  km_allowance NUMERIC(8,2) DEFAULT 0,
  gross_pay NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_run_items_run ON pay_run_items(pay_run_id);
CREATE INDEX IF NOT EXISTS idx_pay_run_items_worker ON pay_run_items(worker_id);
CREATE INDEX IF NOT EXISTS idx_pay_run_items_shift ON pay_run_items(shift_id);
CREATE INDEX IF NOT EXISTS idx_pay_run_items_date ON pay_run_items(shift_date);

-- =============================================
-- 8. BUDGET SNAPSHOTS (periodic budget state capture)
-- =============================================
CREATE TABLE IF NOT EXISTS budget_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  plan_start_date DATE,
  plan_end_date DATE,
  -- Allocated budgets
  budget_core NUMERIC(10,2),
  budget_capacity_building NUMERIC(10,2),
  budget_capital NUMERIC(10,2),
  -- Spent to date
  core_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  capacity_building_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  capital_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Committed (approved invoices not yet paid)
  core_committed NUMERIC(10,2) NOT NULL DEFAULT 0,
  capacity_building_committed NUMERIC(10,2) NOT NULL DEFAULT 0,
  capital_committed NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Calculated fields
  days_elapsed INTEGER,
  days_remaining INTEGER,
  core_burn_rate_daily NUMERIC(10,2),        -- avg daily spend
  capacity_burn_rate_daily NUMERIC(10,2),
  core_projected_end NUMERIC(10,2),          -- projected spend at plan end
  capacity_projected_end NUMERIC(10,2),
  core_utilisation_pct NUMERIC(5,1),
  capacity_utilisation_pct NUMERIC(5,1),
  capital_utilisation_pct NUMERIC(5,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_budget_snap_participant ON budget_snapshots(participant_id);
CREATE INDEX IF NOT EXISTS idx_budget_snap_date ON budget_snapshots(snapshot_date);

-- =============================================
-- 9. FINANCIAL ALERTS
-- =============================================
CREATE TABLE IF NOT EXISTS financial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type financial_alert_type NOT NULL,
  severity financial_alert_severity NOT NULL DEFAULT 'info',
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',        -- structured context for the alert
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  auto_generated BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_alerts_type ON financial_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_fin_alerts_severity ON financial_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_fin_alerts_participant ON financial_alerts(participant_id);
CREATE INDEX IF NOT EXISTS idx_fin_alerts_unread ON financial_alerts(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_fin_alerts_created ON financial_alerts(created_at);

-- =============================================
-- 10. RECONCILIATION RECORDS
-- =============================================
CREATE TABLE IF NOT EXISTS reconciliation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments_received(id),
  invoice_id UUID REFERENCES invoices(id),
  claim_batch_id UUID REFERENCES claim_batches(id),
  expected_amount NUMERIC(10,2) NOT NULL,
  received_amount NUMERIC(10,2),
  difference NUMERIC(10,2),
  status reconciliation_status NOT NULL DEFAULT 'pending',
  matched_at TIMESTAMPTZ,
  matched_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recon_status ON reconciliation_records(status);
CREATE INDEX IF NOT EXISTS idx_recon_payment ON reconciliation_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_recon_invoice ON reconciliation_records(invoice_id);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_financial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS claim_batches_updated_at ON claim_batches;
CREATE TRIGGER claim_batches_updated_at
  BEFORE UPDATE ON claim_batches
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

DROP TRIGGER IF EXISTS claim_items_updated_at ON claim_items;
CREATE TRIGGER claim_items_updated_at
  BEFORE UPDATE ON claim_items
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

DROP TRIGGER IF EXISTS payments_received_updated_at ON payments_received;
CREATE TRIGGER payments_received_updated_at
  BEFORE UPDATE ON payments_received
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

DROP TRIGGER IF EXISTS worker_pay_rates_updated_at ON worker_pay_rates;
CREATE TRIGGER worker_pay_rates_updated_at
  BEFORE UPDATE ON worker_pay_rates
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

DROP TRIGGER IF EXISTS pay_runs_updated_at ON pay_runs;
CREATE TRIGGER pay_runs_updated_at
  BEFORE UPDATE ON pay_runs
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

DROP TRIGGER IF EXISTS reconciliation_records_updated_at ON reconciliation_records;
CREATE TRIGGER reconciliation_records_updated_at
  BEFORE UPDATE ON reconciliation_records
  FOR EACH ROW EXECUTE FUNCTION update_financial_updated_at();

-- =============================================
-- 11. CLAIM BATCH TOTALS AUTO-UPDATE
-- =============================================
CREATE OR REPLACE FUNCTION update_claim_batch_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE claim_batches
  SET
    total_amount = COALESCE((
      SELECT SUM(total) FROM claim_items WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id)
    ), 0),
    claim_count = COALESCE((
      SELECT COUNT(*) FROM claim_items WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id)
    ), 0),
    accepted_amount = COALESCE((
      SELECT SUM(total) FROM claim_items
      WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id) AND status = 'accepted'
    ), 0),
    rejected_amount = COALESCE((
      SELECT SUM(total) FROM claim_items
      WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id) AND status = 'rejected'
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.batch_id, OLD.batch_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS claim_items_update_batch ON claim_items;
CREATE TRIGGER claim_items_update_batch
  AFTER INSERT OR UPDATE OR DELETE ON claim_items
  FOR EACH ROW EXECUTE FUNCTION update_claim_batch_totals();

-- =============================================
-- 12. PRICE COMPLIANCE CHECK FUNCTION
-- Validates line items against NDIS price guide
-- =============================================
CREATE OR REPLACE FUNCTION check_ndis_price_compliance(
  p_support_item_number TEXT,
  p_unit_price NUMERIC,
  p_date_of_service DATE,
  p_region TEXT DEFAULT 'national' -- 'national', 'remote', 'very_remote'
)
RETURNS TABLE (
  is_compliant BOOLEAN,
  max_price NUMERIC(10,2),
  charged_price NUMERIC(10,2),
  overage NUMERIC(10,2),
  item_name TEXT,
  message TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  v_guide RECORD;
  v_max NUMERIC(10,2);
BEGIN
  SELECT * INTO v_guide
  FROM ndis_price_guide
  WHERE support_item_number = p_support_item_number
    AND is_active = true
    AND effective_from <= p_date_of_service
    AND (effective_to IS NULL OR effective_to >= p_date_of_service)
  ORDER BY effective_from DESC
  LIMIT 1;

  IF v_guide IS NULL THEN
    is_compliant := false;
    max_price := NULL;
    charged_price := p_unit_price;
    overage := NULL;
    item_name := NULL;
    message := 'Support item not found in active price guide';
    RETURN NEXT;
    RETURN;
  END IF;

  v_max := CASE p_region
    WHEN 'remote' THEN COALESCE(v_guide.price_remote, v_guide.price_national)
    WHEN 'very_remote' THEN COALESCE(v_guide.price_very_remote, v_guide.price_national)
    ELSE v_guide.price_national
  END;

  is_compliant := (p_unit_price <= v_max);
  max_price := v_max;
  charged_price := p_unit_price;
  overage := GREATEST(0, p_unit_price - v_max);
  item_name := v_guide.support_item_name;
  message := CASE
    WHEN p_unit_price <= v_max THEN 'Price within NDIS limits'
    ELSE format('Price exceeds NDIS max by $%s (%s%%)',
      ROUND(p_unit_price - v_max, 2),
      ROUND(((p_unit_price - v_max) / v_max) * 100, 1))
  END;
  RETURN NEXT;
  RETURN;
END;
$$;

-- =============================================
-- 13. BUDGET BURN-RATE CALCULATION FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION calculate_budget_burn_rate(
  p_participant_id UUID
)
RETURNS TABLE (
  category TEXT,
  budget_total NUMERIC(10,2),
  spent NUMERIC(10,2),
  committed NUMERIC(10,2),
  remaining NUMERIC(10,2),
  days_elapsed INTEGER,
  days_remaining INTEGER,
  daily_burn_rate NUMERIC(10,2),
  projected_spend_at_end NUMERIC(10,2),
  projected_remaining NUMERIC(10,2),
  utilisation_pct NUMERIC(5,1),
  on_track BOOLEAN,
  risk_level TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  v_participant RECORD;
  v_plan_days INTEGER;
  v_elapsed INTEGER;
  v_remain INTEGER;
  v_spent NUMERIC;
  v_committed NUMERIC;
  v_budget NUMERIC;
  v_burn NUMERIC;
  v_projected NUMERIC;
  v_cats TEXT[] := ARRAY['core', 'capacity_building', 'capital'];
  v_cat TEXT;
BEGIN
  SELECT * INTO v_participant FROM participants WHERE id = p_participant_id;
  IF v_participant IS NULL THEN RETURN; END IF;

  v_plan_days := GREATEST(1, v_participant.plan_end_date - v_participant.plan_start_date);
  v_elapsed := GREATEST(0, CURRENT_DATE - v_participant.plan_start_date);
  v_remain := GREATEST(0, v_participant.plan_end_date - CURRENT_DATE);

  FOREACH v_cat IN ARRAY v_cats
  LOOP
    -- Get budget
    v_budget := CASE v_cat
      WHEN 'core' THEN COALESCE(v_participant.budget_core, 0)
      WHEN 'capacity_building' THEN COALESCE(v_participant.budget_capacity_building, 0)
      WHEN 'capital' THEN COALESCE(v_participant.budget_capital, 0)
    END;

    -- Spent = paid/submitted invoices
    SELECT COALESCE(SUM(li.total), 0) INTO v_spent
    FROM invoice_line_items li
    JOIN invoices i ON i.id = li.invoice_id
    JOIN ndis_price_guide pg ON pg.support_item_number = li.support_item_number AND pg.is_active
    WHERE i.participant_id = p_participant_id
      AND i.status IN ('paid', 'submitted', 'approved')
      AND pg.category = v_cat;

    -- Committed = draft/approved but not submitted
    SELECT COALESCE(SUM(li.total), 0) INTO v_committed
    FROM invoice_line_items li
    JOIN invoices i ON i.id = li.invoice_id
    JOIN ndis_price_guide pg ON pg.support_item_number = li.support_item_number AND pg.is_active
    WHERE i.participant_id = p_participant_id
      AND i.status = 'draft'
      AND pg.category = v_cat;

    v_burn := CASE WHEN v_elapsed > 0 THEN v_spent / v_elapsed ELSE 0 END;
    v_projected := v_spent + (v_burn * v_remain);

    category := v_cat;
    budget_total := v_budget;
    spent := v_spent;
    committed := v_committed;
    remaining := v_budget - v_spent - v_committed;
    days_elapsed := v_elapsed;
    days_remaining := v_remain;
    daily_burn_rate := ROUND(v_burn, 2);
    projected_spend_at_end := ROUND(v_projected, 2);
    projected_remaining := ROUND(v_budget - v_projected, 2);
    utilisation_pct := CASE WHEN v_budget > 0
      THEN ROUND((v_spent / v_budget) * 100, 1)
      ELSE 0 END;
    on_track := (v_projected <= v_budget * 1.05); -- 5% tolerance
    risk_level := CASE
      WHEN v_budget = 0 THEN 'none'
      WHEN v_projected > v_budget * 1.15 THEN 'high'   -- >15% overspend projected
      WHEN v_projected > v_budget * 1.05 THEN 'medium' -- >5% overspend projected
      WHEN v_budget > 0 AND v_spent / v_budget < (v_elapsed::NUMERIC / v_plan_days) * 0.5 THEN 'low_utilisation'
      ELSE 'on_track'
    END;

    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

-- =============================================
-- 14. GENERATE BUDGET SNAPSHOT FUNCTION
-- Call periodically (e.g. weekly) to record budget state
-- =============================================
CREATE OR REPLACE FUNCTION generate_budget_snapshot(
  p_participant_id UUID,
  p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID
LANGUAGE plpgsql AS $$
DECLARE
  v_snap_id UUID;
  v_burn RECORD;
  v_core RECORD;
  v_cb RECORD;
  v_cap RECORD;
  v_participant RECORD;
BEGIN
  SELECT * INTO v_participant FROM participants WHERE id = p_participant_id;
  IF v_participant IS NULL THEN
    RAISE EXCEPTION 'Participant not found: %', p_participant_id;
  END IF;

  -- Get burn rates per category
  FOR v_burn IN SELECT * FROM calculate_budget_burn_rate(p_participant_id) LOOP
    CASE v_burn.category
      WHEN 'core' THEN v_core := v_burn;
      WHEN 'capacity_building' THEN v_cb := v_burn;
      WHEN 'capital' THEN v_cap := v_burn;
    END CASE;
  END LOOP;

  INSERT INTO budget_snapshots (
    participant_id, snapshot_date, plan_start_date, plan_end_date,
    budget_core, budget_capacity_building, budget_capital,
    core_spent, capacity_building_spent, capital_spent,
    core_committed, capacity_building_committed, capital_committed,
    days_elapsed, days_remaining,
    core_burn_rate_daily, capacity_burn_rate_daily,
    core_projected_end, capacity_projected_end,
    core_utilisation_pct, capacity_utilisation_pct, capital_utilisation_pct
  ) VALUES (
    p_participant_id, p_snapshot_date,
    v_participant.plan_start_date, v_participant.plan_end_date,
    v_participant.budget_core, v_participant.budget_capacity_building, v_participant.budget_capital,
    COALESCE(v_core.spent, 0), COALESCE(v_cb.spent, 0), COALESCE(v_cap.spent, 0),
    COALESCE(v_core.committed, 0), COALESCE(v_cb.committed, 0), COALESCE(v_cap.committed, 0),
    COALESCE(v_core.days_elapsed, 0), COALESCE(v_core.days_remaining, 0),
    COALESCE(v_core.daily_burn_rate, 0), COALESCE(v_cb.daily_burn_rate, 0),
    COALESCE(v_core.projected_spend_at_end, 0), COALESCE(v_cb.projected_spend_at_end, 0),
    COALESCE(v_core.utilisation_pct, 0), COALESCE(v_cb.utilisation_pct, 0), COALESCE(v_cap.utilisation_pct, 0)
  )
  ON CONFLICT (participant_id, snapshot_date) DO UPDATE SET
    core_spent = EXCLUDED.core_spent,
    capacity_building_spent = EXCLUDED.capacity_building_spent,
    capital_spent = EXCLUDED.capital_spent,
    core_committed = EXCLUDED.core_committed,
    capacity_building_committed = EXCLUDED.capacity_building_committed,
    capital_committed = EXCLUDED.capital_committed,
    days_elapsed = EXCLUDED.days_elapsed,
    days_remaining = EXCLUDED.days_remaining,
    core_burn_rate_daily = EXCLUDED.core_burn_rate_daily,
    capacity_burn_rate_daily = EXCLUDED.capacity_burn_rate_daily,
    core_projected_end = EXCLUDED.core_projected_end,
    capacity_projected_end = EXCLUDED.capacity_projected_end,
    core_utilisation_pct = EXCLUDED.core_utilisation_pct,
    capacity_utilisation_pct = EXCLUDED.capacity_utilisation_pct,
    capital_utilisation_pct = EXCLUDED.capital_utilisation_pct
  RETURNING id INTO v_snap_id;

  RETURN v_snap_id;
END;
$$;

-- =============================================
-- 15. BUDGET ALERT GENERATION FUNCTION
-- Checks all active participants for financial alerts
-- =============================================
CREATE OR REPLACE FUNCTION generate_financial_alerts()
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_participant RECORD;
  v_burn RECORD;
  v_alert_count INTEGER := 0;
  v_days_to_expiry INTEGER;
BEGIN
  FOR v_participant IN
    SELECT * FROM participants WHERE status IN ('active', 'on_hold')
  LOOP
    -- Check plan expiry
    v_days_to_expiry := v_participant.plan_end_date - CURRENT_DATE;

    IF v_days_to_expiry BETWEEN 0 AND 30 AND NOT EXISTS (
      SELECT 1 FROM financial_alerts
      WHERE participant_id = v_participant.id
        AND alert_type = 'plan_expiry'
        AND created_at > NOW() - INTERVAL '7 days'
    ) THEN
      INSERT INTO financial_alerts (alert_type, severity, participant_id, title, message, data)
      VALUES (
        'plan_expiry',
        CASE WHEN v_days_to_expiry <= 7 THEN 'critical' WHEN v_days_to_expiry <= 14 THEN 'warning' ELSE 'info' END,
        v_participant.id,
        format('Plan expiring in %s days', v_days_to_expiry),
        format('%s %s''s NDIS plan ends on %s. Review budget utilisation and begin plan review process.',
          v_participant.first_name, v_participant.last_name,
          TO_CHAR(v_participant.plan_end_date, 'DD Mon YYYY')),
        jsonb_build_object('days_remaining', v_days_to_expiry, 'plan_end_date', v_participant.plan_end_date)
      );
      v_alert_count := v_alert_count + 1;
    END IF;

    -- Check budget thresholds
    FOR v_burn IN SELECT * FROM calculate_budget_burn_rate(v_participant.id) LOOP
      -- Over 80% spent
      IF v_burn.utilisation_pct >= 80 AND v_burn.budget_total > 0 AND NOT EXISTS (
        SELECT 1 FROM financial_alerts
        WHERE participant_id = v_participant.id
          AND alert_type = 'budget_threshold'
          AND data->>'category' = v_burn.category
          AND created_at > NOW() - INTERVAL '7 days'
      ) THEN
        INSERT INTO financial_alerts (alert_type, severity, participant_id, title, message, data)
        VALUES (
          'budget_threshold',
          CASE WHEN v_burn.utilisation_pct >= 95 THEN 'critical' WHEN v_burn.utilisation_pct >= 90 THEN 'warning' ELSE 'info' END,
          v_participant.id,
          format('%s budget at %s%%', INITCAP(REPLACE(v_burn.category, '_', ' ')), v_burn.utilisation_pct),
          format('%s %s has used %s%% of their %s budget ($%s of $%s). %s days remaining in plan.',
            v_participant.first_name, v_participant.last_name,
            v_burn.utilisation_pct, REPLACE(v_burn.category, '_', ' '),
            v_burn.spent, v_burn.budget_total, v_burn.days_remaining),
          jsonb_build_object(
            'category', v_burn.category,
            'utilisation_pct', v_burn.utilisation_pct,
            'spent', v_burn.spent,
            'budget', v_burn.budget_total,
            'projected_end', v_burn.projected_spend_at_end,
            'risk_level', v_burn.risk_level
          )
        );
        v_alert_count := v_alert_count + 1;
      END IF;

      -- Low utilisation warning (less than 50% of expected)
      IF v_burn.risk_level = 'low_utilisation' AND v_burn.days_remaining > 30
         AND v_burn.budget_total > 0 AND NOT EXISTS (
        SELECT 1 FROM financial_alerts
        WHERE participant_id = v_participant.id
          AND alert_type = 'utilisation_low'
          AND data->>'category' = v_burn.category
          AND created_at > NOW() - INTERVAL '14 days'
      ) THEN
        INSERT INTO financial_alerts (alert_type, severity, participant_id, title, message, data)
        VALUES (
          'utilisation_low',
          'info',
          v_participant.id,
          format('Low %s utilisation (%s%%)', REPLACE(v_burn.category, '_', ' '), v_burn.utilisation_pct),
          format('%s %s''s %s budget is under-utilised at %s%%. Consider reviewing service delivery.',
            v_participant.first_name, v_participant.last_name,
            REPLACE(v_burn.category, '_', ' '), v_burn.utilisation_pct),
          jsonb_build_object(
            'category', v_burn.category,
            'utilisation_pct', v_burn.utilisation_pct,
            'remaining', v_burn.remaining
          )
        );
        v_alert_count := v_alert_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_alert_count;
END;
$$;

-- =============================================
-- 16. GENERATE CLAIM BATCH NUMBER
-- =============================================
CREATE OR REPLACE FUNCTION generate_claim_batch_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  prefix := 'HDS-CLM-' || TO_CHAR(CURRENT_DATE, 'YYMM') || '-';
  SELECT COALESCE(MAX(
    CAST(REPLACE(batch_number, prefix, '') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM claim_batches
  WHERE batch_number LIKE prefix || '%';
  RETURN prefix || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 17. GENERATE PAY RUN NUMBER
-- =============================================
CREATE OR REPLACE FUNCTION generate_pay_run_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  prefix := 'HDS-PAY-' || TO_CHAR(CURRENT_DATE, 'YYMM') || '-';
  SELECT COALESCE(MAX(
    CAST(REPLACE(pay_run_number, prefix, '') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM pay_runs
  WHERE pay_run_number LIKE prefix || '%';
  RETURN prefix || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 18. INVOICE AGEING VIEW
-- =============================================
CREATE OR REPLACE VIEW invoice_ageing AS
SELECT
  i.id,
  i.invoice_number,
  i.participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  i.funding_type,
  i.invoice_date,
  i.due_date,
  i.total,
  i.status,
  COALESCE(pa.paid_amount, 0) AS paid_amount,
  i.total - COALESCE(pa.paid_amount, 0) AS outstanding,
  CURRENT_DATE - i.invoice_date AS days_since_invoice,
  CASE
    WHEN i.status IN ('paid', 'cancelled', 'void') THEN 'settled'
    WHEN i.due_date IS NULL THEN 'no_due_date'
    WHEN CURRENT_DATE <= i.due_date THEN 'current'
    WHEN CURRENT_DATE - i.due_date <= 30 THEN '1_30_days'
    WHEN CURRENT_DATE - i.due_date <= 60 THEN '31_60_days'
    WHEN CURRENT_DATE - i.due_date <= 90 THEN '61_90_days'
    ELSE '90_plus_days'
  END AS ageing_bucket
FROM invoices i
JOIN participants p ON p.id = i.participant_id
LEFT JOIN LATERAL (
  SELECT SUM(amount) AS paid_amount
  FROM payment_allocations WHERE invoice_id = i.id
) pa ON true
WHERE i.status NOT IN ('cancelled', 'void');

-- =============================================
-- 19. REVENUE SUMMARY VIEW (monthly)
-- =============================================
CREATE OR REPLACE VIEW monthly_revenue_summary AS
SELECT
  DATE_TRUNC('month', i.invoice_date)::DATE AS month,
  COUNT(DISTINCT i.id) AS invoice_count,
  SUM(i.total) AS total_invoiced,
  SUM(i.total) FILTER (WHERE i.status = 'paid') AS total_paid,
  SUM(i.total) FILTER (WHERE i.status IN ('submitted', 'approved')) AS total_pending,
  SUM(i.total) FILTER (WHERE i.status = 'rejected') AS total_rejected,
  COUNT(DISTINCT i.participant_id) AS participants_billed,
  COUNT(DISTINCT li.worker_id) AS workers_billed,
  SUM(li.quantity) FILTER (WHERE li.unit = 'hour') AS total_hours,
  SUM(li.quantity * li.unit_price) FILTER (WHERE li.unit = 'km') AS total_travel_cost
FROM invoices i
LEFT JOIN invoice_line_items li ON li.invoice_id = i.id
GROUP BY DATE_TRUNC('month', i.invoice_date);

-- =============================================
-- 20. CLAIM PIPELINE VIEW
-- =============================================
CREATE OR REPLACE VIEW claim_pipeline AS
SELECT
  cb.id AS batch_id,
  cb.batch_number,
  cb.submission_channel,
  cb.period_start,
  cb.period_end,
  cb.status,
  cb.total_amount,
  cb.accepted_amount,
  cb.rejected_amount,
  cb.claim_count,
  cb.submitted_at,
  cb.response_received_at,
  CASE
    WHEN cb.status = 'paid' THEN 0
    WHEN cb.submitted_at IS NOT NULL
      THEN EXTRACT(DAY FROM NOW() - cb.submitted_at)::INTEGER
    ELSE NULL
  END AS days_since_submission,
  CASE WHEN cb.total_amount > 0
    THEN ROUND(COALESCE(cb.accepted_amount, 0) / cb.total_amount * 100, 1)
    ELSE 0
  END AS acceptance_rate_pct,
  COUNT(ci.id) FILTER (WHERE ci.status = 'rejected') AS rejected_items,
  COUNT(ci.id) FILTER (WHERE ci.status = 'resubmitted') AS resubmitted_items,
  prof.full_name AS submitted_by_name
FROM claim_batches cb
LEFT JOIN claim_items ci ON ci.batch_id = cb.id
LEFT JOIN profiles prof ON prof.id = cb.submitted_by
GROUP BY cb.id, cb.batch_number, cb.submission_channel, cb.period_start,
  cb.period_end, cb.status, cb.total_amount, cb.accepted_amount,
  cb.rejected_amount, cb.claim_count, cb.submitted_at,
  cb.response_received_at, prof.full_name;

-- =============================================
-- 21. PAY RUN SUMMARY VIEW
-- =============================================
CREATE OR REPLACE VIEW pay_run_summary AS
SELECT
  pr.id AS pay_run_id,
  pr.pay_run_number,
  pr.period_start,
  pr.period_end,
  pr.status,
  pr.total_gross,
  pr.total_super,
  pr.total_tax,
  pr.total_net,
  pr.total_km_allowance,
  pr.worker_count,
  pr.shift_count,
  pr.approved_by,
  pr.export_format,
  ap.full_name AS approved_by_name,
  cp.full_name AS created_by_name,
  pr.created_at
FROM pay_runs pr
LEFT JOIN profiles ap ON ap.id = pr.approved_by
LEFT JOIN profiles cp ON cp.id = pr.created_by;

-- =============================================
-- 22. WORKER PAY SUMMARY VIEW (per pay run)
-- =============================================
CREATE OR REPLACE VIEW worker_pay_summary AS
SELECT
  pri.pay_run_id,
  pri.worker_id,
  w.first_name || ' ' || w.last_name AS worker_name,
  w.employment_type,
  COUNT(pri.id) AS line_items,
  SUM(pri.hours_worked) AS total_hours,
  SUM(pri.base_pay) AS total_base,
  SUM(pri.loading_amount) AS total_loadings,
  SUM(pri.km_allowance) AS total_km_allowance,
  SUM(pri.gross_pay) AS total_gross,
  MIN(pri.shift_date) AS first_shift,
  MAX(pri.shift_date) AS last_shift
FROM pay_run_items pri
JOIN workers w ON w.id = pri.worker_id
GROUP BY pri.pay_run_id, pri.worker_id, w.first_name, w.last_name, w.employment_type;

-- =============================================
-- 23. FINANCIAL DASHBOARD VIEW
-- Key metrics at a glance
-- =============================================
CREATE OR REPLACE VIEW financial_dashboard AS
SELECT
  -- Revenue this month
  COALESCE((
    SELECT SUM(total) FROM invoices
    WHERE invoice_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND status NOT IN ('cancelled', 'void')
  ), 0) AS revenue_this_month,

  -- Revenue last month
  COALESCE((
    SELECT SUM(total) FROM invoices
    WHERE invoice_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
      AND invoice_date < DATE_TRUNC('month', CURRENT_DATE)
      AND status NOT IN ('cancelled', 'void')
  ), 0) AS revenue_last_month,

  -- Outstanding receivables
  COALESCE((
    SELECT SUM(total) FROM invoices
    WHERE status IN ('submitted', 'approved')
  ), 0) AS outstanding_receivables,

  -- Overdue amount
  COALESCE((
    SELECT SUM(i.total - COALESCE(pa.paid, 0))
    FROM invoices i
    LEFT JOIN LATERAL (SELECT SUM(amount) AS paid FROM payment_allocations WHERE invoice_id = i.id) pa ON true
    WHERE i.status NOT IN ('paid', 'cancelled', 'void')
      AND i.due_date < CURRENT_DATE
  ), 0) AS overdue_amount,

  -- Claims pending
  COALESCE((
    SELECT SUM(total_amount) FROM claim_batches WHERE status IN ('submitted', 'ready')
  ), 0) AS claims_pending_amount,

  -- Claims rejection rate (last 90 days)
  COALESCE((
    SELECT ROUND(
      COUNT(*) FILTER (WHERE status = 'rejected')::NUMERIC
      / NULLIF(COUNT(*), 0) * 100, 1)
    FROM claim_items
    WHERE created_at > NOW() - INTERVAL '90 days'
  ), 0) AS claim_rejection_rate_90d,

  -- Active participants
  (SELECT COUNT(*) FROM participants WHERE status = 'active') AS active_participants,

  -- Unread financial alerts
  (SELECT COUNT(*) FROM financial_alerts WHERE is_read = false AND is_dismissed = false) AS unread_alerts,

  -- Critical alerts
  (SELECT COUNT(*) FROM financial_alerts WHERE severity = 'critical' AND is_read = false AND is_dismissed = false) AS critical_alerts,

  -- Pending pay runs
  (SELECT COUNT(*) FROM pay_runs WHERE status IN ('draft', 'calculated')) AS pending_pay_runs;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE claim_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_pay_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_run_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_records ENABLE ROW LEVEL SECURITY;

-- Director/Admin full access to financial tables
DO $$ BEGIN
  CREATE POLICY "Admin manage claim batches" ON claim_batches FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin manage claim items" ON claim_items FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin manage payments" ON payments_received FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin manage payment allocations" ON payment_allocations FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin manage worker pay rates" ON worker_pay_rates FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin manage pay runs" ON pay_runs FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin manage pay run items" ON pay_run_items FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin manage budget snapshots" ON budget_snapshots FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin manage reconciliation" ON reconciliation_records FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- All staff can view financial alerts
DO $$ BEGIN
  CREATE POLICY "Staff view financial alerts" ON financial_alerts FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin can manage financial alerts
DO $$ BEGIN
  CREATE POLICY "Admin manage financial alerts" ON financial_alerts FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Staff read-only access to pay rates and budget snapshots
DO $$ BEGIN
  CREATE POLICY "Staff view worker pay rates" ON worker_pay_rates FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role NOT IN ('participant_portal', 'worker')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff view budget snapshots" ON budget_snapshots FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role NOT IN ('participant_portal', 'worker')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Plan managers can view claims and invoices related data
DO $$ BEGIN
  CREATE POLICY "Plan manager view claims" ON claim_batches FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'plan_manager'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Plan manager view claim items" ON claim_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'plan_manager'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grant view access
GRANT SELECT ON invoice_ageing TO authenticated;
GRANT SELECT ON monthly_revenue_summary TO authenticated;
GRANT SELECT ON claim_pipeline TO authenticated;
GRANT SELECT ON pay_run_summary TO authenticated;
GRANT SELECT ON worker_pay_summary TO authenticated;
GRANT SELECT ON financial_dashboard TO authenticated;
