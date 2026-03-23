-- v2 Phase 13: Reporting & Analytics Engine
-- Configurable report definitions, scheduled report runs, KPI snapshots,
-- cross-domain analytics views, NDIS compliance reporting, dashboard widgets,
-- data export tracking, and organisation-wide performance metrics
-- Fully idempotent: safe to re-run

-- =============================================
-- ENUMS
-- =============================================

DO $$ BEGIN
  CREATE TYPE report_category AS ENUM (
    'participant',       -- individual participant reports
    'workforce',         -- staff/rostering/compliance
    'financial',         -- billing, claims, budget
    'clinical',          -- medications, incidents, health
    'compliance',        -- NDIS Practice Standards, audits
    'operational',       -- bookings, shifts, service delivery
    'quality',           -- quality indicators, feedback, CARs
    'executive'          -- high-level KPI dashboards
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_format AS ENUM (
    'table', 'chart', 'pdf', 'csv', 'xlsx', 'dashboard_widget'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_run_status AS ENUM (
    'queued', 'running', 'completed', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE schedule_frequency AS ENUM (
    'daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'annually', 'on_demand'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kpi_trend AS ENUM (
    'improving', 'stable', 'declining', 'insufficient_data'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kpi_domain AS ENUM (
    'service_delivery', 'participant_outcomes', 'workforce',
    'financial', 'compliance', 'quality', 'safety', 'satisfaction'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE widget_type AS ENUM (
    'number_card', 'line_chart', 'bar_chart', 'pie_chart',
    'table', 'gauge', 'heatmap', 'trend_indicator', 'list'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE export_status AS ENUM (
    'pending', 'generating', 'ready', 'downloaded', 'expired', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 1. REPORT DEFINITIONS
-- Configurable report templates
-- =============================================
CREATE TABLE IF NOT EXISTS report_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,                -- url-friendly identifier
  description TEXT,
  category report_category NOT NULL,
  default_format report_format NOT NULL DEFAULT 'table',
  available_formats report_format[] NOT NULL DEFAULT '{table}',
  -- Query configuration
  source_query TEXT,                        -- SQL or view name backing the report
  source_view TEXT,                         -- reference to an existing view
  -- Parameters the user can configure when running
  parameters JSONB NOT NULL DEFAULT '[]',   -- [{name, type, label, default, required, options}]
  -- Column configuration
  columns JSONB NOT NULL DEFAULT '[]',      -- [{key, label, type, sortable, filterable, format}]
  -- Grouping and aggregation
  default_group_by TEXT[],
  default_sort_column TEXT,
  default_sort_direction TEXT CHECK (default_sort_direction IN ('asc', 'desc')) DEFAULT 'desc',
  -- Access control
  required_role TEXT[] NOT NULL DEFAULT '{director,admin}',
  is_system BOOLEAN NOT NULL DEFAULT false, -- built-in report, cannot be deleted
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_defs_category ON report_definitions(category);
CREATE INDEX IF NOT EXISTS idx_report_defs_slug ON report_definitions(slug);
CREATE INDEX IF NOT EXISTS idx_report_defs_active ON report_definitions(is_active) WHERE is_active = true;

-- =============================================
-- 2. REPORT SCHEDULES
-- Automated recurring report generation
-- =============================================
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_definition_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency schedule_frequency NOT NULL,
  -- Scheduling details
  run_day_of_week INTEGER CHECK (run_day_of_week BETWEEN 0 AND 6), -- 0=Sun for weekly
  run_day_of_month INTEGER CHECK (run_day_of_month BETWEEN 1 AND 28), -- for monthly
  run_time TIME NOT NULL DEFAULT '06:00',   -- time of day to run
  timezone TEXT NOT NULL DEFAULT 'Australia/Melbourne',
  -- Report parameters for this schedule
  parameters JSONB NOT NULL DEFAULT '{}',
  output_format report_format NOT NULL DEFAULT 'pdf',
  -- Distribution
  email_recipients TEXT[] DEFAULT '{}',
  send_empty BOOLEAN NOT NULL DEFAULT false, -- send even if no data
  -- State
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_next ON report_schedules(next_run_at)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_def ON report_schedules(report_definition_id);

-- =============================================
-- 3. REPORT RUNS
-- Execution log for every report generation
-- =============================================
CREATE TABLE IF NOT EXISTS report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_definition_id UUID NOT NULL REFERENCES report_definitions(id),
  schedule_id UUID REFERENCES report_schedules(id),   -- NULL for ad-hoc runs
  status report_run_status NOT NULL DEFAULT 'queued',
  -- Parameters used for this specific run
  parameters JSONB NOT NULL DEFAULT '{}',
  output_format report_format NOT NULL DEFAULT 'table',
  -- Date range for the data
  date_from DATE,
  date_to DATE,
  -- Results
  row_count INTEGER,
  result_summary JSONB,              -- cached aggregate stats for quick display
  file_path TEXT,                    -- storage path for generated file (pdf/csv/xlsx)
  file_size_bytes BIGINT,
  -- Execution tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  -- Who ran it
  triggered_by UUID REFERENCES profiles(id), -- NULL for scheduled runs
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_runs_definition ON report_runs(report_definition_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_status ON report_runs(status);
CREATE INDEX IF NOT EXISTS idx_report_runs_created ON report_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_report_runs_triggered ON report_runs(triggered_by);

-- =============================================
-- 4. KPI DEFINITIONS
-- Organisation-wide key performance indicators
-- =============================================
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  domain kpi_domain NOT NULL,
  unit TEXT NOT NULL DEFAULT '%',            -- %, count, $, hours, days, etc.
  -- Targets
  target_value DECIMAL(12,2),
  warning_threshold DECIMAL(12,2),          -- amber zone
  critical_threshold DECIMAL(12,2),         -- red zone
  higher_is_better BOOLEAN NOT NULL DEFAULT true,
  -- Calculation
  calculation_query TEXT,                   -- SQL to compute current value
  calculation_function TEXT,                -- or a PL/pgSQL function name
  -- Display
  display_format TEXT DEFAULT '0.0',        -- number format pattern
  widget_type widget_type NOT NULL DEFAULT 'number_card',
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_defs_domain ON kpi_definitions(domain);
CREATE INDEX IF NOT EXISTS idx_kpi_defs_active ON kpi_definitions(is_active) WHERE is_active = true;

-- =============================================
-- 5. KPI SNAPSHOTS
-- Point-in-time KPI measurements
-- =============================================
CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  previous_value DECIMAL(12,2),             -- prior period for comparison
  trend kpi_trend NOT NULL DEFAULT 'insufficient_data',
  change_pct DECIMAL(8,2),                  -- % change from previous
  -- Breakdown (optional)
  breakdown JSONB,                          -- e.g. {by_region: [...], by_team: [...]}
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kpi_snapshots_unique
  ON kpi_snapshots(kpi_definition_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_date ON kpi_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_kpi ON kpi_snapshots(kpi_definition_id);

-- =============================================
-- 6. DASHBOARD CONFIGURATIONS
-- Personalised dashboard layouts per user
-- =============================================
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,  -- visible to all staff
  layout JSONB NOT NULL DEFAULT '[]',        -- [{widget_id, x, y, w, h}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboards_owner ON dashboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_shared ON dashboards(is_shared) WHERE is_shared = true;

-- =============================================
-- 7. DASHBOARD WIDGETS
-- Individual widgets on dashboards
-- =============================================
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  widget_type widget_type NOT NULL,
  -- Data source: either a KPI, report, or custom query
  kpi_definition_id UUID REFERENCES kpi_definitions(id),
  report_definition_id UUID REFERENCES report_definitions(id),
  custom_query TEXT,
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',       -- type-specific: colors, thresholds, filters
  refresh_interval_seconds INTEGER DEFAULT 300, -- 5 min default
  -- Position managed by dashboard.layout but also stored here as fallback
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 4,          -- grid units (12-col grid)
  height INTEGER NOT NULL DEFAULT 3,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_widgets_kpi ON dashboard_widgets(kpi_definition_id);
CREATE INDEX IF NOT EXISTS idx_widgets_report ON dashboard_widgets(report_definition_id);

-- =============================================
-- 8. DATA EXPORTS
-- Track bulk data export requests
-- =============================================
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN (
    'participant_list', 'shift_history', 'incident_register',
    'medication_register', 'financial_summary', 'compliance_pack',
    'worker_register', 'goal_outcomes', 'custom_report',
    'ndis_quarterly', 'full_audit_trail'
  )),
  status export_status NOT NULL DEFAULT 'pending',
  -- Scope
  parameters JSONB NOT NULL DEFAULT '{}',    -- filters: date range, participant, etc.
  date_from DATE,
  date_to DATE,
  -- Output
  format report_format NOT NULL DEFAULT 'csv',
  file_path TEXT,
  file_size_bytes BIGINT,
  row_count INTEGER,
  -- Tracking
  requested_by UUID NOT NULL REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                    -- auto-cleanup after this date
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exports_requested_by ON data_exports(requested_by);
CREATE INDEX IF NOT EXISTS idx_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_exports_expires ON data_exports(expires_at)
  WHERE status = 'ready';

-- =============================================
-- 9. SAVED FILTERS / REPORT BOOKMARKS
-- Users can save frequently-used filter sets
-- =============================================
CREATE TABLE IF NOT EXISTS saved_report_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_definition_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',       -- parameter values
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_report_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_report ON saved_report_filters(report_definition_id);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_reporting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS report_definitions_updated_at ON report_definitions;
CREATE TRIGGER report_definitions_updated_at
  BEFORE UPDATE ON report_definitions
  FOR EACH ROW EXECUTE FUNCTION update_reporting_updated_at();

DROP TRIGGER IF EXISTS report_schedules_updated_at ON report_schedules;
CREATE TRIGGER report_schedules_updated_at
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW EXECUTE FUNCTION update_reporting_updated_at();

DROP TRIGGER IF EXISTS kpi_definitions_updated_at ON kpi_definitions;
CREATE TRIGGER kpi_definitions_updated_at
  BEFORE UPDATE ON kpi_definitions
  FOR EACH ROW EXECUTE FUNCTION update_reporting_updated_at();

DROP TRIGGER IF EXISTS dashboards_updated_at ON dashboards;
CREATE TRIGGER dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW EXECUTE FUNCTION update_reporting_updated_at();

DROP TRIGGER IF EXISTS dashboard_widgets_updated_at ON dashboard_widgets;
CREATE TRIGGER dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION update_reporting_updated_at();

DROP TRIGGER IF EXISTS saved_report_filters_updated_at ON saved_report_filters;
CREATE TRIGGER saved_report_filters_updated_at
  BEFORE UPDATE ON saved_report_filters
  FOR EACH ROW EXECUTE FUNCTION update_reporting_updated_at();

-- =============================================
-- 10. CROSS-DOMAIN ANALYTICS VIEWS
-- =============================================

-- Organisation-wide KPI summary
CREATE OR REPLACE VIEW organisation_kpi_dashboard AS
SELECT
  kd.id AS kpi_id,
  kd.name,
  kd.slug,
  kd.domain,
  kd.unit,
  kd.target_value,
  kd.warning_threshold,
  kd.critical_threshold,
  kd.higher_is_better,
  kd.widget_type,
  ks.value AS current_value,
  ks.previous_value,
  ks.trend,
  ks.change_pct,
  ks.snapshot_date,
  ks.period_start,
  ks.period_end,
  CASE
    WHEN kd.target_value IS NULL THEN 'no_target'
    WHEN kd.higher_is_better AND ks.value >= kd.target_value THEN 'on_target'
    WHEN NOT kd.higher_is_better AND ks.value <= kd.target_value THEN 'on_target'
    WHEN kd.warning_threshold IS NOT NULL AND kd.higher_is_better AND ks.value >= kd.warning_threshold THEN 'warning'
    WHEN kd.warning_threshold IS NOT NULL AND NOT kd.higher_is_better AND ks.value <= kd.warning_threshold THEN 'warning'
    ELSE 'critical'
  END AS status
FROM kpi_definitions kd
LEFT JOIN LATERAL (
  SELECT * FROM kpi_snapshots s
  WHERE s.kpi_definition_id = kd.id
  ORDER BY s.snapshot_date DESC
  LIMIT 1
) ks ON true
WHERE kd.is_active = true
ORDER BY kd.domain, kd.name;

-- Participant outcomes summary (cross-domain)
CREATE OR REPLACE VIEW participant_outcomes_overview AS
SELECT
  p.id AS participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  p.status AS participant_status,
  -- Goal progress
  COUNT(DISTINCT g.id) FILTER (WHERE g.status = 'in_progress') AS active_goals,
  COUNT(DISTINCT g.id) FILTER (WHERE g.status = 'achieved') AS achieved_goals,
  AVG(g.current_progress) FILTER (WHERE g.status = 'in_progress') AS avg_goal_progress,
  -- Service delivery (last 30 days)
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.status = 'completed'
    AND s.shift_date >= (NOW() - INTERVAL '30 days')::DATE
  ) AS shifts_last_30d,
  -- Incidents (last 90 days)
  COUNT(DISTINCT i.id) FILTER (
    WHERE i.created_at >= NOW() - INTERVAL '90 days'
  ) AS incidents_last_90d,
  -- Medication adherence (if applicable)
  (
    SELECT ROUND(
      COUNT(*) FILTER (WHERE mal.outcome IN ('given', 'self_administered'))::DECIMAL
      / NULLIF(COUNT(*), 0) * 100, 1
    )
    FROM medication_administration_log mal
    WHERE mal.participant_id = p.id
      AND mal.scheduled_at >= NOW() - INTERVAL '30 days'
  ) AS med_adherence_30d_pct,
  -- Risk level
  (
    SELECT ra.calculated_level
    FROM risk_assessments ra
    JOIN risks rsk ON rsk.id = ra.risk_id
    WHERE rsk.participant_id = p.id
    ORDER BY ra.assessment_date DESC
    LIMIT 1
  ) AS current_risk_level,
  -- Budget utilisation
  (
    SELECT bs.core_utilisation_pct
    FROM budget_snapshots bs
    WHERE bs.participant_id = p.id
    ORDER BY bs.snapshot_date DESC
    LIMIT 1
  ) AS budget_utilisation_pct,
  -- Satisfaction
  (
    SELECT ROUND(AVG(sf.rating), 1)
    FROM service_feedback sf
    WHERE sf.participant_id = p.id
      AND sf.feedback_date >= NOW() - INTERVAL '180 days'
  ) AS avg_satisfaction_6m
FROM participants p
LEFT JOIN goals g ON g.participant_id = p.id
LEFT JOIN shifts s ON s.participant_id = p.id
LEFT JOIN incidents i ON i.participant_id = p.id
WHERE p.status = 'active'
GROUP BY p.id, p.first_name, p.last_name, p.status
ORDER BY p.last_name, p.first_name;

-- Workforce analytics summary
CREATE OR REPLACE VIEW workforce_analytics AS
SELECT
  pr.id AS worker_id,
  pr.full_name,
  pr.role,
  w.employment_type,
  (w.status = 'active') AS worker_active,
  -- Compliance
  w.ndis_screening_status,
  w.police_check_status,
  w.wwcc_status,
  w.ndis_screening_date,
  w.police_check_expiry,
  w.wwcc_expiry,
  CASE
    WHEN w.ndis_screening_status IN ('expired', 'barred')
      OR w.police_check_expiry < CURRENT_DATE
      OR w.wwcc_expiry < CURRENT_DATE THEN 'expired'
    WHEN w.police_check_expiry < CURRENT_DATE + INTERVAL '30 days'
      OR w.wwcc_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'compliant'
  END AS compliance_status,
  -- Shift metrics (last 30 days)
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.status = 'completed'
    AND s.shift_date >= (NOW() - INTERVAL '30 days')::DATE
  ) AS shifts_completed_30d,
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.status = 'cancelled'
    AND s.shift_date >= (NOW() - INTERVAL '30 days')::DATE
  ) AS shifts_cancelled_30d,
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.status = 'no_show'
    AND s.shift_date >= (NOW() - INTERVAL '30 days')::DATE
  ) AS no_shows_30d,
  -- Hours (last 30 days)
  COALESCE(SUM(
    EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
  ) FILTER (
    WHERE s.status = 'completed'
    AND s.shift_date >= (NOW() - INTERVAL '30 days')::DATE
  ), 0)::DECIMAL(8,2) AS hours_worked_30d,
  -- Incident involvement (last 90 days)
  (
    SELECT COUNT(*)
    FROM incidents inc
    WHERE inc.logged_by = pr.id
      AND inc.created_at >= NOW() - INTERVAL '90 days'
  ) AS incidents_reported_90d,
  -- Unique participants served (last 30 days)
  COUNT(DISTINCT s.participant_id) FILTER (
    WHERE s.status = 'completed'
    AND s.shift_date >= (NOW() - INTERVAL '30 days')::DATE
  ) AS participants_served_30d
FROM profiles pr
LEFT JOIN workers w ON w.profile_id = pr.id
LEFT JOIN shifts s ON s.worker_id = pr.id
WHERE pr.role IN ('worker', 'admin', 'director')
  AND w.id IS NOT NULL
GROUP BY pr.id, pr.full_name, pr.role,
  w.employment_type, w.status,
  w.status, w.ndis_screening_status, w.police_check_status, w.wwcc_status,
  w.ndis_screening_date, w.police_check_expiry, w.wwcc_expiry
ORDER BY pr.full_name;

-- Compliance overview (NDIS Practice Standards alignment)
CREATE OR REPLACE VIEW compliance_dashboard AS
SELECT
  -- Worker compliance
  (SELECT COUNT(*) FROM workers WHERE status = 'active') AS total_active_workers,
  (SELECT COUNT(*) FROM workers WHERE status = 'active'
    AND ndis_screening_status = 'cleared'
    AND police_check_expiry >= CURRENT_DATE
    AND wwcc_expiry >= CURRENT_DATE
  ) AS workers_fully_compliant,
  (SELECT COUNT(*) FROM workers WHERE status = 'active'
    AND (ndis_screening_status IN ('expired', 'barred')
      OR police_check_expiry < CURRENT_DATE
      OR wwcc_expiry < CURRENT_DATE)
  ) AS workers_with_expired_checks,
  -- Incident reporting
  (SELECT COUNT(*) FROM incidents
    WHERE created_at >= NOW() - INTERVAL '30 days'
  ) AS incidents_last_30d,
  (SELECT COUNT(*) FROM incidents
    WHERE is_reportable = true
    AND reported_to_commission = false
    AND created_at >= NOW() - INTERVAL '90 days'
  ) AS reportable_incidents_pending,
  -- Complaints
  (SELECT COUNT(*) FROM complaints
    WHERE status NOT IN ('resolved', 'withdrawn')
  ) AS open_complaints,
  (SELECT COUNT(*) FROM complaints
    WHERE status NOT IN ('resolved', 'withdrawn')
    AND created_at < NOW() - INTERVAL '30 days'
  ) AS overdue_complaints,
  -- Consent
  (SELECT COUNT(*) FROM consent_records
    WHERE consent_status = 'active'
    AND (review_date IS NOT NULL AND review_date < CURRENT_DATE)
  ) AS consents_needing_review,
  -- Risk
  (SELECT COUNT(*) FROM risks
    WHERE status = 'active'
    AND risk_level IN ('high', 'critical')
  ) AS high_critical_active_risks,
  -- CARs
  (SELECT COUNT(*) FROM corrective_action_requests
    WHERE status NOT IN ('closed', 'verified_effective')
  ) AS open_cars,
  (SELECT COUNT(*) FROM car_action_items
    WHERE status NOT IN ('completed', 'cancelled')
    AND target_date < CURRENT_DATE
  ) AS overdue_car_actions,
  -- Audit findings
  (SELECT COUNT(*) FROM audit_findings
    WHERE status NOT IN ('closed', 'accepted_risk')
    AND severity IN ('major_nc', 'critical_nc')
  ) AS open_major_audit_findings,
  -- Medication
  (SELECT COUNT(*) FROM medication_incidents
    WHERE created_at >= NOW() - INTERVAL '30 days'
  ) AS med_incidents_last_30d;

-- Service delivery trends (monthly aggregation)
CREATE OR REPLACE VIEW monthly_service_delivery AS
SELECT
  DATE_TRUNC('month', s.shift_date)::DATE AS month,
  COUNT(DISTINCT s.id) AS total_shifts,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS completed_shifts,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'cancelled') AS cancelled_shifts,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'no_show') AS no_show_shifts,
  COUNT(DISTINCT s.participant_id) AS unique_participants,
  COUNT(DISTINCT s.worker_id) AS unique_workers,
  COALESCE(SUM(
    EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
  ) FILTER (WHERE s.status = 'completed'), 0)::DECIMAL(10,2) AS total_hours_delivered,
  ROUND(
    COUNT(*) FILTER (WHERE s.status = 'completed')::DECIMAL
    / NULLIF(COUNT(*) FILTER (WHERE s.status NOT IN ('draft', 'published')), 0) * 100, 1
  ) AS completion_rate_pct
FROM shifts s
WHERE s.shift_date >= (NOW() - INTERVAL '12 months')::DATE
GROUP BY DATE_TRUNC('month', s.shift_date)
ORDER BY month DESC;

-- Incident trends (monthly)
CREATE OR REPLACE VIEW monthly_incident_trends AS
SELECT
  DATE_TRUNC('month', i.created_at)::DATE AS month,
  COUNT(*) AS total_incidents,
  COUNT(*) FILTER (WHERE i.severity = 'critical') AS critical_count,
  COUNT(*) FILTER (WHERE i.severity = 'major') AS major_count,
  COUNT(*) FILTER (WHERE i.severity = 'moderate') AS moderate_count,
  COUNT(*) FILTER (WHERE i.severity = 'minor') AS minor_count,
  COUNT(*) FILTER (WHERE i.is_reportable = true) AS reportable_count,
  COUNT(DISTINCT i.participant_id) AS affected_participants,
  -- By type
  COUNT(*) FILTER (WHERE i.incident_type = 'injury') AS injury_count,
  COUNT(*) FILTER (WHERE i.incident_type = 'medication_error') AS med_error_count,
  COUNT(*) FILTER (WHERE i.incident_type = 'abuse_neglect') AS abuse_neglect_count,
  COUNT(*) FILTER (WHERE i.incident_type = 'restrictive_practice') AS restrictive_practice_count,
  COUNT(*) FILTER (WHERE i.incident_type = 'missing_person') AS missing_person_count
FROM incidents i
WHERE i.created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', i.created_at)
ORDER BY month DESC;

-- Financial performance summary (monthly)
CREATE OR REPLACE VIEW monthly_financial_performance AS
SELECT
  DATE_TRUNC('month', inv.invoice_date)::DATE AS month,
  COUNT(DISTINCT inv.id) AS invoices_raised,
  SUM(inv.total) AS total_invoiced,
  SUM(inv.total) FILTER (WHERE inv.status = 'paid') AS total_paid,
  SUM(inv.total) FILTER (WHERE inv.status IN ('submitted', 'approved')) AS total_outstanding,
  SUM(inv.total) FILTER (WHERE inv.status = 'rejected') AS total_rejected,
  COUNT(DISTINCT inv.participant_id) AS participants_invoiced,
  -- Average days to payment
  AVG(
    (pr.payment_date - inv.invoice_date)
  ) FILTER (WHERE inv.status = 'paid') AS avg_days_to_payment
FROM invoices inv
LEFT JOIN payments_received pr ON pr.id = (
  SELECT pa.payment_id FROM payment_allocations pa
  WHERE pa.invoice_id = inv.id
  LIMIT 1
)
WHERE inv.invoice_date >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', inv.invoice_date)
ORDER BY month DESC;

-- =============================================
-- 11. NDIS QUARTERLY REPORTING FUNCTION
-- Aggregates data for NDIS Practice Standards reporting
-- =============================================
CREATE OR REPLACE FUNCTION ndis_quarterly_report(
  p_quarter_start DATE DEFAULT DATE_TRUNC('quarter', CURRENT_DATE)::DATE,
  p_quarter_end DATE DEFAULT (DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months' - INTERVAL '1 day')::DATE
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'start', p_quarter_start,
      'end', p_quarter_end
    ),
    'participants', jsonb_build_object(
      'total_active', (SELECT COUNT(*) FROM participants WHERE status = 'active'),
      'new_this_quarter', (SELECT COUNT(*) FROM participants
        WHERE created_at::DATE BETWEEN p_quarter_start AND p_quarter_end),
      'exited_this_quarter', (SELECT COUNT(*) FROM participants
        WHERE status = 'inactive' AND updated_at::DATE BETWEEN p_quarter_start AND p_quarter_end)
    ),
    'service_delivery', jsonb_build_object(
      'total_shifts', (SELECT COUNT(*) FROM shifts
        WHERE shift_date BETWEEN p_quarter_start AND p_quarter_end AND status = 'completed'),
      'total_hours', (SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 0)
        FROM shifts WHERE shift_date BETWEEN p_quarter_start AND p_quarter_end AND status = 'completed'),
      'unique_participants_served', (SELECT COUNT(DISTINCT participant_id) FROM shifts
        WHERE shift_date BETWEEN p_quarter_start AND p_quarter_end AND status = 'completed'),
      'cancellation_rate', (SELECT ROUND(
        COUNT(*) FILTER (WHERE status = 'cancelled')::DECIMAL
        / NULLIF(COUNT(*) FILTER (WHERE status NOT IN ('draft', 'published')), 0) * 100, 1)
        FROM shifts WHERE shift_date BETWEEN p_quarter_start AND p_quarter_end)
    ),
    'incidents', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM incidents
        WHERE created_at::DATE BETWEEN p_quarter_start AND p_quarter_end),
      'reportable', (SELECT COUNT(*) FROM incidents
        WHERE created_at::DATE BETWEEN p_quarter_start AND p_quarter_end AND is_reportable = true),
      'reported_to_commission', (SELECT COUNT(*) FROM incidents
        WHERE created_at::DATE BETWEEN p_quarter_start AND p_quarter_end AND reported_to_commission = true),
      'by_severity', (SELECT jsonb_object_agg(severity, cnt) FROM (
        SELECT severity, COUNT(*) AS cnt FROM incidents
        WHERE created_at::DATE BETWEEN p_quarter_start AND p_quarter_end
        GROUP BY severity) sub)
    ),
    'complaints', jsonb_build_object(
      'total_received', (SELECT COUNT(*) FROM complaints
        WHERE created_at::DATE BETWEEN p_quarter_start AND p_quarter_end),
      'resolved', (SELECT COUNT(*) FROM complaints
        WHERE resolved_at::DATE BETWEEN p_quarter_start AND p_quarter_end),
      'avg_resolution_days', (SELECT ROUND(AVG(
        EXTRACT(DAY FROM (resolved_at - created_at))), 1)
        FROM complaints WHERE resolved_at::DATE BETWEEN p_quarter_start AND p_quarter_end)
    ),
    'goals', jsonb_build_object(
      'total_active', (SELECT COUNT(*) FROM goals
        WHERE status = 'in_progress'),
      'achieved_this_quarter', (SELECT COUNT(*) FROM goals
        WHERE status = 'achieved' AND updated_at::DATE BETWEEN p_quarter_start AND p_quarter_end),
      'avg_progress', (SELECT ROUND(AVG(current_progress), 1)
        FROM goals WHERE status = 'in_progress')
    ),
    'workforce', jsonb_build_object(
      'total_active_workers', (SELECT COUNT(*) FROM workers WHERE status = 'active'),
      'fully_compliant', (SELECT COUNT(*) FROM workers WHERE status = 'active'
        AND ndis_screening_status = 'cleared'
        AND police_check_expiry >= p_quarter_end
        AND wwcc_expiry >= p_quarter_end),
      'new_hires', (SELECT COUNT(*) FROM workers
        WHERE created_at::DATE BETWEEN p_quarter_start AND p_quarter_end)
    ),
    'financial', jsonb_build_object(
      'total_invoiced', (SELECT COALESCE(SUM(total), 0) FROM invoices
        WHERE invoice_date BETWEEN p_quarter_start AND p_quarter_end),
      'total_collected', (SELECT COALESCE(SUM(amount), 0) FROM payments_received
        WHERE payment_date BETWEEN p_quarter_start AND p_quarter_end),
      'claims_submitted', (SELECT COUNT(*) FROM claim_batches
        WHERE submitted_at::DATE BETWEEN p_quarter_start AND p_quarter_end),
      'claim_rejection_rate', (SELECT ROUND(
        COUNT(*) FILTER (WHERE status = 'rejected')::DECIMAL
        / NULLIF(COUNT(*), 0) * 100, 1)
        FROM claim_items WHERE created_at::DATE BETWEEN p_quarter_start AND p_quarter_end)
    ),
    'quality', jsonb_build_object(
      'open_cars', (SELECT COUNT(*) FROM corrective_action_requests
        WHERE status NOT IN ('closed', 'verified_effective')),
      'cars_closed_this_quarter', (SELECT COUNT(*) FROM corrective_action_requests
        WHERE status IN ('closed', 'verified_effective')
        AND updated_at::DATE BETWEEN p_quarter_start AND p_quarter_end),
      'avg_feedback_rating', (SELECT ROUND(AVG(rating), 1) FROM service_feedback
        WHERE feedback_date BETWEEN p_quarter_start AND p_quarter_end),
      'internal_audits_completed', (SELECT COUNT(*) FROM internal_audits
        WHERE status = 'completed'
        AND completion_date BETWEEN p_quarter_start AND p_quarter_end)
    ),
    'medications', jsonb_build_object(
      'participants_on_meds', (SELECT COUNT(DISTINCT participant_id)
        FROM medications WHERE status = 'active'),
      'med_incidents', (SELECT COUNT(*) FROM medication_incidents
        WHERE created_at::DATE BETWEEN p_quarter_start AND p_quarter_end),
      'avg_adherence_pct', (SELECT ROUND(
        COUNT(*) FILTER (WHERE outcome IN ('given', 'self_administered'))::DECIMAL
        / NULLIF(COUNT(*), 0) * 100, 1)
        FROM medication_administration_log
        WHERE scheduled_at::DATE BETWEEN p_quarter_start AND p_quarter_end)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =============================================
-- 12. PARTICIPANT REPORT CARD FUNCTION
-- Comprehensive single-participant summary
-- =============================================
CREATE OR REPLACE FUNCTION participant_report_card(
  p_participant_id UUID,
  p_from_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
  p_to_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_result JSONB;
  v_participant RECORD;
BEGIN
  SELECT * INTO v_participant FROM participants WHERE id = p_participant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant not found: %', p_participant_id;
  END IF;

  SELECT jsonb_build_object(
    'participant', jsonb_build_object(
      'id', v_participant.id,
      'name', v_participant.first_name || ' ' || v_participant.last_name,
      'ndis_number', v_participant.ndis_number,
      'status', v_participant.status
    ),
    'period', jsonb_build_object('from', p_from_date, 'to', p_to_date),
    'goals', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', g.title,
        'domain', g.domain,
        'status', g.status,
        'progress', g.current_progress,
        'entries_in_period', (SELECT COUNT(*) FROM goal_progress_entries gpe
          WHERE gpe.goal_id = g.id AND gpe.recorded_at::DATE BETWEEN p_from_date AND p_to_date)
      )), '[]'::jsonb)
      FROM goals g WHERE g.participant_id = p_participant_id
        AND g.status IN ('in_progress', 'achieved')
    ),
    'service_delivery', jsonb_build_object(
      'total_shifts', (SELECT COUNT(*) FROM shifts
        WHERE participant_id = p_participant_id
        AND shift_date BETWEEN p_from_date AND p_to_date AND status = 'completed'),
      'total_hours', (SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 0)
        FROM shifts WHERE participant_id = p_participant_id
        AND shift_date BETWEEN p_from_date AND p_to_date AND status = 'completed'),
      'unique_workers', (SELECT COUNT(DISTINCT worker_id) FROM shifts
        WHERE participant_id = p_participant_id
        AND shift_date BETWEEN p_from_date AND p_to_date AND status = 'completed')
    ),
    'incidents', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'type', i.incident_type, 'severity', i.severity, 'date', i.incident_date, 'status', i.status
      )), '[]'::jsonb)
      FROM incidents i WHERE i.participant_id = p_participant_id
        AND i.created_at::DATE BETWEEN p_from_date AND p_to_date
    ),
    'medications', jsonb_build_object(
      'active_count', (SELECT COUNT(*) FROM medications
        WHERE participant_id = p_participant_id AND status = 'active'),
      'adherence_pct', (SELECT ROUND(
        COUNT(*) FILTER (WHERE outcome IN ('given', 'self_administered'))::DECIMAL
        / NULLIF(COUNT(*), 0) * 100, 1)
        FROM medication_administration_log
        WHERE participant_id = p_participant_id
        AND scheduled_at::DATE BETWEEN p_from_date AND p_to_date)
    ),
    'financial', jsonb_build_object(
      'total_invoiced', (SELECT COALESCE(SUM(total), 0) FROM invoices
        WHERE participant_id = p_participant_id
        AND invoice_date BETWEEN p_from_date AND p_to_date),
      'budget_utilisation', (SELECT total_utilisation_pct FROM budget_snapshots
        WHERE participant_id = p_participant_id
        ORDER BY snapshot_date DESC LIMIT 1)
    ),
    'satisfaction', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'rating', sf.rating, 'date', sf.feedback_date::DATE, 'source', sf.feedback_source
      )), '[]'::jsonb)
      FROM service_feedback sf WHERE sf.participant_id = p_participant_id
        AND sf.feedback_date::DATE BETWEEN p_from_date AND p_to_date
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =============================================
-- 13. SEED BUILT-IN REPORT DEFINITIONS
-- =============================================
INSERT INTO report_definitions (name, slug, description, category, default_format, available_formats, source_view, is_system, required_role, tags)
VALUES
  ('Active Participant Summary', 'active-participant-summary',
   'Overview of all active participants with goals, budget, and risk status',
   'participant', 'table', '{table,csv,pdf}',
   'participant_outcomes_overview', true, '{director,admin,worker}',
   '{participants,overview}'),

  ('Workforce Compliance Report', 'workforce-compliance',
   'Worker screening status, expiry dates, and compliance gaps',
   'workforce', 'table', '{table,csv,pdf}',
   'workforce_analytics', true, '{director,admin}',
   '{compliance,workforce,screening}'),

  ('Monthly Service Delivery', 'monthly-service-delivery',
   'Shift completion rates, hours delivered, and cancellation trends by month',
   'operational', 'chart', '{table,chart,csv,pdf}',
   'monthly_service_delivery', true, '{director,admin}',
   '{shifts,service_delivery,monthly}'),

  ('Incident Trends', 'incident-trends',
   'Monthly incident breakdown by type, severity, and reportability',
   'clinical', 'chart', '{table,chart,csv,pdf}',
   'monthly_incident_trends', true, '{director,admin}',
   '{incidents,trends,safety}'),

  ('Financial Performance', 'financial-performance',
   'Monthly invoicing, payments, and claim metrics',
   'financial', 'chart', '{table,chart,csv,pdf,xlsx}',
   'monthly_financial_performance', true, '{director,admin,plan_manager}',
   '{financial,invoicing,claims}'),

  ('Compliance Dashboard', 'compliance-dashboard',
   'Organisation-wide NDIS Practice Standards compliance snapshot',
   'compliance', 'dashboard_widget', '{table,pdf}',
   'compliance_dashboard', true, '{director,admin}',
   '{compliance,ndis,practice_standards}'),

  ('Medication Administration', 'medication-administration',
   'Medication adherence rates, missed doses, and incident tracking',
   'clinical', 'table', '{table,csv,pdf}',
   'missed_medication_doses', true, '{director,admin,worker}',
   '{medications,adherence,clinical}'),

  ('Upcoming Medication Reviews', 'upcoming-med-reviews',
   'Medications due for review within the next 30 days',
   'clinical', 'table', '{table,csv}',
   'upcoming_medication_reviews', true, '{director,admin,worker}',
   '{medications,reviews}'),

  ('S8 Controlled Substance Register', 's8-register',
   'Schedule 8 medication balances and audit trail',
   'clinical', 'table', '{table,csv,pdf}',
   'schedule_8_balances', true, '{director,admin}',
   '{medications,s8,controlled}'),

  ('Open Corrective Actions', 'open-cars',
   'Active CARs with overdue action items',
   'quality', 'table', '{table,csv,pdf}',
   'cars_overdue_actions', true, '{director,admin}',
   '{quality,cars,corrective_actions}'),

  ('Quality Indicators Status', 'quality-indicators',
   'Quality indicator measurement status and trends',
   'quality', 'chart', '{table,chart,csv}',
   'quality_indicators_status', true, '{director,admin}',
   '{quality,indicators,measurement}'),

  ('Organisation KPI Dashboard', 'org-kpi-dashboard',
   'All organisation KPIs with targets, trends, and status',
   'executive', 'dashboard_widget', '{table,pdf}',
   'organisation_kpi_dashboard', true, '{director}',
   '{kpi,executive,dashboard}')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_report_filters ENABLE ROW LEVEL SECURITY;

