-- =========================================================
-- CLEAR OPERATIONAL / PEOPLE DATA ONLY
-- KEEPS: policies, AI conversations, reference/lookup data
-- Skips tables that don't exist yet (safe for partial deploys)
-- =========================================================

DO $$
DECLARE
  _tables TEXT[] := ARRAY[
    -- Phase 19: Emergency & Continuity
    'equipment_inspections','emergency_equipment','drill_participants',
    'emergency_drills','emergency_activations','service_continuity_arrangements',
    'business_continuity_plans','escalation_protocol_steps','escalation_protocols',
    'emergency_contacts','emergency_plan_scenarios','emergency_plans',

    -- Phase 18: Accessibility & Inclusion
    'worker_accessibility_competencies','participant_accessibility_requirements',
    'accessibility_assessments','accommodation_adjustments','cultural_inclusion_plans',
    'participant_sensory_needs','participant_assistive_technologies',
    'participant_accessibility_profiles',

    -- Phase 17: Medication Management
    'schedule_8_register','medication_administration_log','medication_schedule_times',
    'medication_changes','medication_reviews','medication_incidents','medications',
    'participant_medication_profiles','prescribers','pharmacies',

    -- Phase 16: Corrective Actions
    'car_action_items','corrective_action_requests',
    'root_cause_analyses','audit_findings','internal_audits',
    'quality_indicator_measurements','quality_indicators',
    'improvement_initiatives','lessons_learned','service_feedback',

    -- Phase 13: Risk Management
    'risk_review_log','risk_mitigation_plans','risk_assessments','risks',

    -- Phase 12: Consent & Rights
    'consent_audit_log','consent_records','rights_acknowledgments',
    'capacity_assessments','authorised_representatives',

    -- Phase 11: Document Management
    'document_access_log','document_versions','document_folders',

    -- Phase 10: Notifications & Messaging
    'message_thread_participants','messages','message_threads',
    'notification_preferences','notifications',

    -- Phase 9: Participant Portal
    'portal_activity_log','portal_access_tokens',

    -- Phase 8: Goals
    'goal_progress_entries','goals',

    -- Phase 7: Audit & Digests
    'audit_logs','email_digest_preferences',

    -- Phase 3: Invoicing (credit notes first, then line items, then invoices)
    'credit_note_line_items','credit_notes',
    'invoice_line_items','invoices',

    -- Phase 15: Financial
    'payment_allocations','payments_received',
    'claim_items','claim_batches',
    'financial_alerts','reconciliation_records',
    'pay_run_items','pay_runs','worker_pay_rates',
    'budget_snapshots',

    -- Phase 2: Progress Notes & Concerns
    'concerns','progress_notes',

    -- Phase 1: Core operational data
    'booking_participants','bookings','incidents','complaints',
    'communications','documents','service_agreements','workflows',
    'worker_participant_assignments',

    -- Phase 14: Shifts & Rostering
    'shifts','worker_skills','worker_availability','worker_blackout_dates',
    'participant_preferences','shift_templates','shift_template_entries',

    -- Phase 20: Reporting
    'dashboard_widgets','dashboards','kpi_snapshots','kpi_definitions',
    'data_exports','saved_report_filters',
    'report_runs','report_schedules','report_definitions',

    -- NDIS Plans
    'ndis_plans',

    -- Core entities (last — everything else references these)
    'workers','participants','organisation'
  ];
  _t TEXT;
BEGIN
  -- Temporarily disable invoice immutability triggers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    ALTER TABLE invoices DISABLE TRIGGER trg_prevent_locked_invoice_edits;
    ALTER TABLE invoices DISABLE TRIGGER trg_prevent_invoice_delete;
    ALTER TABLE invoices DISABLE TRIGGER trg_lock_invoice_on_approval;
    RAISE NOTICE 'Disabled invoice immutability triggers';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_line_items') THEN
    ALTER TABLE invoice_line_items DISABLE TRIGGER trg_prevent_locked_line_item_changes;
    RAISE NOTICE 'Disabled invoice_line_items immutability trigger';
  END IF;

  FOREACH _t IN ARRAY _tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = _t
    ) THEN
      EXECUTE format('DELETE FROM %I', _t);
      RAISE NOTICE 'Cleared: %', _t;
    ELSE
      RAISE NOTICE 'Skipped (does not exist): %', _t;
    END IF;
  END LOOP;

  -- Re-enable invoice immutability triggers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    ALTER TABLE invoices ENABLE TRIGGER trg_prevent_locked_invoice_edits;
    ALTER TABLE invoices ENABLE TRIGGER trg_prevent_invoice_delete;
    ALTER TABLE invoices ENABLE TRIGGER trg_lock_invoice_on_approval;
    RAISE NOTICE 'Re-enabled invoice immutability triggers';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_line_items') THEN
    ALTER TABLE invoice_line_items ENABLE TRIGGER trg_prevent_locked_line_item_changes;
    RAISE NOTICE 'Re-enabled invoice_line_items immutability trigger';
  END IF;
END;
$$;

-- =========================================================
-- PRESERVED (not touched):
--   policies:  policy_documents, policy_embeddings,
--              policy_document_masters, policy_document_versions
--   AI buddy:  ai_conversations, ai_messages
--   reference: ndis_price_guide, ndis_participant_rights,
--              document_retention_policies
--   auth:      profiles, auth.users
-- =========================================================
