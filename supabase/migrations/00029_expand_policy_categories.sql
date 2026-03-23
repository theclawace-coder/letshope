-- Expand policy_documents category constraint to support all Hope Disability Support document types
-- This allows ingestion of governance, risk management, participant docs, audit docs, etc.

ALTER TABLE policy_documents DROP CONSTRAINT IF EXISTS policy_documents_category_check;

ALTER TABLE policy_documents ADD CONSTRAINT policy_documents_category_check CHECK (category IN (
  -- Original categories
  'practice_standards', 'code_of_conduct', 'pricing',
  'quality_indicators', 'worker_screening', 'complaints_management',
  'incident_management', 'restrictive_practices', 'plan_management',
  'sil', 'community_participation', 'internal_policy', 'other',
  -- New categories for full document library
  'governance', 'risk_management', 'participant_documentation',
  'audit', 'high_intensity', 'behaviour_support', 'emergency_management',
  'human_resources', 'insurance'
));
