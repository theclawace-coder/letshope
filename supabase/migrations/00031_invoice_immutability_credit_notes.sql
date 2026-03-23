-- Invoice Immutability & Credit Notes
-- Migration: 00029_invoice_immutability_credit_notes.sql
--
-- NDIS compliance: invoices must never be edited or deleted once approved.
-- Adjustments are handled via credit notes only.

-- =============================================================
-- 1. ADD IMMUTABILITY COLUMNS TO INVOICES
-- =============================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES profiles(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS credit_note_total NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_invoices_locked ON invoices(locked_at) WHERE locked_at IS NOT NULL;

-- =============================================================
-- 2. CREDIT NOTES TABLE
-- =============================================================

CREATE TABLE IF NOT EXISTS credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  participant_id UUID NOT NULL REFERENCES participants(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'applied', 'void'))
    DEFAULT 'draft',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice ON credit_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_participant ON credit_notes(participant_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_status ON credit_notes(status);

-- =============================================================
-- 3. CREDIT NOTE LINE ITEMS TABLE
-- =============================================================

CREATE TABLE IF NOT EXISTS credit_note_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
  original_line_item_id UUID REFERENCES invoice_line_items(id),
  support_item_number TEXT,
  support_item_name TEXT NOT NULL,
  date_of_service DATE NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL CHECK (unit IN ('hour', 'each', 'day', 'week', 'km')) DEFAULT 'hour',
  unit_price NUMERIC(10,2) NOT NULL,
  gst_applicable BOOLEAN DEFAULT false,
  total NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cn_line_items_credit_note ON credit_note_line_items(credit_note_id);
CREATE INDEX IF NOT EXISTS idx_cn_line_items_original ON credit_note_line_items(original_line_item_id);

-- =============================================================
-- 4. HELPER: Generate credit note number
-- =============================================================

CREATE OR REPLACE FUNCTION generate_credit_note_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  prefix := 'HDS-CN-' || TO_CHAR(CURRENT_DATE, 'YYMM') || '-';
  SELECT COALESCE(MAX(
    CAST(REPLACE(credit_note_number, prefix, '') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM credit_notes
  WHERE credit_note_number LIKE prefix || '%';
  RETURN prefix || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 5. AUTO-LOCK INVOICE ON STATUS CHANGE
-- =============================================================

CREATE OR REPLACE FUNCTION lock_invoice_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Lock the invoice when it transitions from draft to any non-draft status
  IF OLD.status = 'draft' AND NEW.status != 'draft' AND NEW.locked_at IS NULL THEN
    NEW.locked_at := now();
    NEW.locked_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_lock_invoice_on_approval ON invoices;
CREATE TRIGGER trg_lock_invoice_on_approval
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION lock_invoice_on_approval();

-- =============================================================
-- 6. PREVENT EDITS TO LOCKED INVOICES
-- =============================================================

CREATE OR REPLACE FUNCTION prevent_locked_invoice_edits()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow status changes and credit_note_total updates on locked invoices
  -- but prevent changes to financial data
  IF OLD.locked_at IS NOT NULL THEN
    -- These fields can still be updated on locked invoices
    IF NEW.status != OLD.status
       OR NEW.credit_note_total != OLD.credit_note_total
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
       OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
       OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
       OR NEW.claim_reference IS DISTINCT FROM OLD.claim_reference
       OR NEW.updated_at IS DISTINCT FROM OLD.updated_at THEN
      -- Allow these specific field updates
      -- But enforce that financial fields haven't changed
      IF NEW.subtotal != OLD.subtotal
         OR NEW.gst != OLD.gst
         OR NEW.total != OLD.total
         OR NEW.participant_id != OLD.participant_id
         OR NEW.invoice_number != OLD.invoice_number
         OR NEW.period_start != OLD.period_start
         OR NEW.period_end != OLD.period_end
         OR NEW.invoice_date != OLD.invoice_date
         OR NEW.funding_type IS DISTINCT FROM OLD.funding_type THEN
        RAISE EXCEPTION 'Cannot modify financial data on a locked invoice. Use credit notes for adjustments.';
      END IF;
      RETURN NEW;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_invoice_edits ON invoices;
CREATE TRIGGER trg_prevent_locked_invoice_edits
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_invoice_edits();

-- =============================================================
-- 7. PREVENT DELETE ON LOCKED INVOICES
-- =============================================================

CREATE OR REPLACE FUNCTION prevent_invoice_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot delete a locked invoice. Use void status or credit notes.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_invoice_delete ON invoices;
CREATE TRIGGER trg_prevent_invoice_delete
  BEFORE DELETE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_invoice_delete();

-- =============================================================
-- 8. PREVENT LINE ITEM CHANGES ON LOCKED INVOICES
-- =============================================================

CREATE OR REPLACE FUNCTION prevent_locked_line_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  inv_locked TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT locked_at INTO inv_locked FROM invoices WHERE id = NEW.invoice_id;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT locked_at INTO inv_locked FROM invoices WHERE id = OLD.invoice_id;
  ELSE
    SELECT locked_at INTO inv_locked FROM invoices WHERE id = OLD.invoice_id;
  END IF;

  IF inv_locked IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot modify line items on a locked invoice. Use credit notes for adjustments.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_line_item_changes ON invoice_line_items;
CREATE TRIGGER trg_prevent_locked_line_item_changes
  BEFORE INSERT OR UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_line_item_changes();

-- =============================================================
-- 9. UPDATE INVOICE credit_note_total WHEN CREDIT NOTE IS APPLIED
-- =============================================================

CREATE OR REPLACE FUNCTION update_invoice_credit_note_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'applied' AND (OLD.status IS NULL OR OLD.status != 'applied') THEN
    UPDATE invoices
    SET credit_note_total = credit_note_total + NEW.total,
        updated_at = now()
    WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_invoice_credit_total ON credit_notes;
CREATE TRIGGER trg_update_invoice_credit_total
  AFTER UPDATE ON credit_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_credit_note_total();

-- =============================================================
-- 10. ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_line_items ENABLE ROW LEVEL SECURITY;

-- Staff (non-portal) can manage credit notes
DO $$ BEGIN
  CREATE POLICY "Staff manage credit_notes" ON credit_notes
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role != 'participant_portal'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage credit_note_line_items" ON credit_note_line_items
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role != 'participant_portal'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Portal users can view credit notes on their invoices (read-only)
DO $$ BEGIN
  CREATE POLICY "Portal users view own credit_notes" ON credit_notes
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'participant_portal'
      )
      AND participant_id IN (
        SELECT id FROM participants
        WHERE id = credit_notes.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal users view own credit_note_line_items" ON credit_note_line_items
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM credit_notes cn
        JOIN invoices i ON i.id = cn.invoice_id
        WHERE cn.id = credit_note_line_items.credit_note_id
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role = 'participant_portal'
        )
        AND i.participant_id IN (
          SELECT id FROM participants
          WHERE id = i.participant_id
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- 11. BACKFILL: Lock all existing non-draft invoices
-- =============================================================

UPDATE invoices
SET locked_at = COALESCE(submitted_at, updated_at, created_at),
    locked_by = created_by
WHERE status != 'draft'
  AND locked_at IS NULL;
