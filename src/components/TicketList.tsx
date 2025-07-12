import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TicketIcon,
  FunnelIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { Ticket } from '../types';
import { ticketService } from '../services/ticketService';
import { isSupabaseConfigured } from '../lib/supabase';
import { NewTicketModal } from './NewTicketModal';
import { TicketDetailModal } from './TicketDetailModal';

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

const riskLabels = {
  low: 'נמוך',
  medium: 'בינוני',
  high: 'גבוה'
};

const SupabaseSetupBanner = () => {
  if (isSupabaseConfigured) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3 space-x-reverse">
        <ExclamationCircleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-amber-800 mb-1">
            מסד הנתונים לא מוגדר
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            כרגע אתה רואה נתונים לדוגמה. כדי להתחיל לעבוד עם נתונים אמיתיים, עליך להגדיר Supabase:
          </p>
          <ol className="text-sm text-amber-700 space-y-1 mr-4">
            <li>1. צור פרויקט חדש ב-<a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-800">Supabase</a></li>
            <li>2. העתק את ה-URL וה-API Key מהגדרות הפרויקט</li>
            <li>3. עדכן את הקובץ <code className="bg-amber-100 px-1 rounded">.env</code> עם הערכים האמיתיים</li>
            <li>4. הפעל מחדש את השרת</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

const TicketCard = ({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) => {
  const StatusIcon = statusIcons[ticket.status];
  const riskColor = ticket.risk_level === 'high' ? 'text-red-500' : 
                   ticket.risk_level === 'medium' ? 'text-orange-500' : 'text-green-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-2 bg-gray-50 rounded-lg">
            <TicketIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{ticket.title}</h3>
            <p className="text-sm text-gray-500">{ticket.customer_name} • {ticket.customer_email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          {ticket.ai_summary && (
            <div className="p-1 bg-purple-50 rounded text-purple-600" title="ניתוח בינה מלאכותית זמין">
              <SparklesIcon className="h-4 w-4" />
            </div>
          )}
          <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', priorityColors[ticket.priority])}>
            {priorityLabels[ticket.priority]}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ticket.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-1 space-x-reverse">
            <StatusIcon className="h-4 w-4 text-gray-400" />
            <span className={clsx('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', statusColors[ticket.status])}>
              {statusLabels[ticket.status]}
            </span>
          </div>
          <div className="flex items-center space-x-1 space-x-reverse">
            <div className={clsx('w-2 h-2 rounded-full', riskColor)} />
            <span className="text-xs text-gray-500">סיכון {riskLabels[ticket.risk_level]}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(ticket.created_at).toLocaleDateString('he-IL')}
        </div>
      </div>

      {ticket.tags && ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {ticket.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
            >
              {tag}
            </span>
          ))}
          {ticket.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{ticket.tags.length - 3} נוספים</span>
          )}
        </div>
      )}

      {ticket.sentiment_score !== 0 && (
        <div className="mt-3 flex items-center space-x-2 space-x-reverse">
          <div className="text-xs text-gray-500">סנטימנט:</div>
          <div className={clsx('w-full bg-gray-200 rounded-full h-1.5')}>
            <div 
              className={clsx(
                'h-1.5 rounded-full transition-all',
                ticket.sentiment_score > 0 ? 'bg-green-500' : 'bg-red-500'
              )}
              style={{ width: `${Math.abs(ticket.sentiment_score) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {ticket.sentiment_score > 0.3 ? 'חיובי' : 
             ticket.sentiment_score < -0.3 ? 'שלילי' : 'נייטרלי'}
          </span>
        </div>
      )}
    </motion.div>
  );
};

const FilterBar = ({ filters, onFilterChange }: {
  filters: any;
  onFilterChange: (filters: any) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2 space-x-reverse">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">מסננים:</span>
        </div>
        
        <select
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">כל הסטטוסים</option>
          <option value="open">פתוח</option>
          <option value="in_progress">בטיפול</option>
          <option value="resolved">נפתר</option>
          <option value="closed">סגור</option>
        </select>

        <select
          value={filters.priority || ''}
          onChange={(e) => onFilterChange({ ...filters, priority: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">כל העדיפויות</option>
          <option value="low">נמוך</option>
          <option value="medium">בינוני</option>
          <option value="high">גבוה</option>
          <option value="urgent">דחוף</option>
        </select>

        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">כל הקטגוריות</option>
          <option value="technical">טכני</option>
          <option value="billing">חיוב</option>
          <option value="general">כללי</option>
          <option value="feature_request">בקשת תכונה</option>
        </select>

        <div className="flex-1 min-w-0">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לפי כותרת, תיאור, שם, מייל, טלפון או שם עסק..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value || undefined })}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const ticketData = await ticketService.getTickets(filters);
      setTickets(ticketData);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      // Error is handled gracefully in the service, so we don't need to show an error here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const handleTicketClick = async (ticket: Ticket) => {
    try {
      // Fetch full ticket details including conversation
      const fullTicket = await ticketService.getTicket(ticket.id);
      if (fullTicket) {
        setSelectedTicket(fullTicket);
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      // Fallback to basic ticket data
      setSelectedTicket(ticket);
      setIsDetailModalOpen(true);
    }
  };

  const handleNewTicket = () => {
    setIsNewTicketModalOpen(true);
  };

  const handleTicketCreated = () => {
    fetchTickets(); // Refresh the ticket list
  };

  const handleTicketUpdated = () => {
    fetchTickets(); // Refresh the ticket list
    setIsDetailModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">כרטיסי תמיכה</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNewTicket}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
        >
          <PlusIcon className="h-4 w-4 ml-2" />
          כרטיס חדש
        </motion.button>
      </div>

      <SupabaseSetupBanner />

      <FilterBar filters={filters} onFilterChange={setFilters} />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => handleTicketClick(ticket)}
            />
          ))}
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="text-center py-12">
          <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">לא נמצאו כרטיסים</h3>
          <p className="text-gray-500 mb-4">נסה לשנות את המסננים או ליצור כרטיס חדש.</p>
          <button
            onClick={handleNewTicket}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusIcon className="h-4 w-4 ml-2" />
            צור כרטיס ראשון
          </button>
        </div>
      )}

      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />

      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onTicketUpdated={handleTicketUpdated}
      />
    </div>
  );
}