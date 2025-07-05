import { AIAnalysis, Ticket, Message } from '../types';

class AIService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.baseURL = 'https://api.openai.com/v1';
  }

  async analyzeTicket(ticket: Ticket): Promise<AIAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(ticket);
      const response = await this.callOpenAI(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('AI Analysis failed:', error);
      return this.getFallbackAnalysis(ticket);
    }
  }

  async generateSuggestedReplies(ticket: Ticket, conversation: Message[]): Promise<string[]> {
    try {
      const prompt = this.buildReplyPrompt(ticket, conversation);
      const response = await this.callOpenAI(prompt);
      return this.parseSuggestedReplies(response);
    } catch (error) {
      console.error('Reply generation failed:', error);
      return this.getFallbackReplies(ticket);
    }
  }

  async summarizeTicket(ticket: Ticket, conversation: Message[]): Promise<string> {
    try {
      const prompt = this.buildSummaryPrompt(ticket, conversation);
      const response = await this.callOpenAI(prompt);
      return response.trim();
    } catch (error) {
      console.error('Summarization failed:', error);
      return this.getFallbackSummary(ticket);
    }
  }

  async classifyTicket(content: string): Promise<{ category: string; priority: string; confidence: number }> {
    try {
      const prompt = this.buildClassificationPrompt(content);
      const response = await this.callOpenAI(prompt);
      return this.parseClassificationResponse(response);
    } catch (error) {
      console.error('Classification failed:', error);
      return { category: 'general', priority: 'medium', confidence: 0.5 };
    }
  }

  async analyzeSentiment(content: string): Promise<{ score: number; label: 'positive' | 'neutral' | 'negative'; confidence: number }> {
    try {
      const prompt = this.buildSentimentPrompt(content);
      const response = await this.callOpenAI(prompt);
      return this.parseSentimentResponse(response);
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return { score: 0, label: 'neutral', confidence: 0.5 };
    }
  }

  async assessRisk(ticket: Ticket, conversation: Message[]): Promise<{ level: 'low' | 'medium' | 'high'; factors: string[] }> {
    try {
      const prompt = this.buildRiskPrompt(ticket, conversation);
      const response = await this.callOpenAI(prompt);
      return this.parseRiskResponse(response);
    } catch (error) {
      console.error('Risk assessment failed:', error);
      return { level: 'low', factors: [] };
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private buildAnalysisPrompt(ticket: Ticket): string {
    return `
      נתח את כרטיס התמיכה הזה וספק תגובה בפורמט JSON עם המבנה הבא:
      {
        "classification": {
          "category": "technical|billing|general|feature_request",
          "priority": "low|medium|high|urgent",
          "confidence": 0.0-1.0
        },
        "sentiment": {
          "score": -1.0 to 1.0,
          "label": "positive|neutral|negative",
          "confidence": 0.0-1.0
        },
        "risk_assessment": {
          "level": "low|medium|high",
          "factors": ["רשימה", "של", "גורמי", "סיכון"]
        },
        "summary": "סיכום קצר של הכרטיס בעברית",
        "suggested_tags": ["תגית1", "תגית2", "תגית3"],
        "suggested_replies": ["תגובה1 בעברית", "תגובה2 בעברית", "תגובה3 בעברית"]
      }

      כותרת הכרטיס: ${ticket.title}
      תיאור הכרטיס: ${ticket.description}
      לקוח: ${ticket.customer_name} (${ticket.customer_email})
      
      אנא ספק תגובות מוצעות בעברית שהן מקצועיות ומועילות.
    `;
  }

  private buildReplyPrompt(ticket: Ticket, conversation: Message[]): string {
    const conversationText = conversation.map(msg => 
      `${msg.sender}: ${msg.content}`
    ).join('\n');

    return `
      בהתבסס על שיחת התמיכה הזו, צור 3 הצעות תגובה מקצועיות ומועילות בעברית.
      החזר רק את התגובות כמערך JSON של מחרוזות.

      כרטיס: ${ticket.title}
      תיאור: ${ticket.description}
      עדיפות: ${ticket.priority}
      קטגוריה: ${ticket.category}

      שיחה:
      ${conversationText}

      צור תגובות מתאימות ומקצועיות בעברית שמתייחסות לדאגות הלקוח.
    `;
  }

  private buildSummaryPrompt(ticket: Ticket, conversation: Message[]): string {
    const conversationText = conversation.map(msg => 
      `${msg.sender}: ${msg.content}`
    ).join('\n');

    return `
      סכם את כרטיס התמיכה הזה ב-2-3 משפטים בעברית, תוך התמקדות בבעיה העיקרית והסטטוס הנוכחי.

      כרטיס: ${ticket.title}
      תיאור: ${ticket.description}
      סטטוס: ${ticket.status}
      עדיפות: ${ticket.priority}

      שיחה:
      ${conversationText}
    `;
  }

  private buildClassificationPrompt(content: string): string {
    return `
      סווג את בקשת התמיכה הזו. החזר JSON עם:
      {
        "category": "technical|billing|general|feature_request",
        "priority": "low|medium|high|urgent",
        "confidence": 0.0-1.0
      }

      תוכן: ${content}
    `;
  }

  private buildSentimentPrompt(content: string): string {
    return `
      נתח את הסנטימנט של ההודעה הזו. החזר JSON עם:
      {
        "score": -1.0 to 1.0 (שלילי לחיובי),
        "label": "positive|neutral|negative",
        "confidence": 0.0-1.0
      }

      תוכן: ${content}
    `;
  }

  private buildRiskPrompt(ticket: Ticket, conversation: Message[]): string {
    const conversationText = conversation.map(msg => 
      `${msg.sender}: ${msg.content}`
    ).join('\n');

    return `
      העריך את רמת הסיכון של כרטיס התמיכה הזה. החזר JSON עם:
      {
        "level": "low|medium|high",
        "factors": ["רשימה", "של", "גורמי", "סיכון"]
      }

      קח בחשבון גורמים כמו תסכול לקוח, פוטנציאל להסלמה, השפעה עסקית וכו'.

      כרטיס: ${ticket.title}
      עדיפות: ${ticket.priority}
      סטטוס: ${ticket.status}

      שיחה:
      ${conversationText}
    `;
  }

  private parseAnalysisResponse(response: string): AIAnalysis {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI analysis response:', error);
      return {
        classification: { category: 'general', priority: 'medium', confidence: 0.5 },
        sentiment: { score: 0, label: 'neutral', confidence: 0.5 },
        risk_assessment: { level: 'low', factors: [] },
        summary: 'לא ניתן ליצור סיכום',
        suggested_tags: [],
        suggested_replies: []
      };
    }
  }

  private parseSuggestedReplies(response: string): string[] {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse suggested replies:', error);
      return [];
    }
  }

  private parseClassificationResponse(response: string): { category: string; priority: string; confidence: number } {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse classification response:', error);
      return { category: 'general', priority: 'medium', confidence: 0.5 };
    }
  }

  private parseSentimentResponse(response: string): { score: number; label: 'positive' | 'neutral' | 'negative'; confidence: number } {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse sentiment response:', error);
      return { score: 0, label: 'neutral', confidence: 0.5 };
    }
  }

  private parseRiskResponse(response: string): { level: 'low' | 'medium' | 'high'; factors: string[] } {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse risk response:', error);
      return { level: 'low', factors: [] };
    }
  }
  private getFallbackStructuredSolution(ticketContent: string): string {
    return `
      <h4>פתרון מוצע</h4>
      <p>מצטערים, לא הצלחנו ליצור פתרון אוטומטי מפורט מהמידע הקיים במאגר הידע.</p>
      
      <h4>צעדים מומלצים:</h4>
      <ol>
        <li><strong>בדיקה ראשונית:</strong> ודא שהבעיה עדיין קיימת</li>
        <li><strong>איסוף מידע:</strong> תעד את השגיאות או ההתנהגות הבלתי צפויה</li>
        <li><strong>פתרונות בסיסיים:</strong> נסה לבצע restart או refresh</li>
        <li><strong>הסלמה:</strong> פנה לנציג אנושי לקבלת סיוע מותאם אישית</li>
      </ol>
      
      <p><strong>הערה:</strong> נציג התמיכה שלנו יוכל לספק פתרון מדויק יותר על בסיס הפרטים הספציפיים של המקרה.</p>
    `;
  }

  private getFallbackAnalysis(ticket: Ticket): AIAnalysis {
    return {
      classification: { category: 'general', priority: 'medium', confidence: 0.5 },
      sentiment: { score: 0, label: 'neutral', confidence: 0.5 },
      risk_assessment: { level: 'low', factors: [] },
      summary: `כרטיס תמיכה: ${ticket.title}`,
      suggested_tags: ['תמיכה'],
      suggested_replies: [
        'תודה על פנייתך. אנו בוחנים את הבקשה שלך ונחזור אליך בהקדם האפשרי.',
        'אנו מעריכים את הסבלנות שלך בזמן שאנו חוקרים את הבעיה הזו.',
        'אני מעביר את זה לצוות המתאים לקבלת סיוע נוסף.'
      ]
    };
  }

  private getFallbackReplies(ticket: Ticket): string[] {
    return [
      'תודה על פנייתך. אנו בוחנים את הבקשה שלך ונחזור אליך בהקדם האפשרי.',
      'אנו מעריכים את הסבלנות שלך בזמן שאנו חוקרים את הבעיה הזו.',
      'אני מעביר את זה לצוות המתאים לקבלת סיוע נוסף.',
      'האם ניסית לבצע את הפעולות הבאות? זה עשוי לפתור את הבעיה.',
      'אני אשמח לעזור לך עם הבעיה הזו. בואו ננסה כמה פתרונות.'
    ];
  }

  private getFallbackSummary(ticket: Ticket): string {
    return `כרטיס תמיכה: ${ticket.title}. סטטוס: ${ticket.status}. עדיפות: ${ticket.priority}.`;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.apiKey) {
        // Return a mock embedding vector
        return Array.from({ length: 1536 }, () => Math.random() - 0.5);
      }

      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI Embedding API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0]?.embedding || [];
    } catch (error) {
      console.error('Embedding generation failed:', error);
      // Return a mock embedding vector as fallback
      return Array.from({ length: 1536 }, () => Math.random() - 0.5);
    }
  }

  async generateStructuredSolutionFromKnowledge(ticketContent: string, knowledgeResults: any[]): Promise<string> {
    try {
      const knowledgeContext = knowledgeResults
        .map(result => `מקור: ${result.kb_item.title}\nתוכן: ${result.chunk.content}`)
        .join('\n\n');

      const prompt = `
        בהתבסס על המידע הבא ממאגר הידע, צור פתרון מובנה ומפורט בעברית לבעיה של הלקוח.
        הפתרון צריך להיות בפורמט HTML פשוט עם כותרות, רשימות ושלבים ברורים.
        
        בעיית הלקוח:
        ${ticketContent}
        
        מידע רלוונטי ממאגר הידע:
        ${knowledgeContext}
        
        אנא ספק פתרון מובנה בפורמט הבא:
        - השתמש ב-<h4> לכותרות
        - השתמש ב-<ol> או <ul> לרשימות
        - השתמש ב-<p> לפסקאות
        - השתמש ב-<strong> להדגשות חשובות
        - ודא שהפתרון ברור, מעשי ומסודר
        
        אם המידע אינו מספיק, ציין זאת והמלץ על צעדים נוספים.
      `;

      const response = await this.callOpenAI(prompt);
      return response.trim();
    } catch (error) {
      console.error('Structured solution generation failed:', error);
      return this.getFallbackStructuredSolution(ticketContent);
    }
  }

  async generateSolutionFromKnowledge(ticketContent: string, knowledgeResults: any[]): Promise<string> {
    try {
      const knowledgeContext = knowledgeResults
        .map(result => `מקור: ${result.kb_item.title}\nתוכן: ${result.chunk.content}`)
        .join('\n\n');

      const prompt = `
        בהתבסס על המידע הבא ממאגר הידע, צור פתרון מפורט ומועיל בעברית לבעיה של הלקוח.
        
        בעיית הלקוח:
        ${ticketContent}
        
        מידע רלוונטי ממאגר הידע:
        ${knowledgeContext}
        
        אנא ספק פתרון מפורט, ברור ומעשי בעברית. אם המידע אינו מספיק, ציין זאת והמלץ על צעדים נוספים.
      `;

      const response = await this.callOpenAI(prompt);
      return response.trim();
    } catch (error) {
      console.error('Solution generation failed:', error);
      return 'מצטערים, לא הצלחנו ליצור פתרון אוטומטי. אנא פנה לנציג אנושי לקבלת סיוע מותאם אישית.';
    }
  }
}

export const aiService = new AIService();