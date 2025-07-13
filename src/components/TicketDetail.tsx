import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { Ticket, Message } from '../types';
import {
  TicketIcon,
  ClockIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const ticketData = await ticketService.getTicket(id);
        setTicket(ticketData);
      } catch (error) {
        console.error('Failed to fetch ticket:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-5 w-5 ml-1" />
          חזרה
        </button>
        <div className="flex space-x-2 space-x-reverse">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
            {ticket.status === 'open' ? 'פתוח' :
             ticket.status === 'in_progress' ? 'בטיפול' : 'נפתר'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority === 'urgent' ? 'דחוף' :
             ticket.priority === 'high' ? 'גבוה' :
             ticket.priority === 'medium' ? 'בינוני' : 'נמוך'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <UserCircleIcon className="h-5 w-5 text-gray-400 ml-2" />
            <span className="text-gray-600">לקוח: </span>
            <span className="font-medium text-gray-900 mr-1">{ticket.customer_name}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-gray-400 ml-2" />
            <span className="text-gray-600">נפתח: </span>
            <span className="font-medium text-gray-900 mr-1">{formatDate(ticket.created_at)}</span>
          </div>
          {ticket.category && (
            <div className="flex items-center">
              <TicketIcon className="h-5 w-5 text-gray-400 ml-2" />
              <span className="text-gray-600">קטגוריה: </span>
              <span className="font-medium text-gray-900 mr-1">{ticket.category}</span>
            </div>
          )}
          {ticket.assigned_to && (
            <div className="flex items-center">
              <UserCircleIcon className="h-5 w-5 text-gray-400 ml-2" />
              <span className="text-gray-600">מטפל: </span>
              <span className="font-medium text-gray-900 mr-1">{ticket.assigned_to}</span>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">תיאור הבעיה</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        <div className="mt-8">
          <div className="flex items-center mb-4">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600 ml-2" />
            <h3 className="font-medium text-gray-900">שיחה</h3>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto p-2">
            {ticket.conversation && ticket.conversation.length > 0 ? (
              ticket.conversation.map((message: Message, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.sender === 'agent' 
                      ? 'bg-blue-50 border-blue-100 mr-8'
                      : 'bg-gray-50 border-gray-100 ml-8'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">
                      {message.sender_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700">{message.content}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">אין הודעות בשיחה זו</p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-2">הוסף תגובה</h3>
            <div className="flex">
              <textarea
                className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                placeholder="כתוב את תגובתך כאן..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleSendReply}
                disabled={!replyContent.trim() || sending}
                className={`inline-flex items-center px-4 py-2 rounded-md ${
                  !replyContent.trim() || sending
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {sending ? (
                  <span className="ml-2">שולח...</span>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 ml-2" />
                    שלח תגובה
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
