import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Ticket, KnowledgeSearchResult } from '../types';
import { knowledgeBaseService } from './knowledgeBaseService';
import { aiService } from './aiService';
import { ticketService } from './ticketService';

interface SolutionSource {
  type: 'knowledge_base' | 'previous_ticket';
  content: string;
  title: string;
  relevance_score: number;
  source_id: string;
  metadata?: any;
}

interface EnhancedSolutionResult {
  solution: string;
  sources: SolutionSource[];
  confidence_score: number;
}

class EnhancedSolutionService {
  /**
   * חיפוש פתרון מועדף על בסיס מאגר הידע וכרטיסים קודמים
   * @param ticketContent תוכן הכרטיס הנוכחי
   * @returns תוצאת פתרון משולב עם מקורות מידע
   */
  async findBestSolution(ticketContent: string): Promise<EnhancedSolutionResult> {
    try {
      // 1. חיפוש במקביל בשני מקורות המידע
      const [knowledgeResults, previousTicketResults] = await Promise.all([
        this.searchKnowledgeBase(ticketContent),
        this.searchPreviousTickets(ticketContent)
      ]);

      // 2. איחוד המקורות למערך אחד
      const allSources = [...knowledgeResults, ...previousTicketResults];
      
      // 3. מיון לפי רלוונטיות
      allSources.sort((a, b) => b.relevance_score - a.relevance_score);
      
      // 4. בחירת המקורות הטובים ביותר (עד 5)
      const bestSources = allSources.slice(0, 5);
      
      // 5. יצירת פתרון משולב באמצעות AI
      const solution = await this.generateCombinedSolution(ticketContent, bestSources);
      
      // 6. חישוב ציון אמינות כולל
      const confidenceScore = this.calculateConfidenceScore(bestSources);
      
      return {
        solution,
        sources: bestSources,
        confidence_score: confidenceScore
      };
    } catch (error) {
      console.error('Error finding best solution:', error);
      return {
        solution: 'לא הצלחנו למצוא פתרון אוטומטי. אנא פנה לנציג שירות.',
        sources: [],
        confidence_score: 0
      };
    }
  }

