import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowPathIcon, 
  ChatBubbleLeftRightIcon, 
  CheckBadgeIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon, 
  InboxIcon,
  PaperAirplaneIcon, 
  PencilSquareIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  TagIcon 
} from '@heroicons/react/24/outline';
import { ticketService } from '../services/ticketService';
import { Ticket, Message } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function CustomerTicketView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  
  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) {
        setError('מזהה כרטיס חסר');
        setLoading(false);
        return;
      }
      
      try {
        // קבלת הכרטיס לפי המזהה שלו
        const ticketData = await ticketService.getTicket(id);
        
        if (!ticketData) {
          setError('הכרטיס לא נמצא או שאין לך הרשאות לצפות בו');
        } else {
          setTicket(ticketData);
          
          // סימון הודעות נציג כנקראות כאשר הלקוח צופה בכרטיס
          if (ticketData.has_unread_agent_messages) {
            try {
              console.log('Marking agent messages as read for ticket:', ticketData.id);
              await ticketService.markAgentMessagesAsRead(ticketData.id);
              // עדכון הכרטיס המקומי
              setTicket(prev => prev ? {...prev, has_unread_agent_messages: false} : null);
            } catch (error) {
              console.error('Failed to mark agent messages as read:', error);
              // נעדכן את המצב המקומי גם אם העדכון בשרת נכשל
              setTicket(prev => prev ? {...prev, has_unread_agent_messages: false} : null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch ticket:', err);
        setError('אירעה שגיאה בטעינת הכרטיס');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
    
    // הגדרת realtime subscription להודעות חדשות ועדכוני כרטיס
    let subscription: any = null;
    
    if (isSupabaseConfigured && supabase && id) {
      subscription = supabase
        .channel(`ticket-${id}`)
        // subscription להודעות חדשות
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `ticket_id=eq.${id}`
          },
          async (payload) => {
            console.log('New message received via realtime:', payload.new);
            
            // עדכון הכרטיס עם ההודעה החדשה
            try {
              const updatedTicket = await ticketService.getTicket(id);
              if (updatedTicket) {
                setTicket(updatedTicket);
                
                // אם זו הודעה מנציג, נסמן אותה כנקראה
                if (payload.new.sender === 'agent') {
                  setTimeout(async () => {
                    try {
                      await ticketService.markAgentMessagesAsRead(id);
                      setTicket(prev => prev ? {...prev, has_unread_agent_messages: false} : null);
                    } catch (error) {
                      console.error('Failed to mark agent message as read:', error);
                    }
                  }, 1000); // המתנה של שנייה כדי לוודא שההודעה נשמרה
                }
              }
            } catch (error) {
              console.error('Failed to refresh ticket after new message:', error);
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
            console.log('Ticket updated via realtime:', payload.new);
            
            // עדכון הכרטיס עם הנתונים החדשים
            try {
              const updatedTicket = await ticketService.getTicket(id);
              if (updatedTicket) {
                setTicket(updatedTicket);
              }
            } catch (error) {
              console.error('Failed to refresh ticket after update:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
            console.log('Realtime subscription connected for ticket:', id);
          } else if (status === 'CLOSED') {
            setIsRealtimeConnected(false);
            console.log('Realtime subscription closed for ticket:', id);
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
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !ticket?.id) return;
    
    try {
      setSendingMessage(true);
      
      // שליחת הודעה חדשה מהלקוח
      await ticketService.addMessage(ticket.id, {
        content: newMessage,
        sender: 'customer',
        sender_name: ticket.customer_name || 'לקוח'
      });
      
      // רענון הכרטיס כדי לקבל את ההודעה החדשה
      const updatedTicket = await ticketService.getTicket(ticket.id);
      if (updatedTicket) {
        setTicket(updatedTicket);
      }
      
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('אירעה שגיאה בשליחת ההודעה');
    } finally {
      setSendingMessage(false);
    }
  };
  
  // פונקציה לעיבוד קישורים בהודעות והפיכתם ללחיצים
  const processMessageContent = (content: string) => {
    // Regular expression לזיהוי URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // חלוקת התוכן לחלקים עם ובלי קישורים
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      // אם החלק הוא URL, הפוך אותו לקישור לחיץ
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {part}
          </a>
        );
      }
      // אחרת, החזר את הטקסט כמו שהוא
      return part;
    });
  };
  
  // תרגום סטטוס מאנגלית לעברית עבור הלקוח
  const translateStatus = (status: string) => {
    switch (status) {
      case 'open':
        return 'פתוח';
      case 'in_progress':
        return 'בטיפול';
      case 'pending':
        return 'ממתין לתגובה';
      case 'resolved':
        return 'נפתר';
      case 'closed':
        return 'סגור';
      default:
        return status; // אם לא מכירים את הסטטוס, תחזיר כמו שזה
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'פתוח':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'בטיפול':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ממתין לתגובה':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'נפתר':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'סגור':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center space-y-6 p-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-20"></div>
            <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin relative z-10" />
          </div>
          <span className="text-slate-700 font-semibold text-lg">טוען את פרטי הכרטיס...</span>
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-sm text-slate-500">
            אנא המתן...
          </motion.div>
        </motion.div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8 rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-10 border border-white/20">
          <div className="flex items-center justify-center text-red-500 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full blur-xl opacity-20"></div>
              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-full relative z-10">
                <ExclamationTriangleIcon className="h-16 w-16 text-red-500" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">שגיאה</h2>
          <p className="text-center text-slate-600 mb-10 text-lg leading-relaxed">{error}</p>
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/customer')}
              className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              חזרה לדף הראשי
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8 rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-10 border border-white/20">
          <div className="flex items-center justify-center text-amber-500 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-xl opacity-20"></div>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-full relative z-10">
                <ExclamationTriangleIcon className="h-16 w-16 text-amber-500" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">כרטיס לא נמצא</h2>
          <p className="text-center text-slate-600 mb-10 text-lg leading-relaxed">לא ניתן למצוא את הכרטיס המבוקש</p>
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/customer')}
              className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              חזרה לדף הראשי
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 sm:py-12 px-2 sm:px-4 lg:px-8 rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/30">
        {/* כותרת הכרטיס */}
        <div className="px-4 py-6 sm:px-8 sm:py-8 bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-50 border-b border-blue-200/50">
          <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-col sm:flex-row w-full sm:w-auto">
              <h3 className="text-lg sm:text-2xl leading-tight font-bold text-slate-800 break-words">
                {ticket?.title}
              </h3>
              {/* אינדיקטור חיבור זמן אמת */}
              <div className="flex items-center gap-1 sm:gap-2">
                <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-gray-400'} ${isRealtimeConnected ? 'animate-pulse' : ''}`}></div>
                <span className={`text-xs font-medium ${isRealtimeConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {isRealtimeConnected ? 'מחובר לזמן אמת' : 'לא מחובר'}
                </span>
              </div>
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-md ${getStatusColor(translateStatus(ticket?.status || ''))}`}>
              {translateStatus(ticket?.status || '')}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 flex items-center">
            <CheckBadgeIcon className="h-5 w-5 ml-2 text-blue-500" /> מספר כרטיס: {ticket?.id}
          </p>
        </div>
        
        {/* תוכן הכרטיס */}
        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-4 sm:p-6 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <h5 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 pb-2 border-b border-blue-100">סטטוס ותאריכים</h5>
              <div className="flex items-center text-sm text-slate-700 mb-3">
                <ClockIcon className="h-5 w-5 text-blue-600 ml-3" />
                <span className="font-semibold">נפתח ב:</span> <span className="mr-2">{ticket?.created_at ? formatDate(ticket.created_at) : '-'}</span>
              </div>
              {ticket?.updated_at && (
                <div className="flex items-center text-sm text-slate-700">
                  <ArrowPathIcon className="h-5 w-5 text-blue-600 ml-3" />
                  <span className="font-semibold">עדכון אחרון:</span> <span className="mr-2">{formatDate(ticket.updated_at)}</span>
                </div>
              )}
            </div>
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50 p-4 sm:p-6 rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <h5 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 pb-2 border-b border-indigo-100">פרטי הפנייה</h5>
              <div className="flex items-center text-sm text-slate-700 mb-3">
                <TagIcon className="h-5 w-5 text-indigo-600 ml-3" />
                <span className="font-semibold">קטגוריה:</span> <span className="mr-2">{ticket?.category || '-'}</span>
              </div>
              {ticket?.company_name && (
                <div className="flex items-center text-sm text-slate-700">
                  <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 ml-3" />
                  <span className="font-semibold">חברה:</span> <span className="mr-2">{ticket.company_name}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8">
            <h4 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4 flex items-center bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 ml-2 sm:ml-3 text-blue-600" />
              תיאור הפנייה:
            </h4>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-2xl text-slate-700 whitespace-pre-wrap border border-blue-200/50 shadow-lg leading-relaxed hover:shadow-xl transition-all duration-300 text-sm sm:text-base">
              {ticket?.description || 'אין תיאור'}
            </div>
          </div>
        </div>
        
        {/* שיחה */}
        <div className="mt-8 sm:mt-12 border-t border-slate-200/50 pt-6 sm:pt-10 px-4 sm:px-8">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <ChatBubbleLeftRightIcon className="h-6 w-6 sm:h-7 sm:w-7 ml-2 sm:ml-3 text-blue-600" />
            שיחה
          </h3>
          
          <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6 max-h-[400px] sm:max-h-[450px] overflow-y-auto p-3 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-50/50 to-white/50 border border-slate-100 shadow-inner">
            {ticket.conversation && ticket.conversation.length > 0 ? (
              ticket.conversation.map((message: Message, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`flex ${message.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`rounded-2xl px-3 py-3 sm:px-6 sm:py-4 max-w-[90%] sm:max-w-[85%] shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 ${
                      message.sender === 'customer' 
                        ? 'bg-gradient-to-r from-blue-100 to-indigo-50 text-blue-900 border border-blue-200/50' 
                        : message.sender === 'system'
                          ? 'bg-gradient-to-r from-slate-100 to-gray-50 text-slate-800 border border-slate-200/50'
                          : 'bg-gradient-to-r from-emerald-100 to-green-50 text-green-900 border border-green-200/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2 border-b border-slate-200/50 pb-1">
                      <span className="font-bold">
                        {message.sender_name || (message.sender === 'customer' ? 'אתה' : 'נציג תמיכה')}
                      </span>
                      <span className="mr-3">{formatDate(message.created_at)}</span>
                    </div>
                    <div className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                      {message.sender === 'agent' ? 
                        (() => {
                          let contentToProcess = '';
                          
                          // Check if content is a string that might be JSON
                          if (typeof message.content === 'string' && 
                              (message.content.startsWith('{') || message.content.startsWith('['))) {
                            try {
                              const parsed = JSON.parse(message.content);
                              
                              // Handle object with content field
                              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.content) {
                                contentToProcess = parsed.content;
                              }
                              // Handle array of actions
                              else if (Array.isArray(parsed) && parsed.length > 0) {
                                if (parsed[0].content) {
                                  contentToProcess = parsed[0].content;
                                } else {
                                  contentToProcess = message.content;
                                }
                              } else {
                                contentToProcess = message.content;
                              }
                            } catch (e) {
                              // If parsing fails, use the content as is
                              contentToProcess = message.content;
                            }
                          }
                          // If content is already an object with a content field
                          else if (typeof message.content === 'object' && message.content !== null) {
                            const content = message.content as any;
                            if (content.content) {
                              contentToProcess = content.content;
                            } else {
                              contentToProcess = String(message.content);
                            }
                          } else {
                            // Default case: use the content as is
                            contentToProcess = String(message.content);
                          }
                          
                          // עיבוד קישורים בתוכן
                          return processMessageContent(contentToProcess);
                        })() : 
                        // עבור הודעות לקוח גם עם עיבוד קישורים
                        processMessageContent(String(message.content))
                      }
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 bg-gradient-to-r from-slate-100 to-gray-50 rounded-2xl border border-slate-200/50 shadow-lg">
                <InboxIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p>אין הודעות בשיחה זו עדיין</p>
                <p className="text-xs mt-2 text-slate-400">הודעות חדשות יופיעו כאן</p>
              </div>
            )}
            {ticket.status !== 'closed' && (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onSubmit={handleSendMessage} 
                className="mt-6 sm:mt-10 p-4 sm:p-6 bg-gradient-to-r from-white to-blue-50 rounded-2xl border border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="text-base sm:text-lg font-semibold text-slate-700 mb-3 sm:mb-4 flex items-center">
                  <PencilSquareIcon className="h-4 w-4 sm:h-5 sm:w-5 ml-2 text-blue-600" />
                  הוסף הודעה חדשה
                </h4>
                {/* Layout מותאם למובייל */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-grow">
                    <textarea
                      rows={4}
                      name="message"
                      id="message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="shadow-lg block w-full focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm border border-slate-300 rounded-xl p-4 bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl min-h-[120px] resize-none"
                      placeholder="הקלד הודעה..."
                      disabled={sendingMessage}
                      style={{
                        fontSize: '16px', // מונע זום בנייד iOS
                        lineHeight: '1.5'
                      }}
                    />
                  </div>
                  <div className="flex-shrink-0 sm:self-end">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 sm:px-8 sm:py-3 border border-transparent text-base sm:text-sm font-semibold rounded-xl shadow-lg text-white transition-all duration-200 ${
                        sendingMessage || !newMessage.trim()
                          ? 'bg-blue-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-xl'
                      }`}
                    >
                      {sendingMessage ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-5 w-5 ml-2" />
                          שלח הודעה
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.form>
            )}
          </div>
          
          {/* כפתור חזרה */}
          <div className="px-8 py-8 sm:px-10 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-slate-200/50 mt-8">
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/customer')}
                className="inline-flex items-center px-8 py-3 border border-slate-300 shadow-lg text-sm font-semibold rounded-xl text-slate-700 bg-white/90 backdrop-blur-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-xl"
              >
                <ArrowLeftIcon className="h-5 w-5 ml-2" />
                חזרה לדף הראשי
              </motion.button>
            </div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-xs text-slate-500 mt-6"
            >
              <p>OptiSupport &copy; {new Date().getFullYear()} - מערכת תמיכת לקוחות</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
