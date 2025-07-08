import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClockIcon, 
  TagIcon, 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ticketService } from '../services/ticketService';
import { Ticket, Message } from '../types';

export function CustomerTicketView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
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
        }
      } catch (err) {
        console.error('Failed to fetch ticket:', err);
        setError('אירעה שגיאה בטעינת הכרטיס');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'פתוח':
        return 'bg-green-100 text-green-800';
      case 'בטיפול':
        return 'bg-blue-100 text-blue-800';
      case 'ממתין לתגובה':
        return 'bg-yellow-100 text-yellow-800';
      case 'סגור':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2 rtl">
          <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
          <span className="text-gray-700">טוען את פרטי הכרטיס...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 rtl">
        <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <ExclamationTriangleIcon className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">שגיאה</h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/customer')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              חזרה לדף הראשי
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 rtl">
        <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center text-yellow-500 mb-4">
            <ExclamationTriangleIcon className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">כרטיס לא נמצא</h2>
          <p className="text-center text-gray-600 mb-6">לא ניתן למצוא את הכרטיס המבוקש</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/customer')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              חזרה לדף הראשי
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">צפייה בקריאת שירות</h2>
          <p className="mt-2 text-gray-600">כאן תוכלו לעקוב אחר הפנייה שלכם ולתקשר עם נציגי התמיכה</p>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* כותרת הכרטיס */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {ticket.title}
              </h2>
              <div className="flex items-center mt-2 sm:mt-0">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-sm text-gray-500 flex items-center">
                  <ClockIcon className="h-4 w-4 ml-1" />
                  {formatDate(ticket.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          {/* פרטי הכרטיס */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <TagIcon className="h-4 w-4 ml-1" />
                  קטגוריה
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{ticket.category || 'לא צוין'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">עדיפות</dt>
                <dd className="mt-1 text-sm text-gray-900">{ticket.priority || 'רגילה'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">תיאור הפנייה</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</dd>
              </div>
            </dl>
          </div>
          
          {/* שיחה */}
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 ml-2" />
              שיחה
            </h3>
            
            <div className="mt-4 space-y-4 max-h-96 overflow-y-auto p-2">
              {ticket.conversation && ticket.conversation.length > 0 ? (
                ticket.conversation.map((message: Message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.sender === 'customer' 
                          ? 'bg-blue-50 text-blue-900' 
                          : message.sender === 'system'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-green-50 text-green-900'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {message.sender_name || (message.sender === 'customer' ? 'אתה' : 'נציג תמיכה')} • {formatDate(message.created_at)}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  אין הודעות בשיחה זו עדיין
                </div>
              )}
            </div>
            
            {/* טופס שליחת הודעה */}
            {ticket.status !== 'closed' && (
              <form onSubmit={handleSendMessage} className="mt-6">
                <div className="flex">
                  <div className="flex-grow">
                    <textarea
                      rows={3}
                      name="message"
                      id="message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md"
                      placeholder="הקלד הודעה..."
                      disabled={sendingMessage}
                    />
                  </div>
                  <div className="mr-3 flex-shrink-0">
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        sendingMessage || !newMessage.trim()
                          ? 'bg-blue-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                    >
                      {sendingMessage ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-5 w-5 ml-1" />
                          שלח
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
          
          {/* כפתור חזרה */}
          <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/customer')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                חזרה לדף הראשי
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
