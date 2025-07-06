-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge_base_items table
CREATE TABLE IF NOT EXISTS knowledge_base_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT ARRAY[]::text[],
  priority text NOT NULL DEFAULT 'medium',
  source_type text NOT NULL DEFAULT 'document',
  source_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create knowledge_chunks table
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_item_id uuid REFERENCES knowledge_base_items(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  chunk_index integer NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at timestamptz DEFAULT now()
);

-- Create auto_solutions table
CREATE TABLE IF NOT EXISTS auto_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  solution_type text NOT NULL,
  confidence_score float4 NOT NULL,
  solution_content text NOT NULL,
  knowledge_sources jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  is_approved boolean DEFAULT false,
  feedback_score float4
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_category ON knowledge_base_items(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_priority ON knowledge_base_items(priority);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_source_type ON knowledge_base_items(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_is_active ON knowledge_base_items(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_items_tags ON knowledge_base_items USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_kb_item_id ON knowledge_chunks(kb_item_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_chunk_index ON knowledge_chunks(chunk_index);

-- Create vector index for similarity search (only if embedding column has data)
DO $$
BEGIN
  -- Create the vector index for similarity search
  CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding 
  ON knowledge_chunks USING ivfflat (embedding vector_l2_ops) 
  WITH (lists = 100);
EXCEPTION
  WHEN OTHERS THEN
    -- Index creation might fail if no data exists yet, that's okay
    NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_auto_solutions_ticket_id ON auto_solutions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_auto_solutions_solution_type ON auto_solutions(solution_type);
CREATE INDEX IF NOT EXISTS idx_auto_solutions_confidence_score ON auto_solutions(confidence_score);

-- Enable Row Level Security
ALTER TABLE knowledge_base_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_solutions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for knowledge_base_items
CREATE POLICY "Allow all operations on knowledge_base_items"
  ON knowledge_base_items
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for knowledge_chunks
CREATE POLICY "Allow all operations on knowledge_chunks"
  ON knowledge_chunks
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for auto_solutions
CREATE POLICY "Allow all operations on auto_solutions"
  ON auto_solutions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS search_knowledge_chunks(vector, double precision, integer);
DROP FUNCTION IF EXISTS search_knowledge_chunks(vector, float, int);

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  kb_item_id uuid,
  content text,
  chunk_index integer,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.kb_item_id,
    kc.content,
    kc.chunk_index,
    kc.created_at,
    (1 - (kc.embedding <=> query_embedding)) as similarity
  FROM knowledge_chunks kc
  WHERE kc.embedding IS NOT NULL
    AND (1 - (kc.embedding <=> query_embedding)) > match_threshold
  ORDER BY (kc.embedding <=> query_embedding) ASC
  LIMIT match_count;
END;
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for knowledge_base_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_knowledge_base_items_updated_at'
  ) THEN
    CREATE TRIGGER update_knowledge_base_items_updated_at
      BEFORE UPDATE ON knowledge_base_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert some sample data for testing
INSERT INTO knowledge_base_items (title, content, category, tags, priority, source_type) VALUES
  (
    'פתרון בעיות התחברות למערכת',
    'כאשר משתמשים נתקלים בבעיות התחברות למערכת, יש לבצע את השלבים הבאים: 1. ודא שם משתמש וסיסמה נכונים 2. בדוק חיבור לאינטרנט 3. נקה cache של הדפדפן 4. בדוק הגדרות firewall 5. נסה דפדפן אחר 6. אם הבעיה נמשכת, פנה למחלקת IT',
    'technical',
    ARRAY['התחברות', 'אימות', 'טכני', 'דפדפן'],
    'high',
    'manual'
  ),
  (
    'מדיניות החזרים וזיכויים',
    'מדיניות החזרים של החברה: החזרים מתבצעים תוך 7-14 ימי עסקים מיום הבקשה. יש לפנות עם קבלה או מספר הזמנה. זיכויים חלקיים אפשריים במקרים מיוחדים לפי שיקול דעת המנהל. החזרים מעל 1000 ש"ח דורשים אישור מנהל.',
    'billing',
    ARRAY['החזרים', 'זיכויים', 'תשלומים', 'מדיניות'],
    'medium',
    'faq'
  ),
  (
    'הגדרת תכונות חדשות במערכת',
    'מדריך להגדרת תכונות חדשות: 1. היכנס לפאנל ניהול 2. בחר "הגדרות מתקדמות" 3. לחץ על "תכונות חדשות" 4. בחר את התכונות הרצויות 5. שמור את השינויים 6. המתן לעדכון המערכת (עד 5 דקות)',
    'general',
    ARRAY['הגדרות', 'תכונות', 'מדריך', 'ניהול'],
    'low',
    'manual'
  )
ON CONFLICT (id) DO NOTHING;