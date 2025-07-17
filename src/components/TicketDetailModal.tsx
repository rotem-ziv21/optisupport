import { useState, useEffect } from 'react';
// החלפת השימוש ב-toast בפתרון פשוט יותר
const toast = {
  success: (message: string) => {
    console.log('Success:', message);
    alert(message);
  },
  error: (message: string) => {
    console.error('Error:', message);
    alert(message);
  }
};
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  UserIcon, 
  ClockIcon, 
  TagIcon, 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  EnvelopeIcon, 
  PlusIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  TicketIcon, 
  FaceSmileIcon, 
  FaceFrownIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  SparklesIcon, 
  DocumentTextIcon, 
  ClipboardDocumentIcon, 
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { Ticket, AgentAction } from '../types';
import { ticketService } from '../services/ticketService';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { enhancedSolutionService } from '../services/enhancedSolutionService';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated?: () => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

const statusIcons = {
  open: ClockIcon,
  in_progress: ExclamationTriangleIcon,
  resolved: CheckCircleIcon,
  closed: XCircleIcon
};

const priorityLabels = {
  low: 'נמוך',
  medium: 'בינוני',
  high: 'גבוה',
  urgent: 'דחוף'
};

const statusLabels = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  resolved: 'נפתר',
  closed: 'סגור'
};

const statusOptions = [
  { value: 'open', label: 'פתוח', icon: ClockIcon, color: 'text-blue-600' },
  { value: 'in_progress', label: 'בטיפול', icon: ExclamationTriangleIcon, color: 'text-yellow-600' },
  { value: 'resolved', label: 'נפתר', icon: CheckCircleIcon, color: 'text-green-600' },
  { value: 'closed', label: 'סגור', icon: XCircleIcon, color: 'text-gray-600' }
];

const riskLabels = {
  low: 'נמוך',
  medium: 'בינוני',
  high: 'גבוה'
};

const categoryLabels = {
  technical: 'טכני',
  billing: 'חיוב',
  general: 'כללי',
  feature_request: 'בקשת תכונה'
};

