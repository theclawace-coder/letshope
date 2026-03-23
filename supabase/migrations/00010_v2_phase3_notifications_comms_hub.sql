-- v2 Phase 3: Notifications & Communication Hub
-- In-app notifications, notification preferences, and internal messaging

-- ============================================================
-- NOTIFICATION TYPES
-- ============================================================

CREATE TYPE notification_category AS ENUM (
  'incident',
  'complaint',
  'concern',
  'booking',
  'invoice',
  'compliance',
  'goal',
  'portal',
  'message',
  'system'
);

CREATE TYPE notification_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- ============================================================
-- IN-APP NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category notification_category NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'normal',
  title TEXT NOT NULL,
  body TEXT,
  -- Link to the entity that triggered the notification
  entity_type TEXT,  -- 'incident', 'complaint', 'booking', etc.
  entity_id UUID,
  -- Navigation path for click-through
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- NOTIFICATION PREFERENCES (per user, per category)
-- ============================================================

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category notification_category NOT NULL,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  min_priority notification_priority NOT NULL DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category)
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- ============================================================
-- INTERNAL MESSAGING (staff-to-staff threads)
-- ============================================================

CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  -- Optional link to a participant, incident, etc.
  entity_type TEXT,
  entity_id UUID,
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE message_thread_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  -- Optional file attachment
  attachment_url TEXT,
  attachment_name TEXT,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for messaging
CREATE INDEX idx_message_threads_created_by ON message_threads(created_by);
CREATE INDEX idx_message_threads_last_msg ON message_threads(last_message_at DESC);
CREATE INDEX idx_thread_participants_user ON message_thread_participants(user_id);
CREATE INDEX idx_thread_participants_thread ON message_thread_participants(thread_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-set read_at when notification is marked read
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_read_at();

-- Update message_threads.last_message_at on new message
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET last_message_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thread_last_message_sync
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- Update notification_preferences.updated_at
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_updated_at();

-- ============================================================
-- VIEWS
-- ============================================================

-- Unread notification counts per user per category
CREATE OR REPLACE VIEW notification_counts AS
SELECT
  user_id,
  category,
  COUNT(*) FILTER (WHERE is_read = FALSE) AS unread_count,
  COUNT(*) AS total_count
FROM notifications
WHERE is_archived = FALSE
GROUP BY user_id, category;

-- Unread message counts per thread per user
CREATE OR REPLACE VIEW unread_message_counts AS
SELECT
  mtp.user_id,
  mtp.thread_id,
  mt.subject,
  COUNT(m.id) FILTER (WHERE m.created_at > COALESCE(mtp.last_read_at, '1970-01-01'::timestamptz)) AS unread_count
FROM message_thread_participants mtp
JOIN message_threads mt ON mt.id = mtp.thread_id
LEFT JOIN messages m ON m.thread_id = mtp.thread_id AND m.sender_id != mtp.user_id
WHERE mt.is_archived = FALSE AND mtp.is_muted = FALSE
GROUP BY mtp.user_id, mtp.thread_id, mt.subject;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Notifications: users can only see their own
DO $$ BEGIN
  CREATE POLICY "Users can read own notifications"
    ON notifications FOR SELECT TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- System can insert notifications for any user
DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert notifications"
    ON notifications FOR INSERT TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification preferences: users manage their own
DO $$ BEGIN
  CREATE POLICY "Users can read own notification prefs"
    ON notification_preferences FOR SELECT TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own notification prefs"
    ON notification_preferences FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own notification prefs"
    ON notification_preferences FOR UPDATE TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Message threads: visible to participants
DO $$ BEGIN
  CREATE POLICY "Thread participants can read threads"
    ON message_threads FOR SELECT TO authenticated
    USING (
      id IN (SELECT thread_id FROM message_thread_participants WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create threads"
    ON message_threads FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Thread participants
DO $$ BEGIN
  CREATE POLICY "Thread members can read participants"
    ON message_thread_participants FOR SELECT TO authenticated
    USING (
      thread_id IN (SELECT thread_id FROM message_thread_participants WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can add thread participants"
    ON message_thread_participants FOR INSERT TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own thread participation"
    ON message_thread_participants FOR UPDATE TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Messages: visible to thread participants
DO $$ BEGIN
  CREATE POLICY "Thread participants can read messages"
    ON messages FOR SELECT TO authenticated
    USING (
      thread_id IN (SELECT thread_id FROM message_thread_participants WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Thread participants can insert messages"
    ON messages FOR INSERT TO authenticated
    WITH CHECK (
      sender_id = auth.uid()
      AND thread_id IN (SELECT thread_id FROM message_thread_participants WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Senders can update own messages"
    ON messages FOR UPDATE TO authenticated
    USING (sender_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
