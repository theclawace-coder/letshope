-- Phase 4: Invoice Processing, NDIS Pricing Verification, Budget Tracking
-- Migration: 00003_phase4_invoices_budget.sql

-- =============================================================
-- 1. NDIS PRICE GUIDE TABLE
-- =============================================================

CREATE TABLE ndis_price_guide (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_item_number TEXT NOT NULL,
  support_item_name TEXT NOT NULL,
  registration_group TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('hour', 'each', 'day', 'week', 'km')),
  price_national NUMERIC(10,2) NOT NULL,
  price_remote NUMERIC(10,2),
  price_very_remote NUMERIC(10,2),
  category TEXT NOT NULL CHECK (category IN ('core', 'capacity_building', 'capital')),
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_price_guide_item_active
  ON ndis_price_guide(support_item_number, effective_from);
CREATE INDEX idx_price_guide_group ON ndis_price_guide(registration_group);
CREATE INDEX idx_price_guide_category ON ndis_price_guide(category);

-- =============================================================
-- 2. INVOICES TABLE
-- =============================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'submitted', 'paid', 'rejected', 'cancelled', 'void'))
    DEFAULT 'draft',
  funding_type TEXT CHECK (funding_type IN ('ndia_managed', 'plan_managed', 'self_managed')),
  claim_reference TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_participant ON invoices(participant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- =============================================================
-- 3. INVOICE LINE ITEMS TABLE
-- =============================================================

CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  worker_id UUID REFERENCES workers(id),
  support_item_number TEXT,
  support_item_name TEXT NOT NULL,
  registration_group TEXT,
  date_of_service DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL CHECK (unit IN ('hour', 'each', 'day', 'week', 'km')) DEFAULT 'hour',
  unit_price NUMERIC(10,2) NOT NULL,
  ndis_max_price NUMERIC(10,2),
  gst_applicable BOOLEAN DEFAULT false,
  total NUMERIC(10,2) NOT NULL,
  claim_type TEXT CHECK (claim_type IN (
    'standard', 'non_face_to_face', 'provider_travel',
    'cancellation_short_notice', 'cancellation_no_show',
    'report_writing', 'irregular_sil_supports'
  )) DEFAULT 'standard',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_booking ON invoice_line_items(booking_id);
CREATE INDEX idx_line_items_worker ON invoice_line_items(worker_id);
CREATE INDEX idx_line_items_date ON invoice_line_items(date_of_service);

-- =============================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE ndis_price_guide ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read the price guide
CREATE POLICY "Authenticated read price_guide" ON ndis_price_guide
  FOR SELECT TO authenticated
  USING (true);

-- Only admin/director can manage the price guide
CREATE POLICY "Admin manage price_guide" ON ndis_price_guide
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('director', 'admin')
    )
  );

-- Staff (non-portal users) can manage invoices
CREATE POLICY "Staff manage invoices" ON invoices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role != 'participant_portal'
    )
  );

-- Staff can manage line items
CREATE POLICY "Staff manage invoice_line_items" ON invoice_line_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role != 'participant_portal'
    )
  );

-- Portal users can view their own invoices (read-only)
CREATE POLICY "Portal users view own invoices" ON invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'participant_portal'
    )
    AND participant_id IN (
      SELECT id FROM participants
      WHERE id = invoices.participant_id
    )
  );

-- Portal users can view line items on their invoices
CREATE POLICY "Portal users view own line_items" ON invoice_line_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'participant_portal'
      )
      AND invoices.participant_id IN (
        SELECT id FROM participants
        WHERE id = invoices.participant_id
      )
    )
  );

-- =============================================================
-- 5. BUDGET TRACKING VIEW
-- =============================================================

CREATE OR REPLACE VIEW participant_budget_summary AS
SELECT
  p.id AS participant_id,
  p.first_name,
  p.last_name,
  p.ndis_number,
  p.plan_start_date,
  p.plan_end_date,
  p.budget_core,
  p.budget_capacity_building,
  p.budget_capital,
  COALESCE(core_used.total, 0) AS core_used,
  COALESCE(cb_used.total, 0) AS capacity_building_used,
  COALESCE(cap_used.total, 0) AS capital_used,
  COALESCE(p.budget_core, 0) - COALESCE(core_used.total, 0) AS core_remaining,
  COALESCE(p.budget_capacity_building, 0) - COALESCE(cb_used.total, 0) AS capacity_building_remaining,
  COALESCE(p.budget_capital, 0) - COALESCE(cap_used.total, 0) AS capital_remaining
FROM participants p
LEFT JOIN LATERAL (
  SELECT SUM(li.total) AS total
  FROM invoice_line_items li
  JOIN invoices i ON i.id = li.invoice_id
  JOIN ndis_price_guide pg ON pg.support_item_number = li.support_item_number AND pg.is_active
  WHERE i.participant_id = p.id
    AND i.status NOT IN ('cancelled', 'void', 'rejected')
    AND pg.category = 'core'
) core_used ON true
LEFT JOIN LATERAL (
  SELECT SUM(li.total) AS total
  FROM invoice_line_items li
  JOIN invoices i ON i.id = li.invoice_id
  JOIN ndis_price_guide pg ON pg.support_item_number = li.support_item_number AND pg.is_active
  WHERE i.participant_id = p.id
    AND i.status NOT IN ('cancelled', 'void', 'rejected')
    AND pg.category = 'capacity_building'
) cb_used ON true
LEFT JOIN LATERAL (
  SELECT SUM(li.total) AS total
  FROM invoice_line_items li
  JOIN invoices i ON i.id = li.invoice_id
  JOIN ndis_price_guide pg ON pg.support_item_number = li.support_item_number AND pg.is_active
  WHERE i.participant_id = p.id
    AND i.status NOT IN ('cancelled', 'void', 'rejected')
    AND pg.category = 'capital'
) cap_used ON true
WHERE p.status IN ('active', 'on_hold');

-- =============================================================
-- 6. HELPER FUNCTION: Generate next invoice number
-- =============================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  prefix := 'HDS-INV-' || TO_CHAR(CURRENT_DATE, 'YYMM') || '-';
  SELECT COALESCE(MAX(
    CAST(REPLACE(invoice_number, prefix, '') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number LIKE prefix || '%';
  RETURN prefix || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
