-- v2 Phase 1: Goal Tracking & Outcome Measurement
-- Proper goals table replacing the JSON goals field on participants

-- NDIS outcome domains
CREATE TYPE goal_domain AS ENUM (
  'daily_living',
  'community_participation',
  'employment',
  'health_wellbeing',
  'relationships',
  'lifelong_learning',
  'choice_control',
  'home'
);

CREATE TYPE goal_timeframe AS ENUM (
  'short_term',
  'medium_term',
  'long_term'
);

CREATE TYPE goal_status AS ENUM (
  'not_started',
  'in_progress',
  'achieved',
  'on_hold',
  'discontinued'
);

-- Main goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  domain goal_domain NOT NULL,
  timeframe goal_timeframe NOT NULL DEFAULT 'short_term',
  status goal_status NOT NULL DEFAULT 'not_started',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  start_date DATE,
  target_date DATE,
  review_date DATE,
  baseline_measure TEXT,
  target_measure TEXT,
  current_progress INTEGER NOT NULL DEFAULT 0 CHECK (current_progress >= 0 AND current_progress <= 100),
  linked_registration_groups TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goal progress entries for tracking over time
CREATE TABLE goal_progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_percentage INTEGER NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  evidence TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_goals_participant ON goals(participant_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_domain ON goals(domain);
CREATE INDEX idx_goal_progress_goal ON goal_progress_entries(goal_id);
CREATE INDEX idx_goal_progress_date ON goal_progress_entries(progress_date);

-- Update trigger for goals.updated_at
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();

-- Auto-update goal current_progress when a progress entry is inserted
CREATE OR REPLACE FUNCTION sync_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE goals
  SET current_progress = NEW.progress_percentage
  WHERE id = NEW.goal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goal_progress_sync
  AFTER INSERT ON goal_progress_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_goal_progress();

-- RLS policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read goals"
    ON goals FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert goals"
    ON goals FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update goals"
    ON goals FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read goal progress"
    ON goal_progress_entries FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert goal progress"
    ON goal_progress_entries FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
