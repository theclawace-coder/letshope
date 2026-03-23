-- ============================================
-- HOPE OS - Complete Initial Schema
-- ============================================

-- 1. PROFILES (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('director', 'admin', 'worker', 'plan_manager', 'participant_portal')) DEFAULT 'worker',
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. ORGANISATION
CREATE TABLE organisation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Hope Disability Support',
  abn TEXT DEFAULT '59 677 810 498',
  ndis_registration_number TEXT,
  phone TEXT,
  email TEXT,
  address JSONB,
  registration_groups TEXT[] DEFAULT ARRAY[
    '0104','0106','0107','0108','0111','0114','0115',
    '0116','0117','0120','0121','0125','0126','0127','0136'
  ],
  registration_expiry DATE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PARTICIPANTS
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  ndis_number TEXT,
  status TEXT CHECK (status IN ('referral', 'intake', 'onboarding', 'active', 'on_hold', 'exiting', 'exited')) DEFAULT 'referral',
  phone TEXT,
  email TEXT,
  address JSONB,
  funding_type TEXT CHECK (funding_type IN ('ndia_managed', 'plan_managed', 'self_managed', 'combination')),
  plan_start_date DATE,
  plan_end_date DATE,
  plan_number TEXT,
  support_coordinator_name TEXT,
  support_coordinator_phone TEXT,
  support_coordinator_email TEXT,
  lac_name TEXT,
  lac_contact TEXT,
  services_requested TEXT[] DEFAULT '{}',
  gp_name TEXT,
  gp_phone TEXT,
  gp_address TEXT,
  medical_conditions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  medications JSONB DEFAULT '[]',
  emergency_contacts JSONB DEFAULT '[]',
  has_guardian BOOLEAN DEFAULT false,
  guardian_name TEXT,
  guardian_relationship TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  guardian_authority TEXT,
  communication_needs TEXT,
  cultural_needs TEXT,
  mobility_needs TEXT,
  living_situation TEXT,
  goals JSONB DEFAULT '[]',
  referral_source TEXT,
  referral_date DATE,
  referral_notes TEXT,
  urgency TEXT CHECK (urgency IN ('routine', 'urgent', 'crisis')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_assessment_date DATE,
  risk_review_date DATE,
  budget_core DECIMAL(10,2),
  budget_capacity_building DECIMAL(10,2),
  budget_capital DECIMAL(10,2),
  notes TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_participants_status ON participants(status);
CREATE INDEX idx_participants_ndis_number ON participants(ndis_number);

-- 4. WORKERS
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  address JSONB,
  status TEXT CHECK (status IN ('onboarding', 'active', 'inactive', 'terminated')) DEFAULT 'onboarding',
  employment_type TEXT CHECK (employment_type IN ('contractor', 'employee', 'volunteer')) DEFAULT 'contractor',
  role_title TEXT,
  qualified_registration_groups TEXT[] DEFAULT '{}',
  ndis_screening_status TEXT CHECK (ndis_screening_status IN ('not_started', 'pending', 'cleared', 'expired', 'barred')),
  ndis_screening_number TEXT,
  ndis_screening_date DATE,
  police_check_status TEXT CHECK (police_check_status IN ('not_started', 'pending', 'clear', 'disclosable', 'expired')),
  police_check_date DATE,
  police_check_expiry DATE,
  wwcc_status TEXT CHECK (wwcc_status IN ('not_required', 'not_started', 'pending', 'cleared', 'expired')),
  wwcc_number TEXT,
  wwcc_expiry DATE,
  orientation_completed BOOLEAN DEFAULT false,
  orientation_date DATE,
  code_of_conduct_signed BOOLEAN DEFAULT false,
  code_of_conduct_date DATE,
  induction_completed BOOLEAN DEFAULT false,
  induction_data JSONB DEFAULT '{}',
  ahpra_number TEXT,
  ahpra_expiry DATE,
  ahpra_status TEXT,
  other_qualifications JSONB DEFAULT '[]',
  references_verified BOOLEAN DEFAULT false,
  availability JSONB DEFAULT '{}',
  contract_signed BOOLEAN DEFAULT false,
  contract_date DATE,
  position_description_acknowledged BOOLEAN DEFAULT false,
  identity_points_verified BOOLEAN DEFAULT false,
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. WORKER-PARTICIPANT ASSIGNMENTS
CREATE TABLE worker_participant_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  participant_id UUID NOT NULL REFERENCES participants(id),
  registration_group TEXT NOT NULL,
  assigned_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. WORKFLOWS
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('participant_onboarding', 'worker_onboarding', 'incident_response', 'complaint_resolution', 'plan_review', 'invoice_processing')),
  reference_id UUID,
  current_stage INTEGER DEFAULT 1,
  total_stages INTEGER NOT NULL,
  stage_data JSONB DEFAULT '{}',
  completed_stages INTEGER[] DEFAULT '{}',
  status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  started_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workflows_type ON workflows(type);