  /**
   * חיפוש במאגר הידע הקיים
   */
  private async searchKnowledgeBase(query: string): Promise<SolutionSource[]> {
    try {
      // שימוש בשירות מאגר הידע הקיים
      const results = await knowledgeBaseService.searchKnowledge(query, 3);
      
      return results.map(result => ({
        type: 'knowledge_base',
        content: result.chunk.content,
        title: result.kb_item.title,
        relevance_score: result.similarity_score,
        source_id: result.kb_item.id,
        metadata: {
          category: result.kb_item.category,
          tags: result.kb_item.tags
        }
      }));
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  }

  /**
   * חיפוש בכרטיסי תמיכה קודמים שיש להם פתרון
   */
  private async searchPreviousTickets(query: string): Promise<SolutionSource[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return this.getMockPreviousTicketResults();
      }

      // יצירת וקטור אמבדינג לשאילתה
      const queryEmbedding = await aiService.generateEmbedding(query);
      
      // חיפוש כרטיסים דומים עם פתרון בסופרבייס
      // הגדלת סף הדמיון ל-0.8 כדי להבטיח התאמה מרבית
      const { data, error } = await supabase.rpc('search_similar_tickets', {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.8, // עדכון לסף גבוה יותר
        match_count: 5
      });

      if (error) {
        console.error('Error searching previous tickets:', error);
        return [];
      }

      // המרת התוצאות למבנה אחיד
      return (data || []).map(ticket => ({
        type: 'previous_ticket',
        content: ticket.solution || '',
        title: ticket.title,
        relevance_score: ticket.similarity || 0.5,
        source_id: ticket.id,
        metadata: {
          description: ticket.description
        }
      }));
    } catch (error) {
      console.error('Error searching previous tickets:', error);
      return this.getMockPreviousTicketResults();
    }
  }

  /**
   * יצירת פתרון משולב מכל המקורות באמצעות AI
   */
  private async generateCombinedSolution(ticketContent: string, sources: SolutionSource[]): Promise<string> {
    try {
      // בניית הקשר מהמקורות
      const sourceContext = sources.map(source => {
        const sourceType = source.type === 'knowledge_base' ? 'מאגר ידע' : 'כרטיס קודם';
        return `מקור (${sourceType}): ${source.title}\nתוכן: ${source.content}`;
      }).join('\n\n');

      // בניית פרומפט לשאילתת AI
      const prompt = `
        בהתבסס על המידע הבא, צור פתרון מפורט ומועיל בעברית לבעיה של הלקוח.
        הפתרון צריך להיות מובנה, ברור ומעשי.
        
        בעיית הלקוח:
        ${ticketContent}
        
        מידע רלוונטי ממקורות שונים:
        ${sourceContext}
        
        אנא ספק פתרון מפורט, ברור ומעשי בעברית. 
        התמקד בצעדים מעשיים שהלקוח או הנציג יכולים לבצע.
        אם המידע אינו מספיק, ציין זאת והמלץ על צעדים נוספים לאיסוף מידע.
      `;

      // קריאה ל-AI
      const response = await aiService.callOpenAI(prompt);
      return response.trim();
    } catch (error) {
      console.error('Error generating combined solution:', error);
      return 'לא הצלחנו ליצור פתרון אוטומטי. אנא פנה לנציג שירות.';
    }
  }

  /**
   * חישוב ציון אמינות כולל לפתרון
   */
  private calculateConfidenceScore(sources: SolutionSource[]): number {
    if (sources.length === 0) return 0;
    
    // חישוב ממוצע משוקלל של ציוני הרלוונטיות
    const totalScore = sources.reduce((sum, source) => sum + source.relevance_score, 0);
    const avgScore = totalScore / sources.length;
    
    // התאמת הציון לפי מספר המקורות (יותר מקורות = יותר אמינות)
    const sourceCountFactor = Math.min(sources.length / 3, 1); // מקסימום 1 עבור 3 מקורות או יותר
    
    return avgScore * 0.7 + sourceCountFactor * 0.3;
  }

  /**
   * יצירת תוצאות מדגמיות מכרטיסים קודמים
   */
  private getMockPreviousTicketResults(): SolutionSource[] {
    return [
      {
        type: 'previous_ticket',
        content: 'בבעיית התחברות זו, הפתרון היה ניקוי מטמון הדפדפן ומחיקת עוגיות. הלקוח התבקש לבצע את הצעדים הבאים: 1. פתיחת הגדרות הדפדפן 2. מחיקת היסטוריה ועוגיות 3. סגירה ופתיחה מחדש של הדפדפן 4. ניסיון התחברות מחדש.',
        title: 'בעיית התחברות למערכת',
        relevance_score: 0.85,
        source_id: 'mock-ticket-1',
        metadata: {
          created_at: '2024-06-01T10:00:00Z',
          status: 'closed',
          category: 'technical'
        }
      },
      {
        type: 'previous_ticket',
        content: 'הלקוח דיווח על שגיאת תשלום. הבעיה נפתרה על ידי: 1. בדיקת תוקף כרטיס האשראי 2. וידוא שהכתובת לחיוב תואמת את הכתובת הרשומה בחברת האשראי 3. ניסיון תשלום חוזר לאחר 30 דקות.',
        title: 'שגיאה בביצוע תשלום',
        relevance_score: 0.72,
        source_id: 'mock-ticket-2',
        metadata: {
          created_at: '2024-05-15T14:30:00Z',
          status: 'closed',
          category: 'billing'
        }
      }
    ];
  }

  /**
   * שמירת פתרון חדש למאגר הפתרונות
   */
  async saveSolutionForLearning(ticketId: string, solution: string): Promise<void> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.log('Supabase not configured, solution learning skipped');
        return;
      }

      // 1. עדכון הכרטיס עם הפתרון
      await ticketService.updateTicket(ticketId, { solution });
      
      // 2. יצירת אמבדינג לתוכן הכרטיס ולפתרון לשיפור החיפוש העתידי
      const ticket = await ticketService.getTicket(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      
      const ticketContent = `${ticket.title} ${ticket.description}`;
      const embedding = await aiService.generateEmbedding(ticketContent);
      
      // 3. עדכון האמבדינג בטבלת הכרטיסים
      const { error } = await supabase
        .from('tickets')
        .update({
          content_embedding: embedding,
          has_solution: true
        })
        .eq('id', ticketId);

      if (error) {
        throw new Error(`Failed to update ticket embedding: ${error.message}`);
      }
      
      console.log('Solution saved for future learning:', ticketId);
    } catch (error) {
      console.error('Error saving solution for learning:', error);
    }
  }
}

export const enhancedSolutionService = new EnhancedSolutionService();
