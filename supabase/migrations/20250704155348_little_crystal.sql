-- Enable vector extension first
CREATE EXTENSION IF NOT EXISTS vector;

-- Create function for semantic search
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  kb_item_id uuid,
  content text,
  chunk_index int,
  similarity float,
  created_at timestamptz
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
    1 - (kc.embedding <=> query_embedding) as similarity,
    kc.created_at
  FROM knowledge_chunks kc
  JOIN knowledge_base_items kbi ON kc.kb_item_id = kbi.id
  WHERE 
    kbi.is_active = true
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;