CREATE INDEX idx_workflows_reference ON workflows(reference_id);
CREATE INDEX idx_workflows_status ON workflows(status);

-- 7. SERVICE AGREEMENTS
CREATE TABLE service_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  version INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('draft', 'sent', 'signed', 'expired', 'terminated')) DEFAULT 'draft',
  services JSONB NOT NULL DEFAULT '[]',
  start_date DATE,
  end_date DATE,
  participant_signed BOOLEAN DEFAULT false,
  participant_signed_date DATE,
  participant_signature_data TEXT,
  provider_signed BOOLEAN DEFAULT false,
  provider_signed_date DATE,
  file_path TEXT,
  shared_link TEXT,
  shared_link_expiry TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. COMMUNICATIONS
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id),
  worker_id UUID REFERENCES workers(id),
  type TEXT NOT NULL CHECK (type IN ('phone_call', 'email', 'sms', 'meeting', 'letter', 'video_call')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  with_name TEXT,
  with_role TEXT,
  subject TEXT,
  summary TEXT NOT NULL,
  action_required TEXT,
  follow_up_date DATE,
  logged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. DOCUMENTS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  participant_id UUID REFERENCES participants(id),
  worker_id UUID REFERENCES workers(id),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  shared_link TEXT,
  shared_link_expiry TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. BOOKINGS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  worker_id UUID REFERENCES workers(id),
  registration_group TEXT,
  service_description TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  recurrence TEXT CHECK (recurrence IN ('one_off', 'weekly', 'fortnightly')),
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_participant ON bookings(participant_id);

-- 11. INCIDENTS (Phase 5, create table now for schema completeness)
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id),
  worker_id UUID REFERENCES workers(id),
  incident_date DATE NOT NULL,
  incident_time TIME,
  location TEXT,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  is_reportable BOOLEAN DEFAULT false,
  reported_to_commission BOOLEAN DEFAULT false,
  report_deadline TIMESTAMPTZ,
  investigation_notes TEXT,
  corrective_actions JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
  logged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. COMPLAINTS (Phase 5)
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id),
  complainant_name TEXT,
  complainant_relationship TEXT,
  complaint_date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  acknowledge_deadline TIMESTAMPTZ,
  resolution_deadline TIMESTAMPTZ,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_date DATE,
  resolution TEXT,
  resolution_date DATE,
  status TEXT CHECK (status IN ('received', 'acknowledged', 'investigating', 'resolved', 'closed')) DEFAULT 'received',
  logged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_participant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Allow insert via auth trigger" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Organisation
CREATE POLICY "All can read organisation" ON organisation FOR SELECT TO authenticated USING (true);
CREATE POLICY "Director can update organisation" ON organisation FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'director'));
CREATE POLICY "Director can insert organisation" ON organisation FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'director'));

-- Staff CRUD on all operational tables
CREATE POLICY "Staff manage participants" ON participants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
CREATE POLICY "Staff manage workers" ON workers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
CREATE POLICY "Staff manage assignments" ON worker_participant_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
CREATE POLICY "Staff manage workflows" ON workflows FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
CREATE POLICY "Staff manage agreements" ON service_agreements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
CREATE POLICY "Staff manage communications" ON communications FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
CREATE POLICY "Staff manage documents" ON documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
CREATE POLICY "Staff manage bookings" ON bookings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
CREATE POLICY "Staff manage incidents" ON incidents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
CREATE POLICY "Staff manage complaints" ON complaints FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO organisation (name, abn, phone, email, registration_groups) VALUES (
  'Hope Disability Support',
  '59 677 810 498',
  '0405 092 779',
  'info@hopedisability.com.au',
  ARRAY['0104','0106','0107','0108','0111','0114','0115','0116','0117','0120','0121','0125','0126','0127','0136']
);
