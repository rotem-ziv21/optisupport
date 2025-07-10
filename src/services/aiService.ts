import { AIAnalysis, Ticket, Message } from '../types';
import OpenAI from 'openai';

class AIService {
  private apiKey: string;
  private openai: OpenAI | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    console.log('AIService initialized, API key exists:', !!this.apiKey);
    
    if (this.apiKey) {
      try {
        this.openai = new OpenAI({
          apiKey: this.apiKey,
          dangerouslyAllowBrowser: true, // אפשר שימוש בדפדפן למרות הסיכונים
        });
        console.log('OpenAI client initialized successfully');
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
        this.openai = null;
      }
    } else {
      console.warn('No OpenAI API key provided, AI features will be limited');
    }
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
    console.log('Starting sentiment analysis for content:', content.substring(0, 50) + '...');
    
    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      console.warn('Invalid content for sentiment analysis, using neutral fallback');
      return { score: 0, label: 'neutral', confidence: 0.5 };
    }
    
    try {
      if (!this.openai) {
        console.warn('OpenAI client not initialized, using fallback sentiment');
        return { score: 0, label: 'neutral', confidence: 0.5 };
      }
      
      const prompt = this.buildSentimentPrompt(content.trim());
      console.log('Sentiment analysis prompt built, calling OpenAI');
      
      const response = await this.callOpenAI(prompt);
      console.log('Sentiment analysis response received:', response.substring(0, 200) + '...');
      
      if (!response || response.trim().length === 0) {
        console.warn('Empty response from OpenAI, using fallback sentiment');
        return { score: 0, label: 'neutral', confidence: 0.5 };
      }
      
      const result = this.parseSentimentResponse(response);
      console.log('Sentiment analysis result:', JSON.stringify(result));
      
      // Final validation to ensure we return a valid result
      if (!result || typeof result.score !== 'number' || !result.label || typeof result.confidence !== 'number') {
        console.warn('Invalid sentiment analysis result, using fallback');
        return { score: 0, label: 'neutral', confidence: 0.5 };
      }
      
      return result;
    } catch (error) {
      console.error('Sentiment analysis failed with error:', error);
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
    console.log('Calling OpenAI with prompt length:', prompt.length);
    
    if (!this.openai) {
      console.error('OpenAI client not initialized, cannot make API call');
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log('Making OpenAI API request...');
      const chatResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.3,
      });

      console.log('OpenAI API request successful');
      return chatResponse.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('OpenAI API error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
      });
      throw new Error(`OpenAI API error: ${error?.message || 'Unknown error'}`);
    }
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
      Analyze the sentiment of the following message and return ONLY a valid JSON object in this exact format:
      {
        "score": -1.0,
        "label": "negative",
        "confidence": 0.95
      }

      Rules:
      - score: Must be a number between -1.0 (very negative) and 1.0 (very positive)
      - label: Must be exactly one of: "positive", "neutral", "negative"
      - confidence: Must be a number between 0.0 and 1.0
      - Return ONLY the JSON object, no additional text or explanation

      Content to analyze: ${content}
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
      // נקה תגי markdown מסביב ל-JSON
      const cleanedResponse = this.cleanMarkdownJSON(response);
      console.log('Cleaned analysis response:', cleanedResponse.substring(0, 100) + '...');
      
      const analysisData = JSON.parse(cleanedResponse);
      return {
        classification: analysisData.classification || { category: 'general', priority: 'medium', confidence: 0.5 },
        sentiment: analysisData.sentiment || { score: 0, label: 'neutral', confidence: 0.5 },
        suggested_tags: analysisData.suggested_tags || [],
        suggested_replies: analysisData.suggested_replies || [],
        summary: analysisData.summary || ''
      };
    } catch (error) {
      console.error('Failed to parse AI analysis response:', error);
      return this.getFallbackAnalysis({ title: '', description: '' } as Ticket);
    }
  }

  private parseSuggestedReplies(response: string): string[] {
    console.log('Raw suggested replies response:', response);
    
    try {
      // נסה לנקות את התשובה אם היא מגיעה בפורמט Markdown
      let result: string[] = [];
      
      try {
        // נקה תגי markdown מסביב ל-JSON
        const cleanedResponse = this.cleanMarkdownJSON(response);
        console.log('Cleaned suggested replies response:', cleanedResponse);
        
        const jsonData = JSON.parse(cleanedResponse);
        if (Array.isArray(jsonData)) {
          console.log('Successfully parsed JSON replies:', jsonData);
          return jsonData.filter((reply: any) => typeof reply === 'string' && reply.trim().length > 0);
        }
        // If it's not an array but a valid JSON object, try to extract replies
        if (jsonData.replies && Array.isArray(jsonData.replies)) {
          return jsonData.replies.filter((reply: any) => typeof reply === 'string' && reply.trim().length > 0);
        }
        if (jsonData.suggestions && Array.isArray(jsonData.suggestions)) {
          return jsonData.suggestions.filter((reply: any) => typeof reply === 'string' && reply.trim().length > 0);
        }
      } catch (jsonError) {
        console.warn('Failed to parse replies as JSON, trying regex extraction:', jsonError);
      }
      
      // נסה לחלץ תשובות בפורמט פשוט יותר
      const lines = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('```'));
        
      if (lines.length > 0) {
        result = lines.map(line => {
          // הסר תבליטים או מספרים בתחילת השורה
          return line.replace(/^[-*]\s+|^\d+\.\s+/, '').trim();
        }).filter(line => line.length > 0);
        
        if (result.length > 0) {
          console.log('Extracted replies from text:', result);
          return result;
        }
      }
      
      // אם הגענו לכאן, לא הצלחנו לחלץ תשובות - החזר מערך ריק
      console.warn('Could not extract any replies, returning empty array');
      return [];
    } catch (error) {
      console.error('Critical error in parseSuggestedReplies:', error);
      return [];
    }
  }

  private parseClassificationResponse(response: string): { category: string; priority: string; confidence: number } {
    try {
      // נקה תגי markdown מסביב ל-JSON
      const cleanedResponse = this.cleanMarkdownJSON(response);
      console.log('Cleaned classification response:', cleanedResponse);
      
      const data = JSON.parse(cleanedResponse);
      return data;
    } catch (error) {
      console.error('Failed to parse classification response:', error);
      return { category: 'general', priority: 'medium', confidence: 0.5 };
    }
  }

  private parseSentimentResponse(response: string): { score: number; label: 'positive' | 'neutral' | 'negative'; confidence: number } {
    try {
      // נקה תגי markdown מסביב ל-JSON
      const cleanedResponse = this.cleanMarkdownJSON(response);
      console.log('Cleaned sentiment response:', cleanedResponse);
      
      const data = JSON.parse(cleanedResponse);
      
      // Validate the response structure and values
      const validatedResult = this.validateSentimentData(data);
      console.log('Validated sentiment result:', validatedResult);
      
      return validatedResult;
    } catch (error) {
      console.error('Failed to parse sentiment response:', error);
      console.error('Raw response:', response);
      return { score: 0, label: 'neutral', confidence: 0.5 };
    }
  }

  private validateSentimentData(data: any): { score: number; label: 'positive' | 'neutral' | 'negative'; confidence: number } {
    // Ensure we have a valid object
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid sentiment data: not an object');
    }

    // Validate and normalize score
    let score = 0;
    if (typeof data.score === 'number' && !isNaN(data.score)) {
      score = Math.max(-1, Math.min(1, data.score)); // Clamp between -1 and 1
    } else if (typeof data.score === 'string') {
      const parsedScore = parseFloat(data.score);
      if (!isNaN(parsedScore)) {
        score = Math.max(-1, Math.min(1, parsedScore));
      }
    }

    // Validate and normalize label
    let label: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (typeof data.label === 'string') {
      const normalizedLabel = data.label.toLowerCase().trim();
      if (normalizedLabel === 'positive' || normalizedLabel === 'negative' || normalizedLabel === 'neutral') {
        label = normalizedLabel as 'positive' | 'neutral' | 'negative';
      }
    }

    // Validate and normalize confidence
    let confidence = 0.5;
    if (typeof data.confidence === 'number' && !isNaN(data.confidence)) {
      confidence = Math.max(0, Math.min(1, data.confidence)); // Clamp between 0 and 1
    } else if (typeof data.confidence === 'string') {
      const parsedConfidence = parseFloat(data.confidence);
      if (!isNaN(parsedConfidence)) {
        confidence = Math.max(0, Math.min(1, parsedConfidence));
      }
    }

    return { score, label, confidence };
  }

  private parseRiskResponse(response: string): { level: 'low' | 'medium' | 'high'; factors: string[] } {
    try {
      // נקה תגי markdown מסביב ל-JSON
      const cleanedResponse = this.cleanMarkdownJSON(response);
      console.log('Cleaned risk response:', cleanedResponse);
      
      const data = JSON.parse(cleanedResponse);
      return data;
    } catch (error) {
      console.error('Failed to parse risk response:', error);
      return { level: 'low', factors: [] };
    }
  }

  private getFallbackStructuredSolution(_ticketContent: string): string {
    return `
פתרון מוצע:
מצטערים, לא הצלחנו ליצור פתרון אוטומטי מפורט מהמידע הקיים במאגר הידע.

צעדים מומלצים:
1. בדיקה ראשונית: ודא שהבעיה עדיין קיימת
2. איסוף מידע: תעד את השגיאות או ההתנהגות הבלתי צפויה
3. פתרונות בסיסיים: נסה לבצע restart או refresh
4. הסלמה: פנה לנציג אנושי לקבלת סיוע מותאם אישית

הערה: נציג התמיכה שלנו יוכל לספק פתרון מדויק יותר על בסיס הפרטים הספציפיים של המקרה.
`;
  }

  private getFallbackAnalysis(/* unused */ _ticket: Ticket): AIAnalysis {
    return {
      classification: { category: 'general', priority: 'medium', confidence: 0.5 },
      sentiment: { score: 0, label: 'neutral', confidence: 0.5 },
      risk_assessment: { level: 'low', factors: [] },
      summary: `כרטיס תמיכה: כותרת כללית`,
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

  // פונקציה לניקוי תגי markdown מסביב ל-JSON
  private cleanMarkdownJSON(response: string): string {
    // נקה תגי markdown מסביב ל-JSON
    let cleanedResponse = response.trim();
    
    // הסר תגי קוד של markdown
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
    const match = codeBlockRegex.exec(cleanedResponse);
    
    if (match && match[1]) {
      cleanedResponse = match[1].trim();
    }
    
    return cleanedResponse;
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.openai) {
        // Return a mock embedding vector
        return Array.from({ length: 1536 }, () => Math.random() - 0.5);
      }

      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return embeddingResponse.data[0]?.embedding || [];
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
        הפתרון צריך להיות בפורמט טקסט פשוט עם כותרות, רשימות ושלבים ברורים.
        
        בעיית הלקוח:
        ${ticketContent}
        
        מידע רלוונטי ממאגר הידע:
        ${knowledgeContext}
        
        דוגמה לפורמט הרצוי:
        
        פתרון מוצע:
        1. צעד ראשון: פעולה לביצוע
        2. צעד שני: פעולה לביצוע
        3. צעד שלישי: פעולה לביצוע
        
        הערות נוספות:
        - הערה חשובה ראשונה
        - הערה חשובה שנייה
        
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