-- Report definitions: staff can view, directors/admins can manage
DO $$ BEGIN
  CREATE POLICY "Staff view report definitions" ON report_definitions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage report definitions" ON report_definitions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Report schedules: directors/admins only
DO $$ BEGIN
  CREATE POLICY "Admins manage report schedules" ON report_schedules
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Report runs: staff can view their own or if admin
DO $$ BEGIN
  CREATE POLICY "Staff view report runs" ON report_runs FOR SELECT TO authenticated
    USING (
      triggered_by = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff create report runs" ON report_runs FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- KPI definitions: staff can view, admins manage
DO $$ BEGIN
  CREATE POLICY "Staff view KPIs" ON kpi_definitions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage KPIs" ON kpi_definitions FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- KPI snapshots: staff can view, system inserts
DO $$ BEGIN
  CREATE POLICY "Staff view KPI snapshots" ON kpi_snapshots FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage KPI snapshots" ON kpi_snapshots FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Dashboards: users manage their own, can view shared
DO $$ BEGIN
  CREATE POLICY "Users manage own dashboards" ON dashboards FOR ALL TO authenticated
    USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff view shared dashboards" ON dashboards FOR SELECT TO authenticated
    USING (
      is_shared = true
      AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Dashboard widgets: access follows dashboard access
DO $$ BEGIN
  CREATE POLICY "Users manage own dashboard widgets" ON dashboard_widgets FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
      AND d.owner_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff view shared dashboard widgets" ON dashboard_widgets FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
      AND d.is_shared = true
      AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal')
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Data exports: users see own, admins see all
DO $$ BEGIN
  CREATE POLICY "Users manage own exports" ON data_exports FOR ALL TO authenticated
    USING (
      requested_by = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Saved filters: users manage own
DO $$ BEGIN
  CREATE POLICY "Users manage own saved filters" ON saved_report_filters FOR ALL TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grant view access to analytics views
GRANT SELECT ON organisation_kpi_dashboard TO authenticated;
GRANT SELECT ON participant_outcomes_overview TO authenticated;
GRANT SELECT ON workforce_analytics TO authenticated;
GRANT SELECT ON compliance_dashboard TO authenticated;
GRANT SELECT ON monthly_service_delivery TO authenticated;
GRANT SELECT ON monthly_incident_trends TO authenticated;
GRANT SELECT ON monthly_financial_performance TO authenticated;
