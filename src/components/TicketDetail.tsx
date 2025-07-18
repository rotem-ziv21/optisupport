import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { enhancedSolutionService } from '../services/enhancedSolutionService';
import { Ticket, Message } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  TicketIcon,
  ClockIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  TagIcon,
  ExclamationCircleIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  DocumentTextIcon,
  XCircleIcon,
  PencilIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

// פונקציית עזר פשוטה להצגת התראות
const toast = {
  success: (message: string) => {
    console.log('Success:', message);
    alert(message);
  },
  error: (message: string) => {
    console.error('Error:', message);
    alert(message);
  },
  info: (message: string) => {
    console.log('Info:', message);
    alert(message);
  }
};

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showFullCustomerInfo, setShowFullCustomerInfo] = useState(false);
  
  // משתנים לתכונות AI
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [autoSolution, setAutoSolution] = useState<string | null>(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [showAutoSolution, setShowAutoSolution] = useState(false);

  const [regeneratingSolution, setRegeneratingSolution] = useState(false);
  const [searchingSolutions, setSearchingSolutions] = useState(false);
  const [searchingKnowledgeBase, setSearchingKnowledgeBase] = useState(false);
  // הגדרת טיפוס למקורות פתרון
  interface SolutionSource {
    type: 'knowledge_base' | 'previous_ticket';
    content: string;
    title: string;
    relevance_score: number;
    source_id: string;
    metadata?: any;
  }
  
  const [enhancedSolutionSources, setEnhancedSolutionSources] = useState<SolutionSource[]>([]);
  const [editingSolution, setEditingSolution] = useState(false); // מצב עריכת פתרון
  
  // משתנים לפתרון ידני על ידי הנציג
  const [agentSolution, setAgentSolution] = useState<string>('');
  const [savingSolution, setSavingSolution] = useState(false);
  
  // משתנים לניתוח AI
  const [aiSummary, setAiSummary] = useState<string>('');
  const [sentimentScore, setSentimentScore] = useState<number>(0);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  
  // משתנים לזמן אמת
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const ticketData = await ticketService.getTicket(id);
        setTicket(ticketData);
        
        // טעינת תגובות מוצעות ופתרונות אוטומטיים לאחר טעינת הכרטיס
        if (ticketData) {
          loadSuggestedReplies(ticketData);
          loadAiAnalysis(ticketData);
        }
      } catch (error) {
        console.error('Failed to fetch ticket:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
    
    // הגדרת realtime subscription להודעות חדשות ועדכוני כרטיס (ממשק הנציג)
    let subscription: any = null;
    
    if (isSupabaseConfigured && supabase && id) {
      subscription = supabase
        .channel(`agent-ticket-${id}`)
        // subscription להודעות חדשות מהלקוח
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `ticket_id=eq.${id}`
          },
          async (payload) => {
            console.log('Agent: New message received via realtime:', payload.new);
            
            // עדכון הכרטיס עם ההודעה החדשה
            try {
              const updatedTicket = await ticketService.getTicket(id);
              if (updatedTicket) {
                setTicket(updatedTicket);
              }
            } catch (error) {
              console.error('Agent: Failed to refresh ticket after new message:', error);
            }
          }
        )
        // subscription לעדכוני הכרטיס (שינוי סטטוס וכו')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tickets',
            filter: `id=eq.${id}`
          },
          async (payload) => {
            console.log('Agent: Ticket updated via realtime:', payload.new);
            
            // עדכון הכרטיס עם הנתונים החדשים
            try {
              const updatedTicket = await ticketService.getTicket(id);
              if (updatedTicket) {
                setTicket(updatedTicket);
              }
            } catch (error) {
              console.error('Agent: Failed to refresh ticket after update:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
            console.log('Agent: Realtime subscription connected for ticket:', id);
          } else if (status === 'CLOSED') {
            setIsRealtimeConnected(false);
            console.log('Agent: Realtime subscription closed for ticket:', id);
          }
        });
    }
    
    // ניקוי ה-subscription כשהקומפוננט נמחק
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [id]);
  
  // פונקציות עזר לניתוח סנטימנט
  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return FaceSmileIcon;
    if (score < -0.3) return FaceFrownIcon;
    return FaceSmileIcon;
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600';
    if (score < -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'חיובי';
    if (score < -0.3) return 'שלילי';
    return 'ניטרלי';
  };

  const getRiskIcon = (score: number) => {
    return score > 0.5 ? ShieldExclamationIcon : ShieldCheckIcon;
  };

  const getRiskColor = (score: number) => {
    return score > 0.5 ? 'text-red-600' : 'text-green-600';
  };

  const getRiskLabel = (score: number) => {
    return score > 0.5 ? 'גבוה' : 'נמוך';
  };

  // פונקציה לטעינת ניתוח AI
  const loadAiAnalysis = async (currentTicket: Ticket) => {
    try {
      setAiAnalysisLoading(true);
      
      // בדיקה אם יש כבר ניתוח AI בכרטיס
      if (currentTicket.ai_summary) {
        setAiSummary(currentTicket.ai_summary);
      } else {
        // אם אין, יוצרים סיכום ברירת מחדל
        const defaultSummary = `הלקוח פנה בנושא ${currentTicket.category || 'לא מוגדר'} ברמת עדיפות ${currentTicket.priority || 'לא מוגדרת'}. הכרטיס נמצא כעת בסטטוס ${currentTicket.status || 'לא מוגדר'}.`;
        setAiSummary(defaultSummary);
      }
      
      // בדיקה אם יש ציון סנטימנט בכרטיס
      if (currentTicket.sentiment_score !== undefined) {
        setSentimentScore(currentTicket.sentiment_score);
      }
      
      // בדיקה אם יש ציון סיכון בכרטיס
      if (currentTicket.risk_score !== undefined) {
        setRiskScore(currentTicket.risk_score);
      } else {
        // ברירת מחדל לציון סיכון
        setRiskScore(0.2);
      }
    } catch (error) {
      console.error('Failed to load AI analysis:', error);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // פונקציה לטעינת תגובות מוצעות
  const loadSuggestedReplies = async (currentTicket: Ticket) => {
    try {
      const ticketContent = `${currentTicket.title} ${currentTicket.description}`;
      const replies = await ticketService.getSuggestedReplies(ticketContent);
      setSuggestedReplies(replies);
    } catch (error) {
      console.error('Failed to load suggested replies:', error);
    }
  };
  
  // פונקציה ליצירת פתרון אוטומטי
  const loadAutoSolution = async () => {
    if (!ticket) return;
    
    try {
      setSolutionLoading(true);
      const ticketContent = `${ticket.title} ${ticket.description}`;
      const result = await enhancedSolutionService.findBestSolution(ticketContent);
      
      setEnhancedSolutionSources(result.sources);
      setAutoSolution(result.solution);
      setShowAutoSolution(true);
      
      toast.success('נוצר פתרון אוטומטי');
    } catch (error) {
      console.error('Failed to generate auto solution:', error);
      toast.error('לא הצלחנו ליצור פתרון אוטומטי');
    } finally {
      setSolutionLoading(false);
    }
  };
  
  // פונקציה ליצירה מחדש של פתרון אוטומטי
  const regenerateAutoSolution = async () => {
    if (!ticket) return;
    
    try {
      setRegeneratingSolution(true);
      const ticketContent = `${ticket.title} ${ticket.description}`;
      const result = await enhancedSolutionService.findBestSolution(ticketContent);
      
      setEnhancedSolutionSources(result.sources);
      setAutoSolution(result.solution);
      
      toast.success('הפתרון האוטומטי חודש');
    } catch (error) {
      console.error('Failed to regenerate auto solution:', error);
      toast.error('לא הצלחנו לחדש את הפתרון האוטומטי');
    } finally {
      setRegeneratingSolution(false);
    }
  };
  
  // חיפוש פתרונות דומים מקריאות שירות קודמות
  const handleSearchSimilarSolutions = async () => {
    if (!ticket) return;
    setSearchingSolutions(true);
    try {
      const ticketContent = `${ticket.title} ${ticket.description}`;
      // שימוש בפונקציה הציבורית findBestSolution שמחפשת גם בכרטיסים קודמים
      const result = await enhancedSolutionService.findBestSolution(ticketContent);
      
      console.log('Search results:', result);
      
      if (result.sources.length > 0) {
        // סינון מקורות רק לכרטיסים קודמים
        const ticketSources = result.sources.filter(source => source.type === 'previous_ticket');
        
        console.log('Filtered ticket sources:', ticketSources);
        
        if (ticketSources.length > 0) {
          // יצירת פתרון מהמקור הטוב ביותר
          const bestTicketSource = ticketSources[0];
          
          // שימוש בתוכן המקור במקום הפתרון המשולב
          // הצגת רק מקורות מכרטיסים קודמים
          setEnhancedSolutionSources(ticketSources);
          setEditingSolution(true);
          setAutoSolution(bestTicketSource.content);
          setShowAutoSolution(true);
          toast.success('נמצא פתרון דומה מקריאות קודמות');
        } else {
          toast.info('לא נמצאו פתרונות דומים מספיק מקריאות קודמות');
        }
      } else {
        toast.info('לא נמצאו פתרונות דומים מספיק מקריאות קודמות');
      }
    } catch (error) {
      console.error('Failed to search similar solutions:', error);
      toast.error('לא הצלחנו למצוא פתרון דומה מקריאות קודמות');
    } finally {
      setSearchingSolutions(false);
    }
  };
  
  // שמירת פתרון ידני על ידי הנציג
  const handleSaveAgentSolution = async () => {
    if (!ticket || !agentSolution.trim()) return;
    
    setSavingSolution(true);
    try {
      // שמירת הפתרון בסופרבייס לצורך למידה עתידית
      await enhancedSolutionService.saveSolutionForLearning(ticket.id, agentSolution);
      
      // עדכון הממשק
      setAutoSolution(agentSolution);
      setShowAutoSolution(true);
      setAgentSolution('');
      toast.success('הפתרון נשמר בהצלחה');
    } catch (error) {
      console.error('Failed to save agent solution:', error);
      toast.error('אירעה שגיאה בשמירת הפתרון');
    } finally {
      setSavingSolution(false);
    }
  };
  
  // חיפוש פתרון ממאגר הידע
  const handleSearchKnowledgeBase = async () => {
    if (!ticket) return;
    setSearchingKnowledgeBase(true);
    try {
      const ticketContent = `${ticket.title} ${ticket.description}`;
      const knowledgeResults = await knowledgeBaseService.searchKnowledge(ticketContent, 3);
      
      if (knowledgeResults.length > 0) {
        // מיון לפי ציון דמיון
        knowledgeResults.sort((a, b) => b.similarity_score - a.similarity_score);
        const bestResult = knowledgeResults[0];
        
        // המרה למבנה מקורות אחיד
        const sources: SolutionSource[] = knowledgeResults.map(result => ({
          type: 'knowledge_base' as const,
          content: result.chunk.content,
          title: result.kb_item.title,
          relevance_score: result.similarity_score,
          source_id: result.kb_item.id,
          metadata: {
            category: result.kb_item.category,
            tags: result.kb_item.tags
          }
        }));
        
        // שימוש בפתרון שנמצא
        const foundSolution = bestResult.chunk.content;
        setEnhancedSolutionSources(sources);
        setAutoSolution(foundSolution);
        setShowAutoSolution(true);
        toast.success('נמצא פתרון ממאגר הידע');
      } else {
        toast.info('לא נמצאו פתרונות רלוונטיים במאגר הידע');
      }
    } catch (error) {
      console.error('Failed to search knowledge base:', error);
      toast.error('לא הצלחנו לחפש במאגר הידע');
    } finally {
      setSearchingKnowledgeBase(false);
    }
  };
  
  // Scroll to bottom of messages when conversation updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.conversation]);
  
  // Update document title when ticket loads
  useEffect(() => {
    if (ticket) {
      document.title = `כרטיס #${ticket.id} - ${ticket.title} | OptiSupport`;
    } else {
      document.title = 'פרטי כרטיס | OptiSupport';
    }
    
    return () => {
      document.title = 'OptiSupport';
    };
  }, [ticket]);

  const handleSendReply = async () => {
    if (!ticket || !replyContent.trim() || sending) return;
    
    console.log('Sending reply in TicketDetail:', {
      ticketId: ticket.id,
      currentStatus: ticket.status,
      timestamp: new Date().toISOString()
    });
    
    try {
      setSending(true);
      
      await ticketService.addMessage(ticket.id, {
        content: replyContent,
        sender: 'agent',
        sender_name: 'נציג תמיכה',
      });
      
      // Refresh ticket data to include the new message
      const updatedTicket = await ticketService.getTicket(ticket.id);
      if (updatedTicket) {
        console.log('Ticket status after reply in TicketDetail:', {
          ticketId: updatedTicket.id,
          statusBefore: ticket.status,
          statusAfter: updatedTicket.status,
          wasChanged: ticket.status !== updatedTicket.status
        });
        setTicket(updatedTicket);
      }
      setReplyContent('');
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };
  
  const handleStatusChange = async (newStatus: 'open' | 'in_progress' | 'resolved') => {
    if (!ticket || updatingStatus || ticket.status === newStatus) return;
    
    try {
      setUpdatingStatus(true);
      setStatusDropdownOpen(false);
      
      await ticketService.updateTicket(ticket.id, { status: newStatus });
      
      // Refresh ticket data
      const updatedTicket = await ticketService.getTicket(ticket.id);
      if (updatedTicket) {
        setTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const insertQuickReply = (replyTemplate: string) => {
    setReplyContent(prev => prev + (prev ? '\n' : '') + replyTemplate);
  };
  
  // שימוש בתגובה מוצעת
  const handleUseSuggestedReply = (reply: string) => {
    // הסרת תגי HTML אם יש כאלה
    const cleanReply = reply.replace(/<[^>]*>/g, '');
    setReplyContent(cleanReply);
    toast.success('התגובה המוצעת נוספה לתיבת ההודעה');
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 shadow-lg"></div>
          <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 bg-blue-50 opacity-20"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">כרטיס לא נמצא</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeftIcon className="h-5 w-5 ml-2" />
          חזרה
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="group inline-flex items-center text-slate-600 hover:text-blue-600 transition-all duration-200 bg-white/70 hover:bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm hover:shadow-md"
          >
            <ArrowLeftIcon className="h-5 w-5 ml-1 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">חזרה</span>
          </button>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white break-words">{ticket.title}</h1>
                  {/* אינדיקטור חיבור זמן אמת */}
                  {isSupabaseConfigured && (
                    <div className="flex items-center gap-1 text-xs text-blue-100">
                      <div className={`w-2 h-2 rounded-full ${
                        isRealtimeConnected 
                          ? 'bg-green-400 animate-pulse' 
                          : 'bg-gray-400'
                      }`} />
                      <span className="opacity-75">
                        {isRealtimeConnected ? 'מחובר לזמן אמת' : 'לא מחובר'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <p className="text-blue-100 text-sm opacity-90">כרטיס מספר #{ticket.id}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(ticket.id);
                      alert('מזהה הכרטיס הועתק ללוח');
                    }}
                    className="ml-2 text-blue-200 hover:text-white transition-colors"
                    title="העתק מזהה כרטיס"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <div className="relative">
                  <button 
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    disabled={updatingStatus}
                    className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-sm whitespace-nowrap transition-all duration-200 ${
                      updatingStatus ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl'
                    } ${ticket.status === 'open' ? 'bg-blue-100/90 text-blue-800' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100/90 text-yellow-800' : 'bg-green-100/90 text-green-800'
                    }`}
                  >
                    {updatingStatus ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent ml-2"></div>
                        <span>מעדכן...</span>
                      </>
                    ) : (
                      <>
                        {ticket.status === 'open' ? 'פתוח' :
                         ticket.status === 'in_progress' ? 'בטיפול' : 'נפתר'}
                        <ChevronDownIcon className="h-4 w-4 mr-1 ml-0" />
                      </>
                    )}
                  </button>
                  
                  {statusDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-40 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                          onClick={() => handleStatusChange('open')}
                          className={`w-full text-right px-4 py-2 text-sm ${ticket.status === 'open' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-blue-50'}`}
                          role="menuitem"
                        >
                          <span className="flex items-center">
                            <ExclamationCircleIcon className="h-4 w-4 ml-2 text-blue-600" />
                            פתוח
                          </span>
                        </button>
                        <button
                          onClick={() => handleStatusChange('in_progress')}
                          className={`w-full text-right px-4 py-2 text-sm ${ticket.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-700 hover:bg-yellow-50'}`}
                          role="menuitem"
                        >
                          <span className="flex items-center">
                            <DocumentDuplicateIcon className="h-4 w-4 ml-2 text-yellow-600" />
                            בטיפול
                          </span>
                        </button>
                        <button
                          onClick={() => handleStatusChange('resolved')}
                          className={`w-full text-right px-4 py-2 text-sm ${ticket.status === 'resolved' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-green-50'}`}
                          role="menuitem"
                        >
                          <span className="flex items-center">
                            <CheckCircleIcon className="h-4 w-4 ml-2 text-green-600" />
                            נפתר
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-sm whitespace-nowrap ${
                  ticket.priority === 'urgent' ? 'bg-red-100/90 text-red-800' :
                  ticket.priority === 'high' ? 'bg-orange-100/90 text-orange-800' :
                  ticket.priority === 'medium' ? 'bg-yellow-100/90 text-yellow-800' : 'bg-green-100/90 text-green-800'
                }`}>
                  {ticket.priority === 'urgent' ? 'דחוף' :
                   ticket.priority === 'high' ? 'גבוה' :
                   ticket.priority === 'medium' ? 'בינוני' : 'נמוך'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 relative">
                <div className="flex items-center mb-2">
                  <UserCircleIcon className="h-5 w-5 text-blue-600 ml-2 flex-shrink-0" />
                  <span className="text-blue-700 font-medium truncate">לקוח</span>
                  <button 
                    onClick={() => setShowFullCustomerInfo(!showFullCustomerInfo)}
                    className="absolute top-2 left-2 text-blue-600 hover:text-blue-800 transition-colors"
                    title={showFullCustomerInfo ? "הסתר פרטים" : "הצג פרטים נוספים"}
                  >
                    <ChevronDownIcon className={`h-5 w-5 transition-transform ${showFullCustomerInfo ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                <p className="text-slate-800 font-semibold text-sm sm:text-base break-words">{ticket.customer_name}</p>
                
                {showFullCustomerInfo && (
                  <div className="mt-3 pt-3 border-t border-blue-100 space-y-2">
                    {ticket.customer_email && (
                      <div className="flex items-center text-sm">
                        <EnvelopeIcon className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                        <a href={`mailto:${ticket.customer_email}`} className="text-blue-700 hover:underline break-all">
                          {ticket.customer_email}
                        </a>
                      </div>
                    )}
                    
                    {ticket.customer_phone && (
                      <div className="flex items-center text-sm">
                        <PhoneIcon className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                        <a href={`tel:${ticket.customer_phone}`} className="text-blue-700 hover:underline">
                          {ticket.customer_phone}
                        </a>
                      </div>
                    )}
                    
                    {ticket.company_name && (
                      <div className="flex items-center text-sm">
                        <BuildingOfficeIcon className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                        <span className="text-slate-700">{ticket.company_name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-5 w-5 text-emerald-600 ml-2 flex-shrink-0" />
                  <span className="text-emerald-700 font-medium truncate">נפתח</span>
                </div>
                <p className="text-slate-800 font-semibold text-sm sm:text-base break-words">{formatDate(ticket.created_at)}</p>
              </div>
              
              {ticket.category && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center mb-2">
                    <TicketIcon className="h-5 w-5 text-purple-600 ml-2 flex-shrink-0" />
                    <span className="text-purple-700 font-medium truncate">קטגוריה</span>
                  </div>
                  <p className="text-slate-800 font-semibold text-sm sm:text-base break-words">{ticket.category}</p>
                </div>
              )}
              
              {ticket.assigned_to && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center mb-2">
                    <UserCircleIcon className="h-5 w-5 text-orange-600 ml-2 flex-shrink-0" />
                    <span className="text-orange-700 font-medium truncate">מטפל</span>
                  </div>
                  <p className="text-slate-800 font-semibold text-sm sm:text-base break-words">{ticket.assigned_to}</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-slate-200 mb-6 sm:mb-8">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0"></div>
                <span className="truncate">תיאור הבעיה</span>
              </h3>
              <div className="bg-white/50 p-4 rounded-lg border border-slate-100 shadow-inner">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{ticket.description}</p>
              </div>
              <div className="mt-4 text-xs text-slate-500 flex items-center justify-end">
                <span>נוצר בתאריך: {formatDate(ticket.created_at)}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 sm:px-6 py-4 border-b border-slate-200">
                <div className="flex items-center">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 ml-2 flex-shrink-0" />
                  <h3 className="font-semibold text-slate-800 truncate">שיחה</h3>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 pr-2 conversation-container">
                  {ticket.conversation && ticket.conversation.length > 0 ? (
                    <>
                      {ticket.conversation.map((message: Message, index) => (
                        <div 
                          key={index}
                          className={`group transition-all duration-200 ${
                            message.sender === 'agent' 
                              ? 'flex justify-end'
                              : 'flex justify-start'
                          }`}
                        >
                          <div className={`max-w-[85%] sm:max-w-md lg:max-w-lg xl:max-w-xl p-3 sm:p-4 rounded-2xl shadow-sm border hover:shadow-md transition-shadow ${
                            message.sender === 'agent' 
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className={`font-medium text-sm flex-shrink-0 ${
                                message.sender === 'agent' ? 'text-blue-100' : 'text-slate-600'
                              }`}>
                                {message.sender_name}
                              </span>
                              <span className={`text-xs whitespace-nowrap ${
                                message.sender === 'agent' ? 'text-blue-200' : 'text-slate-500'
                              }`}>
                                {formatDate(message.created_at)}
                              </span>
                            </div>
                            <p className={`leading-relaxed text-sm sm:text-base break-words whitespace-pre-wrap ${
                              message.sender === 'agent' ? 'text-white' : 'text-slate-700'
                            }`}>{message.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} /> {/* Reference element for auto-scrolling */}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <ChatBubbleLeftRightIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">אין הודעות בשיחה זו</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Analysis Sidebar */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 sm:px-6 py-4 border-b border-slate-200">
                <div className="flex items-center">
                  <LightBulbIcon className="h-6 w-6 text-indigo-600 ml-2 flex-shrink-0" />
                  <h3 className="font-semibold text-slate-800 truncate">ניתוח AI</h3>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 space-y-6">
                {/* AI Summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center">
                    <SparklesIcon className="h-4 w-4 ml-1 text-indigo-600" />
                    סיכום אוטומטי
                  </h4>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-lg border border-indigo-100 text-sm text-slate-700">
                    {aiAnalysisLoading ? (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
                      </div>
                    ) : (
                      aiSummary || 'הלקוח פנה בנושא לא מוגדר ברמת עדיפות לא מוגדרת. הכרטיס נמצא כעת בסטטוס לא מוגדר.'
                    )}
                  </div>
                </div>
                
                {/* Sentiment Analysis */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center">
                    {React.createElement(getSentimentIcon(sentimentScore), {
                      className: clsx('h-4 w-4 ml-1', getSentimentColor(sentimentScore))
                    })}
                    ניתוח סנטימנט
                  </h4>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    {aiAnalysisLoading ? (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={clsx('text-sm font-semibold', getSentimentColor(sentimentScore))}>
                            {getSentimentLabel(sentimentScore)}
                          </span>
                          <span className="text-xs text-slate-500">ציון: {sentimentScore.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={clsx(
                              'h-full rounded-full', 
                              sentimentScore > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                            )}
                            style={{ width: `${Math.abs(sentimentScore) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Risk Assessment */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center">
                    {React.createElement(getRiskIcon(riskScore), {
                      className: clsx('h-4 w-4 ml-1', getRiskColor(riskScore))
                    })}
                    הערכת סיכון
                  </h4>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    {aiAnalysisLoading ? (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={clsx('text-sm font-semibold', getRiskColor(riskScore))}>
                            {getRiskLabel(riskScore)}
                          </span>
                          <span className="text-xs text-slate-500">ציון: {riskScore.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-red-500"
                            style={{ width: `${riskScore * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 sm:px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800 truncate">הוסף תגובה</h3>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button 
                      onClick={() => insertQuickReply("תודה על פנייתך. אנחנו בודקים את הנושא ונחזור אליך בהקדם.")} 
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <TagIcon className="h-3.5 w-3.5 inline-block ml-1" />
                      אישור קבלה
                    </button>
                    <button 
                      onClick={() => insertQuickReply("הבעיה נפתרה. האם אתה יכול לאשר שהכל עובד כראוי?")} 
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <CheckCircleIcon className="h-3.5 w-3.5 inline-block ml-1" />
                      אישור פתרון
                    </button>
                    <button 
                      onClick={() => insertQuickReply("אנחנו צריכים מידע נוסף כדי לטפל בבעיה. האם תוכל לפרט יותר?")} 
                      className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs border border-yellow-200 hover:bg-yellow-100 transition-colors"
                    >
                      <ExclamationCircleIcon className="h-3.5 w-3.5 inline-block ml-1" />
                      בקשת מידע
                    </button>
                    
                    {/* כפתורי AI */}
                    <button 
                      onClick={loadAutoSolution} 
                      disabled={solutionLoading}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs border border-purple-200 hover:bg-purple-100 transition-colors flex items-center"
                    >
                      <SparklesIcon className="h-3.5 w-3.5 inline-block ml-1" />
                      {solutionLoading ? 'מחפש פתרון...' : 'פתרון אוטומטי'}
                    </button>
                    <button 
                      onClick={handleSearchSimilarSolutions} 
                      disabled={searchingSolutions}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center"
                    >
                      <DocumentDuplicateIcon className="h-3.5 w-3.5 inline-block ml-1" />
                      {searchingSolutions ? 'מחפש...' : 'חפש פתרונות דומים'}
                    </button>
                    <button 
                      onClick={handleSearchKnowledgeBase} 
                      disabled={searchingKnowledgeBase}
                      className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs border border-teal-200 hover:bg-teal-100 transition-colors flex items-center"
                    >
                      <DocumentTextIcon className="h-3.5 w-3.5 inline-block ml-1" />
                      {searchingKnowledgeBase ? 'מחפש...' : 'חפש במאגר הידע'}
                    </button>
                    <button 
                      onClick={() => setEditingSolution(true)}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs border border-green-200 hover:bg-green-100 transition-colors flex items-center"
                    >
                      <PencilIcon className="h-3.5 w-3.5 inline-block ml-1" />
                      רשום פתרון ידני
                    </button>
                  </div>
                  
                  {/* אזור עריכת פתרון ידני */}
                  {editingSolution && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center">
                          <PencilIcon className="h-4 w-4 text-green-600 mr-1" />
                          רשום פתרון ידני
                        </h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingSolution(false)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <textarea
                          value={agentSolution}
                          onChange={(e) => setAgentSolution(e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 text-sm text-right"
                          rows={5}
                          placeholder="הכנס כאן את הפתרון הידני שלך"
                          dir="rtl"
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={handleSaveAgentSolution}
                            disabled={savingSolution || !agentSolution.trim()}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {savingSolution ? 'שומר...' : 'שמור פתרון'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* הצגת פתרון אוטומטי */}
                  {showAutoSolution && autoSolution && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center">
                          <SparklesIcon className="h-4 w-4 text-purple-600 mr-1" />
                          פתרון מוצע
                        </h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowAutoSolution(false)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-800 whitespace-pre-wrap mb-3">
                        {autoSolution}
                      </div>
                      
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleUseSuggestedReply(autoSolution)}
                          className="flex-1 text-center p-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          השתמש בפתרון זה
                        </button>
                        <button
                          onClick={regenerateAutoSolution}
                          disabled={regeneratingSolution}
                          className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors"
                        >
                          {regeneratingSolution ? 'מחדש...' : 'חדש פתרון'}
                        </button>
                      </div>
                      
                      {/* הצגת מקורות הפתרון */}
                      {enhancedSolutionSources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">מקורות פתרון:</h5>
                          <div className="space-y-2">
                            {enhancedSolutionSources.map((source, index) => (
                              <div key={index} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">{source.title}</p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {source.type === 'previous_ticket' ? 'כרטיס קודם' : 'מאגר ידע'}
                                  </p>
                                </div>
                                {source.type === 'previous_ticket' && (
                                  <button
                                    onClick={() => navigate(`/tickets/${source.source_id}`)}
                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                  >
                                    פתח כרטיס
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* תגובות מוצעות */}
                  {suggestedReplies.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 ml-1 text-blue-600" />
                        תגובות מוצעות
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {suggestedReplies.map((reply, index) => (
                          <div key={index} className="flex space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleUseSuggestedReply(reply)}
                              className="flex-1 text-right p-2 text-xs bg-white hover:bg-blue-100 rounded border border-blue-200 transition-colors flex items-center justify-between"
                            >
                              <span>{reply.length > 80 ? reply.substring(0, 80) + '...' : reply}</span>
                              <PaperAirplaneIcon className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <textarea
                    className="w-full p-3 sm:p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 bg-slate-50 hover:bg-white focus:bg-white text-sm sm:text-base"
                    rows={4}
                    placeholder="כתוב את תגובתך כאן..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                      <span className="ml-1">טיפ:</span> לחץ על אחת התגובות המהירות למעלה או כתוב תגובה מותאמת אישית
                    </div>
                    
                    <button
                      onClick={handleSendReply}
                      disabled={!replyContent.trim() || sending}
                      className={`inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                        !replyContent.trim() || sending
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                      }`}
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent ml-2"></div>
                          <span>שולח...</span>
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                          <span className="whitespace-nowrap">שלח תגובה</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
