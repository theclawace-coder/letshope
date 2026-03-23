-- Phase 6: AI Buddy - NDIS Policy Assistant
-- Migration: 00005_phase6_ai_buddy.sql
-- Enables pgvector for semantic search over NDIS policy documents
-- Adds conversation/message tables for chat history

-- =============================================================
-- 1. ENABLE PGVECTOR EXTENSION
-- =============================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- =============================================================
-- 2. POLICY DOCUMENTS (chunked policy content)
-- =============================================================

CREATE TABLE policy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL, -- e.g. 'NDIS Practice Standards', 'NDIS Act 2013', internal doc name
  category TEXT NOT NULL CHECK (category IN (
    'practice_standards', 'code_of_conduct', 'pricing',
    'quality_indicators', 'worker_screening', 'complaints_management',
    'incident_management', 'restrictive_practices', 'plan_management',
    'sil', 'community_participation', 'internal_policy', 'other'
  )),
  chunk_index INTEGER NOT NULL DEFAULT 0, -- position within the source document
  content TEXT NOT NULL, -- the actual text chunk
  metadata JSONB DEFAULT '{}', -- section heading, page number, etc.
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_policy_docs_category ON policy_documents(category);
CREATE INDEX idx_policy_docs_source ON policy_documents(source);
CREATE INDEX idx_policy_docs_active ON policy_documents(is_active) WHERE is_active = true;

-- =============================================================
-- 3. POLICY EMBEDDINGS (vector storage for semantic search)
-- =============================================================

CREATE TABLE policy_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES policy_documents(id) ON DELETE CASCADE,
  embedding extensions.vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_policy_embeddings_document ON policy_embeddings(document_id);

-- HNSW index for fast approximate nearest neighbour search
CREATE INDEX idx_policy_embeddings_vector ON policy_embeddings
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- =============================================================
-- 4. SEMANTIC SEARCH FUNCTION
-- =============================================================

CREATE OR REPLACE FUNCTION match_policy_documents(
  query_embedding extensions.vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  title TEXT,
  source TEXT,
  category TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    pe.id,
    pd.id AS document_id,
    pd.title,
    pd.source,
    pd.category,
    pd.content,
    pd.metadata,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM policy_embeddings pe
  JOIN policy_documents pd ON pd.id = pe.document_id
  WHERE pd.is_active = true
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- =============================================================
-- 5. AI CONVERSATIONS
-- =============================================================

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated ON ai_conversations(updated_at DESC);

-- =============================================================
-- 6. AI MESSAGES
-- =============================================================

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]', -- array of { document_id, title, source, similarity }
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created ON ai_messages(created_at);

-- =============================================================
-- 7. AUTO-UPDATE CONVERSATION TITLE FROM FIRST MESSAGE
-- =============================================================

CREATE OR REPLACE FUNCTION update_conversation_title()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set title from first user message
  IF NEW.role = 'user' THEN
    UPDATE ai_conversations
    SET title = LEFT(NEW.content, 80),
        updated_at = NOW()
    WHERE id = NEW.conversation_id
      AND title = 'New conversation';
  ELSE
    UPDATE ai_conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ai_message_created
  AFTER INSERT ON ai_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_title();

-- =============================================================
-- 8. ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Policy documents: all authenticated staff can read, director/admin can manage
CREATE POLICY "Staff can read policy documents" ON policy_documents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));

CREATE POLICY "Admin can manage policy documents" ON policy_documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));

-- Policy embeddings: same as documents
CREATE POLICY "Staff can read policy embeddings" ON policy_embeddings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));

CREATE POLICY "Admin can manage policy embeddings" ON policy_embeddings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));

-- Conversations: users own their conversations
CREATE POLICY "Users manage own conversations" ON ai_conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Messages: users can access messages in their conversations
CREATE POLICY "Users access own conversation messages" ON ai_messages
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
  ));

-- =============================================================
-- 9. SEED: SUGGESTED QUESTIONS (stored as org setting)
-- =============================================================

UPDATE organisation SET settings = settings || '{
  "ai_buddy_suggested_questions": [
    "What are the NDIS Practice Standards for incident management?",
    "What are the requirements for restrictive practices under NDIS?",
    "How should we handle a reportable incident?",
    "What are the worker screening requirements in our state?",
    "What does the NDIS Code of Conduct require of workers?",
    "What are the complaints management timeframes under NDIS?",
    "What documentation is required for progress notes?",
    "What are the NDIS pricing rules for cancellations?"
  ]
}'::jsonb;