export function TicketDetailModal({ ticket, isOpen, onClose, onTicketUpdated }: TicketDetailModalProps) {
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(ticket);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [autoSolution, setAutoSolution] = useState<string | null>(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [showAutoSolution, setShowAutoSolution] = useState(true);
  const [solutionGenerated, setSolutionGenerated] = useState(false);
  const [regeneratingSolution, setRegeneratingSolution] = useState(false);
  const [newAgentAction, setNewAgentAction] = useState('');
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [savingActions, setSavingActions] = useState(false);
  const [searchingSolutions, setSearchingSolutions] = useState(false);
  const [searchingKnowledgeBase, setSearchingKnowledgeBase] = useState(false);
  const [enhancedSolutionSources, setEnhancedSolutionSources] = useState<any[]>([]);
  const [enhancedSolutionConfidence, setEnhancedSolutionConfidence] = useState<number>(0);
  const [editingSolution, setEditingSolution] = useState(false);
  const [solution, setSolution] = useState<string>('');
  const [agentSolution, setAgentSolution] = useState<string>('');
  const [savingSolution, setSavingSolution] = useState(false);

  useEffect(() => {
    // Reset solution state when ticket changes
    if (ticket?.id !== currentTicket?.id) {
      setSolutionGenerated(false);
      setAutoSolution(null);
    }
  }, [ticket?.id, currentTicket?.id]);

  useEffect(() => {
    setCurrentTicket(ticket);
    
    // Handle agent actions - support both string (legacy) and array formats
    if (ticket && isOpen) {
      if (typeof ticket.agent_actions === 'string') {
        // Legacy format - convert to array if not empty
        if (ticket.agent_actions) {
          setAgentActions([{
            id: 'legacy-1',
            content: ticket.agent_actions,
            timestamp: ticket.updated_at
          }]);
        } else {
          setAgentActions([]);
        }
      } else if (Array.isArray(ticket.agent_actions)) {
        // New format - already an array
        setAgentActions(ticket.agent_actions);
      } else {
        // No actions yet
        setAgentActions([]);
      }
      
      // Reset new action input
      setNewAgentAction('');
      
      // סימון הודעות לקוח כנקראות כאשר נציג פותח את הכרטיס
      if (ticket.has_unread_customer_messages) {
        console.log('Marking customer messages as read for ticket:', ticket.id);
        try {
          ticketService.markMessagesAsRead(ticket.id)
            .then(() => {
              // עדכון המצב המקומי
              setCurrentTicket(prev => prev ? {...prev, has_unread_customer_messages: false} : null);
              // עדכון הממשק הראשי
              if (onTicketUpdated) {
                onTicketUpdated();
              }
            })
            .catch(error => {
              console.error('Failed to mark messages as read:', error);
              // עדיין נעדכן את המצב המקומי גם אם העדכון בשרת נכשל
              setCurrentTicket(prev => prev ? {...prev, has_unread_customer_messages: false} : null);
            });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
      
      // Load other data
      loadSuggestedReplies();
      if (!solutionGenerated) {
        loadAutoSolution();
      }
    }
  }, [ticket, isOpen]);

  const loadSuggestedReplies = async () => {
    if (!ticket) return;
    try {
      const replies = await ticketService.getSuggestedReplies(ticket.id);
      setSuggestedReplies(replies);
    } catch (error) {
      console.error('Failed to load suggested replies:', error);
      // Fallback Hebrew replies
      setSuggestedReplies([
        'תודה על פנייתך. אנו בוחנים את הבעיה ונחזור אליך בהקדם האפשרי.',
        'אני מבין את הבעיה שלך. בינתיים, אתה יכול לנסות את הפתרונות הבאים...',
        'זה נשמע כמו בעיה ידועה. הפתרון המומלץ הוא...',
        'אני מעביר את הבקשה שלך לצוות המתמחה. נחזור אליך תוך 24 שעות.',
        'האם ניסית לבצע את הפעולות הבאות? זה עשוי לפתור את הבעיה.'
      ]);
    }
  };

  const loadAutoSolution = async () => {
    if (!ticket) return;
    
    setSolutionLoading(true);
    try {
      const solution = await knowledgeBaseService.generateAutoSolution(
        ticket.id, 
        `${ticket.title}\n${ticket.description}`
      );
      
      if (solution && solution.confidence_score > 0.6) {
        setAutoSolution(solution.solution_content);
        setSolutionGenerated(true);
      }
    } catch (error) {
      console.error('Failed to load auto solution:', error);
    } finally {
      setSolutionLoading(false);
    }
  };

  const regenerateAutoSolution = async () => {
    if (!ticket) return;
    
    setRegeneratingSolution(true);
    try {
      // Force regeneration by clearing cache and generating new solution
      const solution = await knowledgeBaseService.generateAutoSolution(
        ticket.id, 
        `${ticket.title}\n${ticket.description}`,
        true // Force regeneration flag
      );
      
      if (solution) {
        setAutoSolution(solution.solution_content);
      }
    } catch (error) {
      console.error('Failed to regenerate auto solution:', error);
    } finally {
      setRegeneratingSolution(false);
    }
  };
  
  const handleSentimentAnalysis = async () => {
    // Placeholder for sentiment analysis
    console.log('Sentiment analysis would be performed here');
  };

  /**
   * חיפוש פתרונות דומים מקריאות שירות קודמות
   */
  const handleSearchSimilarSolutions = async () => {
    if (!currentTicket) return;
    
    setSearchingSolutions(true);
    try {
      const ticketContent = `${currentTicket.title} ${currentTicket.description}`;
      
      // חיפוש רק בקריאות קודמות ולא במאגר הידע
      const previousTicketSources = await enhancedSolutionService.searchPreviousTickets(ticketContent);
      
      // בדיקה שיש תוצאות עם ציון התאמה גבוה מספיק
      const relevantSources = previousTicketSources.filter(source => source.relevance_score >= 0.8);
      
      if (relevantSources.length > 0) {
        // מיון המקורות לפי ציון התאמה
        relevantSources.sort((a, b) => b.relevance_score - a.relevance_score);
        
        // לקיחת הפתרון הטוב ביותר
        const bestSource = relevantSources[0];
        
        setSolution(bestSource.content);
        setEnhancedSolutionSources(relevantSources);
        setEnhancedSolutionConfidence(bestSource.relevance_score);
        setEditingSolution(true);
        
        // הצגת הפתרון האוטומטי
        setAutoSolution(bestSource.content);
        setSolutionGenerated(true);
        setShowAutoSolution(true);
        
        toast.success('נמצא פתרון דומה מקריאות קודמות');
      } else {
        // אם אין תוצאות מתאימות
        toast.info('לא נמצאו פתרונות דומים מספיק מקריאות קודמות');
      }
    } catch (error) {
      console.error('Failed to search similar solutions:', error);
      toast.error('לא הצלחנו למצוא פתרון דומה מקריאות קודמות');
    } finally {
      setSearchingSolutions(false);
    }
  };
  
  /**
   * חיפוש פתרון ממאגר הידע
   */
  const handleSearchKnowledgeBase = async () => {
    if (!currentTicket) return;
    
    setSearchingKnowledgeBase(true);
    try {
      const solution = await knowledgeBaseService.generateAutoSolution(
        currentTicket.id, 
        `${currentTicket.title}\n${currentTicket.description}`
      );
      
      // בדיקה שציון ההתאמה גבוה מספיק (מעל 0.8)
      if (solution && solution.confidence_score >= 0.8) {
        setAutoSolution(solution.solution_content);
        setSolutionGenerated(true);
        setShowAutoSolution(true);
        toast.success('נמצא פתרון ממאגר הידע');
      } else {
        // אם הציון נמוך מדי או לא נמצא פתרון
        toast.info('לא נמצאו פתרונות מתאימים מספיק במאגר הידע');
      }
    } catch (error) {
      console.error('Failed to search knowledge base:', error);
      toast.error('לא הצלחנו למצוא פתרון ממאגר הידע');
    } finally {
      setSearchingKnowledgeBase(false);
    }
  };
  
  /**
   * שמירת פתרון שנכתב על ידי הנציג
   */
  const handleSaveAgentSolution = async () => {
    if (!currentTicket || !agentSolution.trim()) return;
    
    setSavingSolution(true);
    try {
      // שמירת הפתרון בסופרבייס באמצעות שירות הפתרונות המשולב
      await enhancedSolutionService.saveSolutionForLearning(currentTicket.id, agentSolution);
      
      // עדכון הפתרון המקומי
      setAutoSolution(agentSolution);
      setSolutionGenerated(true);
      setShowAutoSolution(true);
      setEditingSolution(false);
      
      toast.success('הפתרון נשמר בהצלחה');
    } catch (error) {
      console.error('Failed to save agent solution:', error);
      toast.error('לא הצלחנו לשמור את הפתרון');
    } finally {
      setSavingSolution(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentTicket || !newMessage.trim()) return;

    console.log('Sending regular message:', {
      ticketId: currentTicket.id,
      currentStatus: currentTicket.status,
      timestamp: new Date().toISOString()
    });

    setLoading(true);
    try {
      await ticketService.addMessage(currentTicket.id, {
        content: newMessage,
        sender: 'agent',
        sender_name: 'נציג תמיכה'
      });
      setNewMessage('');
      onTicketUpdated?.();
      
      // Refresh ticket data
      const updatedTicket = await ticketService.getTicket(currentTicket.id);
      if (updatedTicket) {
        console.log('Ticket status after regular message:', {
          ticketId: updatedTicket.id,
          statusBefore: currentTicket.status,
          statusAfter: updatedTicket.status,
          wasChanged: currentTicket.status !== updatedTicket.status
        });
        setCurrentTicket(updatedTicket);
      }
      
      toast.success('ההודעה נשלחה בהצלחה');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('שגיאה בשליחת ההודעה');
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה לשליחת הודעה בשם הלקוח
  const handleSendAsCustomer = async () => {
    if (!currentTicket || !newMessage.trim()) return;

    console.log('Sending message as customer:', {
      ticketId: currentTicket.id,
      currentStatus: currentTicket.status,
      timestamp: new Date().toISOString()
    });

    setLoading(true);
    try {
      await ticketService.addMessage(currentTicket.id, {
        content: newMessage,
        sender: 'customer',
        sender_name: currentTicket.customer_name || 'לקוח'
      });
      setNewMessage('');
      onTicketUpdated?.();
      
      // Refresh ticket data
      const updatedTicket = await ticketService.getTicket(currentTicket.id);
      if (updatedTicket) {
        console.log('Ticket status after customer message:', {
          ticketId: updatedTicket.id,
          statusBefore: currentTicket.status,
          statusAfter: updatedTicket.status,
          wasChanged: currentTicket.status !== updatedTicket.status
        });
        setCurrentTicket(updatedTicket);
      }
      
      toast.success('ההודעה נשלחה בשם הלקוח בהצלחה');
    } catch (error) {
      console.error('Failed to send message as customer:', error);
      toast.error('שגיאה בשליחת ההודעה בשם הלקוח');
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה לשליחת הודעה ללקוח
  const handleSendToCustomer = async () => {
    if (!currentTicket || !newMessage.trim()) return;

    console.log('Sending message to customer:', {
      ticketId: currentTicket.id,
      currentStatus: currentTicket.status,
      timestamp: new Date().toISOString()
    });

    setLoading(true);
    try {
      // שימוש בפונקציה החדשה לשליחת הודעה ללקוח
      await ticketService.sendMessageToCustomer(
        currentTicket.id,
        newMessage,
        'נציג תמיכה'
      );
      
      setNewMessage('');
      onTicketUpdated?.();
      
      // רענון נתוני הכרטיס
      const updatedTicket = await ticketService.getTicket(currentTicket.id);
      if (updatedTicket) {
        console.log('Ticket status after sending to customer:', {
          ticketId: updatedTicket.id,
          statusBefore: currentTicket.status,
          statusAfter: updatedTicket.status,
          wasChanged: currentTicket.status !== updatedTicket.status
        });
        setCurrentTicket(updatedTicket);
      }
      
      toast.success('ההודעה נשלחה ללקוח בהצלחה');
    } catch (error) {
      console.error('Failed to send message to customer:', error);
      toast.error('שגיאה בשליחת ההודעה ללקוח');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!currentTicket) return;

    // לוג לצורך מעקב שינויי סטטוס
    console.log('Status change triggered:', { 
      ticketId: currentTicket.id,
      from: currentTicket.status, 
      to: newStatus, 
      timestamp: new Date().toISOString() 
    });

    // אישור לפני סגירת כרטיס
    if ((newStatus === 'resolved' || newStatus === 'closed') && 
        currentTicket.status !== 'resolved' && 
        currentTicket.status !== 'closed') {
      const confirmed = window.confirm('האם אתה בטוח שברצונך לסגור את הכרטיס?');
      if (!confirmed) {
        console.log('Status change cancelled by user');
        setStatusDropdownOpen(false);
        return;
      }
    }

    try {
      const updatedTicket = await ticketService.updateTicket(currentTicket.id, {
        status: newStatus as any,
        updated_at: new Date().toISOString()
      });
      
      setCurrentTicket(updatedTicket);
      setStatusDropdownOpen(false);
      onTicketUpdated?.();
      
      console.log('Status change completed successfully:', {
        ticketId: currentTicket.id,
        newStatus: newStatus
      });
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      toast.error('שגיאה בעדכון סטטוס הכרטיס');
    }
  };

  const handleUseSuggestedReply = async (reply: string) => {
    console.log('Using suggested reply:', {
      ticketId: currentTicket?.id,
      currentStatus: currentTicket?.status,
      timestamp: new Date().toISOString()
    });
    
    setNewMessage(reply);
  
    // שליחת ההודעה אוטומטית ללקוח (ללא שינוי סטטוס)
    try {
      setLoading(true);
      
      if (!currentTicket) return;
      
      console.log('Sending message without changing status:', {
        ticketId: currentTicket.id,
        statusBefore: currentTicket.status
      });
      
      await ticketService.addMessage(currentTicket.id, {
        content: reply,
        sender: 'agent',
        sender_name: 'נציג שירות',
        is_ai_suggested: true
      });
      
      // ניקוי שדה ההודעה
      setNewMessage('');
      onTicketUpdated?.();
      
      // רענון נתוני הכרטיס
      const updatedTicket = await ticketService.getTicket(currentTicket.id);
      if (updatedTicket) {
        console.log('Ticket status after message:', {
          ticketId: updatedTicket.id,
          statusAfter: updatedTicket.status,
          wasChanged: currentTicket.status !== updatedTicket.status
        });
        setCurrentTicket(updatedTicket);
      }
      
      // הודעה למשתמש שההודעה נשלחה
      toast.success('הפתרון נשלח ללקוח בהצלחה');
    } catch (error) {
      console.error('Failed to send solution:', error);
      toast.error('שגיאה בשליחת הפתרון ללקוח');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgentAction = async () => {
    if (!currentTicket || !newAgentAction.trim()) return;

    setSavingActions(true);
    try {
      // Create new action
      const newAction: AgentAction = {
        id: `action-${Date.now()}`,
        content: newAgentAction.trim(),
        timestamp: new Date().toISOString(),
        agent_name: 'נציג' // Could be replaced with actual agent name
      };
      
      // Add to existing actions
      const updatedActions = [...agentActions, newAction];
      
      // Update ticket
      await ticketService.updateTicket(currentTicket.id, {
        agent_actions: updatedActions,
        updated_at: new Date().toISOString()
      });
      
      // Update local state
      setAgentActions(updatedActions);
      setCurrentTicket(prev => prev ? { ...prev, agent_actions: updatedActions } : prev);
      setNewAgentAction(''); // Clear input field
      onTicketUpdated?.();
      
      // Show success feedback
      const button = document.querySelector('[data-add-action]') as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'נוסף!';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to save agent action:', error);
      alert('שגיאה בשמירת הפעולה. אנא נסה שוב.');
    } finally {
      setSavingActions(false);
    }
  };

  // Legacy function removed as it's no longer used

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return FaceSmileIcon;
    if (score < -0.3) return FaceFrownIcon;
    return ExclamationCircleIcon;
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-500';
    if (score < -0.3) return 'text-red-500';
    return 'text-gray-500';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'חיובי';
    if (score < -0.3) return 'שלילי';
    return 'נייטרלי';
  };

  if (!currentTicket) return null;

  const StatusIcon = statusIcons[currentTicket.status];
  const SentimentIcon = getSentimentIcon(currentTicket.sentiment_score);
  // מוצא את האפשרות הנוכחית של הסטטוס לפי ערך הסטטוס של הכרטיס
  // משתנה זה יכול לשמש בעתיד להצגת מידע נוסף על הסטטוס

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-7xl bg-gradient-to-br from-white via-gray-50/30 to-white rounded-3xl shadow-2xl max-h-[95vh] flex flex-col backdrop-blur-xl border border-gray-200/20 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-8 border-b border-gray-200/30 bg-gradient-to-r from-slate-50 via-gray-50/80 to-slate-50/50 flex-shrink-0 rounded-t-3xl backdrop-blur-sm relative overflow-hidden">
                {/* Subtle geometric pattern overlay */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full filter blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-indigo-500 to-cyan-500 rounded-full filter blur-3xl"></div>
                </div>
                <div className="flex items-center space-x-6 space-x-reverse relative z-10">
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl shadow-lg border border-blue-200/20 backdrop-blur-sm">
                    <TicketIcon className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent leading-tight">{currentTicket.title}</h2>
                    <div className="flex items-center space-x-4 space-x-reverse mt-2">
                      <span className="text-sm text-gray-600 font-medium bg-gray-100/80 px-3 py-1 rounded-full">
                        #{currentTicket.ticket_number || currentTicket.id.slice(0, 8)}
                      </span>
                      
                      {/* Status Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                          className={clsx(
                            'inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm border border-white/20',
                            statusColors[currentTicket.status]
                          )}
                        >
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {statusLabels[currentTicket.status]}
                          <ChevronDownIcon className="h-3 w-3 mr-1" />
                        </button>
                        
                        {statusDropdownOpen && (
                          <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 z-10 overflow-hidden">
                            {statusOptions.map((option) => {
                              const OptionIcon = option.icon;
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => handleStatusChange(option.value)}
                                  className={clsx(
                                    'w-full flex items-center px-4 py-3 text-sm hover:bg-gray-50/80 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm',
                                    currentTicket.status === option.value ? 'bg-blue-50/80 text-blue-700 font-medium' : 'text-gray-700'
                                  )}
                                >
                                  <OptionIcon className={clsx('h-4 w-4 ml-2', option.color)} />
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      <span className={clsx('inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/20', priorityColors[currentTicket.priority])}>
                        {priorityLabels[currentTicket.priority]}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="relative z-10 p-3 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white/70 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 hover:rotate-90 backdrop-blur-sm"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="flex flex-1 min-h-0">
                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                  {/* Customer Info & Description */}
                  <div className="p-6 border-b border-gray-200/30 flex-shrink-0 bg-gradient-to-br from-gray-50/30 to-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="flex items-center space-x-4 space-x-reverse p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-xl border border-blue-100/50 backdrop-blur-sm">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full shadow-lg">
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{currentTicket.customer_name}</p>
                          <p className="text-sm text-blue-600 font-medium">{currentTicket.customer_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 space-x-reverse p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 rounded-xl border border-emerald-100/50 backdrop-blur-sm">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-lg">
                          <ClockIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">נוצר</p>
                          <p className="text-sm text-emerald-600 font-medium">{new Date(currentTicket.created_at).toLocaleString('he-IL')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full ml-2"></div>
                        תיאור הבעיה
                      </h3>
                      <div className="bg-gradient-to-br from-gray-50/80 to-white p-5 rounded-2xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
                        <p className="text-gray-700 leading-relaxed">{currentTicket.description}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    {currentTicket.tags && currentTicket.tags.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full ml-2"></div>
                          תגיות
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {currentTicket.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 border border-blue-200/50 backdrop-blur-sm hover:scale-105 transition-transform duration-200"
                            >
                              <TagIcon className="h-4 w-4 ml-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Agent Actions */}
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full ml-2"></div>
                        פעולות שבוצעו על ידי הנציג
                      </h4>
                      
                      {/* Action History */}
                      {agentActions.length > 0 && (
                        <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200/50 rounded-xl divide-y divide-gray-200/50 bg-gradient-to-br from-gray-50/50 to-white backdrop-blur-sm">
                          {agentActions.map((action) => {
                            // Handle case where action might be a string representation of JSON
                            let displayContent = action.content;
                            
                            // First check if content is a string that might be JSON
                            if (typeof action.content === 'string') {
                              try {
                                // Try to parse if it's a JSON string
                                const parsed = JSON.parse(action.content);
                                if (parsed && typeof parsed === 'object') {
                                  // If it has a content field, use that
                                  if (parsed.content) {
                                    displayContent = parsed.content;
                                  }
                                  // If it's an array of actions, use the content from the first one
                                  else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].content) {
                                    displayContent = parsed[0].content;
                                  }
                                  // If parsing succeeds but no content field, use original string
                                  else {
                                    displayContent = action.content;
                                  }
                                }
                              } catch (e) {
                                // If parsing fails, use the content as is
                                displayContent = action.content;
                              }
                            }
                            // If content is an object with a content field
                            else if (typeof action.content === 'object' && action.content !== null) {
                              const contentObj = action.content as any;
                              if (contentObj.content) {
                                displayContent = contentObj.content;
                              } else {
                                // If it's an object but no content field, convert to string
                                displayContent = typeof action.content === 'string' ? action.content : JSON.stringify(action.content);
                              }
                            }
                            
                            return (
                              <div key={action.id} className="p-4 bg-gradient-to-r from-gray-50/50 to-white hover:from-gray-50/80 hover:to-white transition-all duration-200">
                                <div className="text-xs text-gray-600 mb-2 flex justify-between items-center">
                                  <span className="font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">{action.agent_name || 'נציג'}</span>
                                  <span className="text-gray-500">{formatDate(action.timestamp)}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{displayContent}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Add New Action */}
                      <div className="space-y-4">
                        <div className="relative">
                          <textarea
                            value={newAgentAction}
                            onChange={(e) => setNewAgentAction(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 resize-none text-sm transition-all duration-300 bg-gradient-to-br from-gray-50/50 to-white backdrop-blur-sm shadow-sm focus:shadow-lg"
                            placeholder="הוסף פעולה חדשה שביצעת לפתרון הבעיה..."
                          />
                          <div className="absolute top-2 left-2 opacity-20">
                            <PlusIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        <button
                          onClick={handleAddAgentAction}
                          disabled={savingActions || !newAgentAction.trim()}
                          data-add-action
                          className="flex items-center px-6 py-3 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none font-medium"
                        >
                          <PlusIcon className="h-4 w-4 ml-1" />
                          {savingActions ? 'מוסיף...' : 'הוסף פעולה'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Ticket Messages - מוצג גם בכרטיסי לקוח */}
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full ml-2"></div>
                        <ChatBubbleLeftRightIcon className="h-5 w-5 ml-1 text-indigo-600" />
                        הודעות בכרטיס
                      </h4>
                      
                      {currentTicket.conversation && currentTicket.conversation.length > 0 ? (
                        <div className="mb-4 max-h-60 overflow-y-auto border border-gray-200/50 rounded-xl p-4 bg-gradient-to-br from-gray-50/50 to-white backdrop-blur-sm shadow-sm">
                          <div className="space-y-3">
                            {currentTicket.conversation.map((message) => {
                              // בדיקה אם ההודעה נשלחה ללקוח
                              const isSentToCustomer = message.content.startsWith('[נשלח ללקוח]');
                              const messageContent = isSentToCustomer 
                                ? message.content.replace('[נשלח ללקוח]', '').trim() 
                                : message.content;
                                
                              return (
                                <div
                                  key={message.id}
                                  className={clsx(
                                    'flex items-end space-x-2 space-x-reverse',
                                    message.sender === 'customer' ? 'justify-start' : 'justify-end'
                                  )}
                                >
                                  {/* אייקון המציין את סוג השולח */}
                                  {message.sender === 'customer' && (
                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                                      <UserIcon className="h-4 w-4 text-gray-600" />
                                    </div>
                                  )}
                                  
                                  <div className="flex flex-col">
                                    {/* בועת הצ'אט */}
                                    <div
                                      className={clsx(
                                        'max-w-xs px-3 py-1.5 rounded-lg text-sm',
                                        message.sender === 'customer'
                                          ? 'bg-gray-100 text-gray-900 rounded-tr-lg rounded-bl-lg rounded-br-lg'
                                          : isSentToCustomer
                                            ? 'bg-green-600 text-white rounded-tl-lg rounded-bl-lg rounded-br-lg'
                                            : 'bg-blue-600 text-white rounded-tl-lg rounded-bl-lg rounded-tr-lg'
                                      )}
                                    >
                                      <p className="text-sm">{messageContent}</p>
                                      
                                      {/* סימון שההודעה נשלחה ללקוח */}
                                      {isSentToCustomer && (
                                        <div className="flex items-center mt-1">
                                          <EnvelopeIcon className="h-3 w-3 text-green-100 mr-1" />
                                          <span className="text-xs text-green-100">נשלח ללקוח</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* פרטי השולח והזמן */}
                                    <p className="text-xs mt-0.5 self-end text-gray-500">
                                      {message.sender_name} • {new Date(message.created_at).toLocaleTimeString('he-IL')}
                                    </p>
                                  </div>
                                  
                                  {/* אייקון המציין את סוג השולח */}
                                  {message.sender !== 'customer' && (
                                    <div className={clsx(
                                      "flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center",
                                      isSentToCustomer ? "bg-green-100" : "bg-blue-100"
                                    )}>
                                      {isSentToCustomer ? (
                                        <EnvelopeIcon className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">אין הודעות בכרטיס זה</p>
                      )}
                      
                      {/* תיבת הודעה מקוצרת */}
                      <div className="flex space-x-2 space-x-reverse">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="כתוב הודעה..."
                            className="w-full px-4 py-3 text-sm border-2 border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300 bg-gradient-to-r from-gray-50/50 to-white backdrop-blur-sm shadow-sm focus:shadow-lg"
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <div className="absolute top-3 left-3 opacity-20">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        <button
                          onClick={handleSendMessage}
                          disabled={loading || !newMessage.trim()}
                          className="px-4 py-3 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none font-medium"
                        >
                          <PaperAirplaneIcon className="h-4 w-4 ml-1" />
                          שלח
                        </button>
                      </div>
                    </div>
                  </div>

                 {/* Auto Solution */}
                 <div className="flex-shrink-0">
                   {/* כפתורים לחיפוש פתרונות - מוצגים תמיד */}
                   <div className="p-6 bg-gradient-to-br from-slate-50/50 via-gray-50/30 to-white border-b border-gray-200/30 backdrop-blur-sm relative overflow-hidden">
                     {/* Background pattern */}
                     <div className="absolute inset-0 opacity-[0.02]">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500 to-purple-500 rounded-full filter blur-3xl"></div>
                       <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full filter blur-3xl"></div>
                     </div>
                     <div className="space-y-4 relative z-10">
                       {/* כפתור לחיפוש במאגר ידע */}
                       <button
                         onClick={handleSearchKnowledgeBase}
                         disabled={searchingKnowledgeBase || solutionLoading}
                         className="group w-full p-4 text-sm bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none relative overflow-hidden"
                       >
                         <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                         {searchingKnowledgeBase ? (
                           <>
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                             <span>מחפש במאגר הידע...</span>
                           </>
                         ) : (
                           <>
                             <DocumentTextIcon className="h-5 w-5 ml-1 group-hover:scale-110 transition-transform duration-200 relative z-10" />
                             <span className="font-semibold relative z-10">חפש פתרון במאגר הידע</span>
                           </>
                         )}
                       </button>
                       
                       {/* כפתור לחיפוש בקריאות דומות */}
                       <button
                         onClick={handleSearchSimilarSolutions}
                         disabled={searchingSolutions || solutionLoading}
                         className="group w-full p-4 text-sm bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none relative overflow-hidden"
                       >
                         <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                         {searchingSolutions ? (
                           <>
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                             <span>מחפש בקריאות קודמות...</span>
                           </>
                         ) : (
                           <>
                             <ChartBarIcon className="h-5 w-5 ml-1 group-hover:scale-110 transition-transform duration-200 relative z-10" />
                             <span className="font-semibold relative z-10">חפש פתרון מקריאות דומות</span>
                           </>
                         )}
                       </button>
                       
                       {/* כפתור לרישום פתרון ידני */}
                       <button
                         onClick={() => {
                           setEditingSolution(true);
                           setAgentSolution('');
                         }}
                         className="group w-full p-4 text-sm bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:via-green-800 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl transform hover:-translate-y-1 relative overflow-hidden"
                       >
                         <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                         <PencilIcon className="h-5 w-5 ml-1 group-hover:scale-110 transition-transform duration-200 relative z-10" />
                         <span className="font-semibold relative z-10">רשום פתרון ידני</span>
                       </button>
                     </div>
                   </div>
                   
                   {(autoSolution || solutionLoading) && (
                     <div className="p-6 bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-white border-b border-purple-200/30 backdrop-blur-sm relative overflow-hidden">
                       {/* Background decoration */}
                       <div className="absolute inset-0 opacity-[0.03]">
                         <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full filter blur-2xl"></div>
                         <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-indigo-500 to-purple-500 rounded-full filter blur-2xl"></div>
                       </div>
                     <div className="flex justify-between items-center mb-4 relative z-10">
                       <h4 className="text-lg font-bold text-gray-900 flex items-center">
                         <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full ml-2"></div>
                         <SparklesIcon className="h-5 w-5 ml-1 text-purple-600" />
                         פתרון אוטומטי ממאגר הידע
                       </h4>
                       
                       {/* כפתור צמצום/הרחבה */}
                       {!solutionLoading && autoSolution && (
                         <button 
                           onClick={() => setShowAutoSolution((prev: boolean) => !prev)}
                           className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-white/70 transition-all duration-200 hover:scale-110"
                         >
                           {showAutoSolution ? (
                             <ChevronUpIcon className="h-5 w-5" />
                           ) : (
                             <ChevronDownIcon className="h-5 w-5" />
                           )}
                         </button>
                       )}
                     </div>
                     
                     {solutionLoading ? (
                       <div className="flex items-center space-x-3 space-x-reverse relative z-10">
                         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                         <span className="text-sm text-gray-600 font-medium">מחפש פתרון במאגר הידע...</span>
                       </div>
                     ) : autoSolution ? (
                       <div className="relative z-10">
                          {showAutoSolution && (
                            <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/50 border-2 border-purple-200/40 rounded-2xl p-6 mb-6 shadow-lg backdrop-blur-sm relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl"></div>
                              <div className="text-sm text-purple-800 prose prose-sm max-w-none whitespace-pre-wrap relative z-10 leading-relaxed">
                                {autoSolution}
                              </div>
                            </div>
                          )}
                          <div className="flex space-x-3 space-x-reverse">
                            <button
                              onClick={() => handleUseSuggestedReply(autoSolution.replace(/<[^>]*>/g, ''))}
                              className="flex-1 text-center p-4 text-sm bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                              <span className="relative z-10">השתמש בפתרון זה</span>
                             </button>
                             <button
                               onClick={() => {
                                 const plainText = autoSolution.replace(/<[^>]*>/g, '');
                                 navigator.clipboard.writeText(plainText);
                                 toast.success('הפתרון הועתק ללוח');
                               }}
                               className="px-5 py-4 text-sm text-purple-600 border-2 border-purple-200/70 rounded-xl hover:bg-purple-50/80 hover:border-purple-300 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 font-semibold backdrop-blur-sm"
                             >
                               העתק
                             </button>
                              <button
                                onClick={regenerateAutoSolution}
                                disabled={regeneratingSolution}
                                className="px-5 py-4 text-sm text-purple-600 border-2 border-purple-200/70 rounded-xl hover:bg-purple-50/80 hover:border-purple-300 transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:transform-none font-semibold backdrop-blur-sm"
                              >
                                {regeneratingSolution ? 'מייצר מחדש...' : 'ייצר מחדש'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSolution(true);
                                  setAgentSolution(autoSolution || '');
                                }}
                                className="px-5 py-4 text-sm text-green-600 border-2 border-green-200/70 rounded-xl hover:bg-green-50/80 hover:border-green-300 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 font-semibold backdrop-blur-sm"
                              >
                                <PencilIcon className="h-4 w-4 inline ml-1" />
                                ערוך
                              </button>
                           </div>
                        </div>
                      ) : null}
                      </div>
                    )}
                    
                    {/* עריכת פתרון על ידי הנציג */}
                    {editingSolution && (
                      <div className="p-6 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-white border-b border-green-200/30 backdrop-blur-sm relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute inset-0 opacity-[0.03]">
                          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-green-500 to-emerald-500 rounded-full filter blur-2xl"></div>
                          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-emerald-500 to-green-500 rounded-full filter blur-2xl"></div>
                        </div>
                        <div className="flex justify-between items-center mb-4 relative z-10">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center">
                            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full ml-2"></div>
                            <PencilIcon className="h-5 w-5 ml-1 text-green-600" />
                            רישום פתרון על ידי הנציג
                          </h4>
                        </div>
                        
                        <div className="mb-6 relative z-10">
                          <div className="relative">
                            <textarea
                              value={agentSolution}
                              onChange={(e) => setAgentSolution(e.target.value)}
                              placeholder="רשום כאן את הפתרון לבעיה..."
                              className="w-full p-5 border-2 border-gray-200/70 rounded-2xl text-sm text-right resize-none focus:ring-2 focus:ring-green-500 focus:border-green-300 transition-all duration-300 shadow-md focus:shadow-lg bg-gradient-to-br from-green-50/30 to-white backdrop-blur-sm"
                              rows={6}
                            />
                            <div className="absolute top-3 left-3 opacity-20">
                              <PencilIcon className="h-5 w-5 text-green-400" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 space-x-reverse relative z-10">
                          <button
                            onClick={handleSaveAgentSolution}
                            disabled={savingSolution || !agentSolution.trim()}
                            className="flex-1 p-4 text-sm bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:via-green-800 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none font-semibold relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                              {savingSolution ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  שומר...
                                </>
                              ) : (
                                'שמור פתרון'
                              )}
                            </div>
                          </button>
                          <button
                            onClick={() => setEditingSolution(false)}
                            className="px-6 py-4 text-sm text-gray-600 border-2 border-gray-300/70 rounded-xl hover:bg-gray-100/80 hover:border-gray-400 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 font-semibold backdrop-blur-sm"
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    )}
                 </div>

                  {/* Conversation */}
                  <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-gradient-to-br from-gray-50/30 to-white">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full ml-3"></div>
                      <ChatBubbleLeftRightIcon className="h-6 w-6 ml-2 text-indigo-600" />
                      שיחה
                    </h3>
                    
                    <div className="space-y-6">
                      {currentTicket.conversation.map((message) => {
                        // בדיקה אם ההודעה נשלחה ללקוח (על פי התחילית בתוכן)
                        const isSentToCustomer = message.content.startsWith('[נשלח ללקוח]');
                        const messageContent = isSentToCustomer 
                          ? message.content.replace('[נשלח ללקוח]', '').trim() 
                          : message.content;
                          
                        return (
                          <div
                            key={message.id}
                            className={clsx(
                              'flex items-end space-x-3 space-x-reverse',
                              message.sender === 'customer' ? 'justify-start' : 'justify-end'
                            )}
                          >
                            {/* אייקון המציין את סוג השולח */}
                            {message.sender === 'customer' && (
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
                                <UserIcon className="h-6 w-6 text-white" />
                              </div>
                            )}
                            
                            <div className="flex flex-col">
                              {/* בועת הצ'אט */}
                              <div
                                className={clsx(
                                  'max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-lg backdrop-blur-sm border',
                                  message.sender === 'customer'
                                    ? 'bg-gradient-to-br from-gray-100 to-gray-200/50 text-gray-900 border-gray-200/50 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl'
                                    : isSentToCustomer
                                      ? 'bg-gradient-to-br from-green-600 to-green-700 text-white border-green-500/30 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl'
                                      : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-500/30 rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl'
                                )}
                              >
                                <p className="text-sm leading-relaxed">{messageContent}</p>
                                
                                {/* סימון שההודעה נשלחה ללקוח */}
                                {isSentToCustomer && (
                                  <div className="flex items-center mt-2 px-2 py-1 bg-white/20 rounded-full">
                                    <EnvelopeIcon className="h-3 w-3 text-green-100 mr-1" />
                                    <span className="text-xs text-green-100 font-medium">נשלח ללקוח</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* פרטי השולח והזמן */}
                              <p className={clsx(
                                'text-xs mt-2 self-end font-medium px-2 py-1 rounded-full',
                                message.sender === 'customer' ? 'text-gray-500 bg-gray-100' : 'text-gray-500 bg-gray-100'
                              )}>
                                {message.sender_name} • {new Date(message.created_at).toLocaleTimeString('he-IL')}
                              </p>
                            </div>
                            
                            {/* אייקון המציין את סוג השולח */}
                            {message.sender !== 'customer' && (
                              <div className={clsx(
                                "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-lg",
                                isSentToCustomer ? "bg-gradient-to-br from-green-500 to-emerald-500" : "bg-gradient-to-br from-blue-500 to-indigo-500"
                              )}>
                                {isSentToCustomer ? (
                                  <EnvelopeIcon className="h-6 w-6 text-white" />
                                ) : (
                                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Message Input */}
                    <div className="mt-6 border-t border-gray-200/50 pt-6 sticky bottom-0 bg-gradient-to-t from-white via-white/95 to-white/80 backdrop-blur-sm">
                      <div className="flex flex-col space-y-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="כתוב תגובה..."
                            className="w-full px-6 py-4 border-2 border-gray-200/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300 shadow-lg focus:shadow-xl bg-gradient-to-r from-gray-50/50 to-white backdrop-blur-sm text-lg"
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={loading}
                          />
                          <div className="absolute top-4 left-4 opacity-20">
                            <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex space-x-3 space-x-reverse justify-end">
                          {/* כפתור לשליחת הודעה בשם הלקוח */}
                          <button
                            onClick={handleSendAsCustomer}
                            disabled={loading || !newMessage.trim()}
                            className="px-6 py-4 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-white rounded-xl hover:from-gray-400 hover:via-gray-500 hover:to-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none font-semibold relative overflow-hidden"
                            title="שלח הודעה בשם הלקוח"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                              {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <UserIcon className="h-5 w-5 ml-1" />
                                  שלח כלקוח
                                </>
                              )}
                            </div>
                          </button>
                          
                          {/* כפתור לשליחת הודעה ללקוח */}
                          <button
                            onClick={handleSendToCustomer}
                            disabled={loading || !newMessage.trim()}
                            className="px-6 py-4 bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:via-green-800 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none font-semibold relative overflow-hidden"
                            title="שלח הודעה ללקוח"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                              {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <EnvelopeIcon className="h-5 w-5 ml-1" />
                                  שלח ללקוח
                                </>
                              )}
                            </div>
                          </button>
                          
                          {/* כפתור לשליחת הודעה כנציג */}
                          <button
                            onClick={handleSendMessage}
                            disabled={loading || !newMessage.trim()}
                            className="px-6 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none font-semibold relative overflow-hidden"
                            title="שלח הודעה כנציג תמיכה"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                              {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <PaperAirplaneIcon className="h-5 w-5 ml-1" />
                                  שלח כנציג
                                </>
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Sidebar */}
                <div className="w-80 border-l border-gray-200/50 bg-gradient-to-b from-slate-50/80 via-gray-50/60 to-gray-100/40 overflow-y-auto flex-shrink-0 backdrop-blur-sm relative">
                  {/* Background decoration */}
                  <div className="absolute inset-0 opacity-[0.02]">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full filter blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-indigo-500 to-purple-500 rounded-full filter blur-3xl"></div>
                  </div>
                  <div className="p-6 relative z-10">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full ml-3"></div>
                      <SparklesIcon className="h-6 w-6 ml-2 text-purple-600" />
                      ניתוח בינה מלאכותית
                    </h3>

                    {/* AI Summary */}
                    <div className="mb-6 p-6 bg-gradient-to-br from-white/90 to-white/70 rounded-2xl border-2 border-gray-200/50 shadow-xl backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative z-10">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full ml-1"></div>
                        <DocumentTextIcon className="h-5 w-5 ml-1 text-blue-600" />
                        סיכום
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed relative z-10">
                        {currentTicket.ai_summary || 'הלקוח פנה בנושא ' + categoryLabels[currentTicket.category] + ' ברמת עדיפות ' + priorityLabels[currentTicket.priority] + '. הכרטיס נמצא כעת בסטטוס ' + statusLabels[currentTicket.status] + '.'}
                      </p>
                    </div>

                    {/* Sentiment Analysis */}
                    <div className="mb-6 p-6 bg-gradient-to-br from-white/90 to-white/70 rounded-2xl border-2 border-gray-200/50 shadow-xl backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-2xl"></div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative z-10">
                        <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-blue-500 rounded-full ml-1"></div>
                        <SentimentIcon className={clsx('h-5 w-5 ml-1', getSentimentColor(currentTicket.sentiment_score))} />
                        ניתוח סנטימנט
                      </h4>
                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 font-medium">רמה:</span>
                          <span className={clsx('text-sm font-semibold', getSentimentColor(currentTicket.sentiment_score))}>
                            {getSentimentLabel(currentTicket.sentiment_score)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div 
                            className={clsx(
                              'h-3 rounded-full transition-all duration-500 shadow-lg',
                              currentTicket.sentiment_score > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                            )}
                            style={{ width: `${Math.abs(currentTicket.sentiment_score) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-full inline-block">
                          ציון: {currentTicket.sentiment_score.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="mb-6 p-6 bg-gradient-to-br from-white/90 to-white/70 rounded-2xl border-2 border-gray-200/50 shadow-xl backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-2xl"></div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative z-10">
                        <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-red-500 rounded-full ml-1"></div>
                        <ExclamationTriangleIcon className={clsx(
                          'h-5 w-5 ml-1',
                          currentTicket.risk_level === 'high' ? 'text-red-500' :
                          currentTicket.risk_level === 'medium' ? 'text-orange-500' : 'text-green-500'
                        )} />
                        הערכת סיכונים
                      </h4>
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-sm text-gray-600 font-medium">רמת סיכון:</span>
                        <span className={clsx(
                          'text-sm font-semibold px-3 py-2 rounded-full shadow-sm',
                          currentTicket.risk_level === 'high' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' :
                          currentTicket.risk_level === 'medium' ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800' :
                          'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                        )}>
                          {riskLabels[currentTicket.risk_level]}
                        </span>
                      </div>
                    </div>

                    {/* Category & Priority */}
                    <div className="mb-6 p-6 bg-gradient-to-br from-white/90 to-white/70 rounded-2xl border-2 border-gray-200/50 shadow-xl backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-2xl"></div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 relative z-10 flex items-center">
                        <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full ml-1"></div>
                        סיווג
                      </h4>
                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 font-medium">קטגוריה:</span>
                          <span className="text-sm font-semibold px-3 py-1 bg-gray-100 rounded-full">{categoryLabels[currentTicket.category]}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 font-medium">עדיפות:</span>
                          <span className={clsx('text-sm font-semibold px-3 py-2 rounded-full shadow-sm', priorityColors[currentTicket.priority])}>
                            {priorityLabels[currentTicket.priority]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Suggested Replies */}
                    {suggestedReplies.length > 0 && (
                      <div className="p-6 bg-gradient-to-br from-white/90 to-white/70 rounded-2xl border-2 border-gray-200/50 shadow-xl backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl"></div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative z-10">
                          <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full ml-1"></div>
                          <ChatBubbleLeftRightIcon className="h-5 w-5 ml-1 text-blue-600" />
                          תגובות מוצעות
                        </h4>
                        <div className="space-y-3 max-h-40 overflow-y-auto relative z-10">
                          {suggestedReplies.map((reply, index) => (
                            <div key={index} className="flex space-x-2 space-x-reverse">
                              <button
                                onClick={() => handleUseSuggestedReply(reply)}
                                className="flex-1 text-right p-3 text-xs bg-gradient-to-r from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 rounded-xl border border-blue-200/50 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                              >
                                <span className="font-medium">{reply.length > 80 ? reply.substring(0, 80) + '...' : reply}</span>
                                <PaperAirplaneIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              </button>
                              <button
                                onClick={() => {
                                  setNewMessage(reply);
                                  toast.success('הפתרון הועתק לתיבת ההודעה');
                                }}
                                className="p-3 text-xs bg-gradient-to-r from-gray-100 to-gray-200/50 hover:from-gray-200 hover:to-gray-300/50 rounded-xl border border-gray-200/50 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                                title="העתק לתיבת ההודעה"
                              >
                                <ClipboardDocumentIcon className="h-4 w-4 text-gray-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}