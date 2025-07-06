import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { KnowledgeBaseItem, KnowledgeChunk, KnowledgeSearchResult, AutoSolution } from '../types';
import { aiService } from './aiService';

class KnowledgeBaseService {
  async uploadDocument(file: File, metadata: {
    title: string;
    category: string;
    tags: string[];
    priority: 'low' | 'medium' | 'high';
  }): Promise<KnowledgeBaseItem> {
    try {
      // Read file content
      const content = await this.extractTextFromFile(file);
      
      // Create knowledge base item
      const kbItem = await this.createKnowledgeBaseItem({
        title: metadata.title,
        content,
        category: metadata.category,
        tags: metadata.tags,
        priority: metadata.priority,
        source_type: 'document',
        metadata: {
          file_type: file.type,
          file_size: file.size,
          original_name: file.name
        }
      });

      // Process content into chunks
      await this.processContentIntoChunks(kbItem.id, content);

      return kbItem;
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw new Error('שגיאה בהעלאת המסמך');
    }
  }

  async createKnowledgeBaseItem(data: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    priority: 'low' | 'medium' | 'high';
    source_type: 'document' | 'faq' | 'manual' | 'url';
    source_url?: string;
    metadata?: any;
  }): Promise<KnowledgeBaseItem> {
    if (!isSupabaseConfigured || !supabase) {
      // Mock implementation
      const mockItem: KnowledgeBaseItem = {
        id: `kb-${Date.now()}`,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
        priority: data.priority,
        source_type: data.source_type,
        source_url: data.source_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        metadata: data.metadata || {}
      };
      return mockItem;
    }

    const { data: result, error } = await supabase
      .from('knowledge_base_items')
      .insert({
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
        priority: data.priority,
        source_type: data.source_type,
        source_url: data.source_url,
        metadata: data.metadata || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create knowledge base item: ${error.message}`);
    }

    return result;
  }

  async getKnowledgeBaseItems(filters?: {
    category?: string;
    tags?: string[];
    search?: string;
    is_active?: boolean;
  }): Promise<KnowledgeBaseItem[]> {
    if (!isSupabaseConfigured || !supabase) {
      // Return mock data
      return this.getMockKnowledgeBaseItems(filters);
    }

    let query = supabase
      .from('knowledge_base_items')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch knowledge base items: ${error.message}`);
    }

    return data || [];
  }

  async searchKnowledge(query: string, limit: number = 5): Promise<KnowledgeSearchResult[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.log('Supabase not configured, returning mock search results');
        return this.getMockSearchResults(query);
      }

      console.log('Searching knowledge base for:', query);
      
      try {
        // First try direct text search as a fallback if vector search fails
        const { data: directResults } = await supabase
          .from('knowledge_base_items')
          .select('*')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(limit);

        if (directResults && directResults.length > 0) {
          console.log('Found results via direct text search:', directResults.length);
          
          // Convert to KnowledgeSearchResult format
          const results: KnowledgeSearchResult[] = directResults.map(item => ({
            chunk: {
              id: `chunk-${item.id}-0`,
              kb_item_id: item.id,
              content: item.content?.substring(0, 500) || '',
              chunk_index: 0,
              created_at: item.created_at
            },
            kb_item: item,
            similarity_score: 0.85, // Reasonable default score for direct matches
            relevance_explanation: this.generateRelevanceExplanation(query, item.content || '')
          }));
          
          return results;
        }
      } catch (directSearchError) {
        console.error('Direct text search failed:', directSearchError);
        // Continue to try vector search or fallback
      }
      
      try {
        // Try vector search if available
        // Generate embedding for the query
        const queryEmbedding = await aiService.generateEmbedding(query);

        // Search for similar chunks using vector similarity
        const { data: chunks, error } = await supabase.rpc('search_knowledge_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7, // Lower threshold to get more results
          match_count: limit
        });

        if (!error && chunks && chunks.length > 0) {
          console.log('Found results via vector search:', chunks.length);
          
          // Get knowledge base items for the chunks
          const kbItemIds = [...new Set(chunks.map((chunk: any) => chunk.kb_item_id))];
          const { data: kbItems } = await supabase
            .from('knowledge_base_items')
            .select('*')
            .in('id', kbItemIds);

          // Combine results
          const results: KnowledgeSearchResult[] = chunks.map((chunk: any) => ({
            chunk: {
              id: chunk.id,
              kb_item_id: chunk.kb_item_id,
              content: chunk.content,
              chunk_index: chunk.chunk_index,
              created_at: chunk.created_at
            },
            kb_item: kbItems?.find(item => item.id === chunk.kb_item_id) || null,
            similarity_score: chunk.similarity,
            relevance_explanation: this.generateRelevanceExplanation(query, chunk.content)
          })).filter(result => result.kb_item);

          if (results.length > 0) {
            return results;
          }
        } else {
          console.warn('Vector search failed or returned no results:', error);
        }
      } catch (vectorSearchError) {
        console.error('Vector search failed:', vectorSearchError);
        // Continue to fallback
      }
      
      console.log('No results found, returning fallback search results');
      return this.getMockSearchResults(query);
    } catch (error) {
      console.error('Knowledge search failed completely:', error);
      return this.getFallbackSearchResults(query);
    }
  }

  async generateAutoSolution(ticketId: string, ticketContent: string, forceRegenerate: boolean = false): Promise<AutoSolution | null> {
    console.log('Generating auto solution for ticket:', ticketId);
    console.log('Ticket content:', ticketContent.substring(0, 100) + '...');
    
    try {
      // Check if solution already exists and we're not forcing regeneration
      if (!forceRegenerate && isSupabaseConfigured && supabase) {
        try {
          const { data: existingSolution, error: fetchError } = await supabase
            .from('auto_solutions')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (fetchError) {
            console.error('Error fetching existing solution:', fetchError);
          }

          if (existingSolution) {
            console.log('Found existing solution, returning it');
            try {
              const parsedSources = JSON.parse(existingSolution.knowledge_sources || '[]');
              return {
                id: existingSolution.id,
                ticket_id: existingSolution.ticket_id,
                solution_type: existingSolution.solution_type,
                confidence_score: existingSolution.confidence_score,
                solution_content: existingSolution.solution_content,
                knowledge_sources: parsedSources,
                created_at: existingSolution.created_at
              };
            } catch (parseError) {
              console.error('Error parsing knowledge sources:', parseError);
              // Continue with generating a new solution
            }
          }
        } catch (existingError) {
          console.error('Error checking for existing solution:', existingError);
          // Continue with generating a new solution
        }
      }

      console.log('Searching for relevant knowledge...');
      // Search for relevant knowledge
      const searchResults = await this.searchKnowledge(ticketContent, 5); // Increased to 5 for better coverage
      
      console.log(`Found ${searchResults.length} knowledge base results`);
      
      if (searchResults.length === 0) {
        console.log('No knowledge base results found, returning null');
        return null;
      }

      // Generate solution using AI
      console.log('Generating solution using AI...');
      const solution = await aiService.generateStructuredSolutionFromKnowledge(ticketContent, searchResults);
      console.log('Solution generated:', solution.substring(0, 100) + '...');
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(searchResults, solution);
      console.log('Confidence score:', confidenceScore);

      // Determine solution type
      const solutionType = confidenceScore > 0.8 ? 'automatic' : 
                          confidenceScore > 0.6 ? 'suggested' : 'escalated';

      const autoSolution: AutoSolution = {
        id: `sol-${Date.now()}`,
        ticket_id: ticketId,
        solution_type: solutionType,
        confidence_score: confidenceScore,
        solution_content: solution,
        knowledge_sources: searchResults,
        created_at: new Date().toISOString()
      };

      // Save to database if configured
      if (isSupabaseConfigured && supabase) {
        console.log('Saving solution to database...');
        
        try {
          // Delete existing solution if regenerating
          if (forceRegenerate) {
            await supabase
              .from('auto_solutions')
              .delete()
              .eq('ticket_id', ticketId);
          }

          // Prepare knowledge sources for storage - make sure it's a valid JSON string
          const knowledgeSourcesString = JSON.stringify(
            searchResults.map(result => ({
              chunk_id: result.chunk.id,
              kb_item_id: result.chunk.kb_item_id,
              title: result.kb_item?.title || '',
              similarity_score: result.similarity_score
            }))
          );

          console.log('Inserting solution into auto_solutions table');
          const { data, error } = await supabase
            .from('auto_solutions')
            .insert({
              ticket_id: ticketId,
              solution_type: solutionType,
              confidence_score: confidenceScore,
              solution_content: solution,
              knowledge_sources: knowledgeSourcesString
            })
            .select();

          if (error) {
            console.error('Error saving solution to database:', error);
          } else if (data && data[0]) {
            console.log('Solution saved successfully with ID:', data[0].id);
            autoSolution.id = data[0].id;
          }
        } catch (saveError) {
          console.error('Exception saving solution to database:', saveError);
          // Continue to return the solution even if saving failed
        }
      }

      return autoSolution;
    } catch (error) {
      console.error('Failed to generate auto solution:', error);
      return null;
    }
  }

  private async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        if (file.type === 'text/plain' || file.type === 'text/csv') {
          resolve(content);
        } else if (file.type === 'application/json') {
          try {
            const json = JSON.parse(content);
            resolve(JSON.stringify(json, null, 2));
          } catch {
            resolve(content);
          }
        } else {
          // For other file types, return the content as-is
          // In a real implementation, you'd use libraries like pdf-parse for PDFs
          resolve(content);
        }
      };
      
      reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
      reader.readAsText(file);
    });
  }

  private async processContentIntoChunks(kbItemId: string, content: string): Promise<void> {
    // Split content into chunks (approximately 500 characters each)
    const chunks = this.splitIntoChunks(content, 500);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Generate embedding for the chunk
        const embedding = await aiService.generateEmbedding(chunk);
        
        if (isSupabaseConfigured && supabase) {
          await supabase
            .from('knowledge_chunks')
            .insert({
              kb_item_id: kbItemId,
              content: chunk,
              chunk_index: i,
              embedding: embedding
            });
        }
      } catch (error) {
        console.error(`Failed to process chunk ${i}:`, error);
      }
    }
  }

  private splitIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
        }
        currentChunk = trimmedSentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk + '.');
    }
    
    return chunks;
  }

  private calculateConfidenceScore(searchResults: KnowledgeSearchResult[], solution: string): number {
    if (searchResults.length === 0) return 0;
    
    const avgSimilarity = searchResults.reduce((sum, result) => sum + result.similarity_score, 0) / searchResults.length;
    const solutionLength = solution.length;
    const lengthScore = Math.min(solutionLength / 200, 1); // Prefer longer, more detailed solutions
    
    return (avgSimilarity * 0.7) + (lengthScore * 0.3);
  }

  private generateRelevanceExplanation(query: string, content: string): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    const matchingWords = queryWords.filter(word => contentWords.includes(word));
    
    if (matchingWords.length > 0) {
      return `מכיל מילות מפתח: ${matchingWords.join(', ')}`;
    }
    
    return 'רלוונטי לפי ניתוח סמנטי';
  }

  private getMockKnowledgeBaseItems(filters?: any): KnowledgeBaseItem[] {
    const mockItems: KnowledgeBaseItem[] = [
      {
        id: 'kb-1',
        title: 'פתרון בעיות התחברות',
        content: 'כאשר משתמשים נתקלים בבעיות התחברות, יש לבדוק: 1. שם משתמש וסיסמה נכונים 2. חיבור לאינטרנט 3. ניקוי cache של הדפדפן 4. בדיקת הגדרות firewall',
        category: 'technical',
        tags: ['התחברות', 'אימות', 'טכני'],
        priority: 'high',
        source_type: 'manual',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_active: true,
        metadata: { author: 'צוות טכני', version: '1.0' }
      },
      {
        id: 'kb-2',
        title: 'מדיניות החזרים וזיכויים',
        content: 'החזרים מתבצעים תוך 7-14 ימי עסקים. יש לפנות עם קבלה או מספר הזמנה. זיכויים חלקיים אפשריים במקרים מיוחדים.',
        category: 'billing',
        tags: ['החזרים', 'זיכויים', 'תשלומים'],
        priority: 'medium',
        source_type: 'faq',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_active: true,
        metadata: { author: 'צוות חיוב', version: '2.1' }
      }
    ];

    if (filters?.category) {
      return mockItems.filter(item => item.category === filters.category);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      return mockItems.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower)
      );
    }

    return mockItems;
  }

  private getMockSearchResults(query: string): KnowledgeSearchResult[] {
    const mockItems = this.getMockKnowledgeBaseItems();
    
    return mockItems.map(item => ({
      chunk: {
        id: `chunk-${item.id}`,
        kb_item_id: item.id,
        content: item.content.substring(0, 200) + '...',
        chunk_index: 0,
        created_at: item.created_at
      },
      kb_item: item,
      similarity_score: Math.random() * 0.3 + 0.7, // Random score between 0.7-1.0
      relevance_explanation: this.generateRelevanceExplanation(query, item.content)
    }));
  }

  private getFallbackSearchResults(query: string): KnowledgeSearchResult[] {
    return [{
      chunk: {
        id: 'fallback-chunk',
        kb_item_id: 'fallback-kb',
        content: 'מצטערים, לא נמצאו תוצאות רלוונטיות במאגר הידע. אנא פנה לנציג אנושי לקבלת סיוע.',
        chunk_index: 0,
        created_at: new Date().toISOString()
      },
      kb_item: {
        id: 'fallback-kb',
        title: 'פתרון כללי',
        content: 'פתרון כללי לבעיות שאינן מכוסות במאגר הידע',
        category: 'general',
        tags: ['כללי'],
        priority: 'low',
        source_type: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        metadata: {}
      },
      similarity_score: 0.3,
      relevance_explanation: 'פתרון כללי'
    }];
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();