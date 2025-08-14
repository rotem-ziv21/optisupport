import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  Squares2X2Icon,
  Bars3Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  BoltIcon,
  CalendarDaysIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { Ticket } from '../types';
import { ticketService } from '../services/ticketService';
import { isSupabaseConfigured } from '../lib/supabase';
import { NewTicketModal } from './NewTicketModal';
import TagSelector from './TagSelector';

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
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
    >
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 ml-2" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">מצב הדגמה</h3>
          <p className="text-sm text-yellow-700 mt-1">
            המערכת פועלת במצב הדגמה עם נתונים מדומים. 
            להפעלת המערכת המלאה יש להגדיר את Supabase.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const TicketCard = ({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) => {
  const StatusIcon = statusIcons[ticket.status];

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
            <StatusIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
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
          <span className={clsx(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            priorityColors[ticket.priority]
          )}>
            {priorityLabels[ticket.priority]}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ticket.description}</p>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4 space-x-reverse">
          <span className={clsx(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            statusColors[ticket.status]
          )}>
            {statusLabels[ticket.status]}
          </span>
          <div className="flex items-center space-x-1 space-x-reverse">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              ticket.risk_level === 'high' ? 'bg-red-500' : 
              ticket.risk_level === 'medium' ? 'bg-orange-500' : 'bg-green-500'
            )} />
            <span className="text-xs text-gray-500">סיכון {riskLabels[ticket.risk_level]}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(ticket.created_at).toLocaleDateString('he-IL')}
        </div>
      </div>

      {ticket.tags && ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
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

      {ticket.sentiment_score !== undefined && (
        <div className="mt-3 flex items-center space-x-2 space-x-reverse">
          <span className="text-xs text-gray-500">סנטימנט:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-20">
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

// Table Component
const TicketTable = ({ tickets, onTicketClick, sortConfig, onSort }: {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}) => {
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-gray-600" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-gray-600" />
    );
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => onSort('id')} className="flex items-center gap-1 hover:text-gray-700">
                  <span>#</span>
                  {getSortIcon('id')}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => onSort('title')} className="flex items-center gap-1 hover:text-gray-700">
                  <span>כותרת</span>
                  {getSortIcon('title')}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => onSort('customer_name')} className="flex items-center gap-1 hover:text-gray-700">
                  <span>לקוח</span>
                  {getSortIcon('customer_name')}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => onSort('status')} className="flex items-center gap-1 hover:text-gray-700">
                  <span>סטטוס</span>
                  {getSortIcon('status')}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => onSort('priority')} className="flex items-center gap-1 hover:text-gray-700">
                  <span>עדיפות</span>
                  {getSortIcon('priority')}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תגיות
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => onSort('created_at')} className="flex items-center gap-1 hover:text-gray-700">
                  <span>תאריך</span>
                  {getSortIcon('created_at')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => onTicketClick(ticket)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ticket.ticket_number || ticket.id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs">
                    <div className="font-medium truncate">{ticket.title}</div>
                    <div className="text-gray-500 text-xs truncate mt-1">{ticket.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{ticket.customer_name}</div>
                    <div className="text-gray-500 text-xs">{ticket.customer_email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    statusColors[ticket.status]
                  )}>
                    {statusLabels[ticket.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    priorityColors[ticket.priority]
                  )}>
                    {priorityLabels[ticket.priority]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {ticket.tags && ticket.tags.length > 0 ? (
                      <>
                        {ticket.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {ticket.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{ticket.tags.length - 2}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(ticket.created_at).toLocaleDateString('he-IL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tickets.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            סה"כ <span className="font-medium">{tickets.length}</span> כרטיסים
          </div>
        </div>
      )}
    </div>
  );
};

const FilterBar = ({ filters, onFilterChange, viewMode, onViewModeChange, onClearFilters }: {
  filters: any;
  onFilterChange: (filters: any) => void;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  onClearFilters?: () => void;
}) => {
  // בדיקה אם יש פילטרים פעילים
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  );
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

        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="חיפוש לפי כותרת, תיאור, לקוח או מייל..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value || undefined })}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="min-w-0">
          <TagSelector
            selectedTags={filters.tags || []}
            onTagsChange={(tags) => onFilterChange({ ...filters, tags: tags.length > 0 ? tags : undefined })}
            placeholder="חפש תגיות..."
            className="min-w-[200px]"
          />
        </div>
        
        {/* Clear Filters Button */}
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title="נקה מסננים"
          >
            <XCircleIcon className="h-4 w-4 ml-1" />
            נקה הכל
          </button>
        )}
        
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-auto">
          <button
            onClick={() => onViewModeChange('cards')}
            className={clsx(
              'p-2 rounded-md transition-colors',
              viewMode === 'cards' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            )}
            title="תצוגת כרטיסים"
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={clsx(
              'p-2 rounded-md transition-colors',
              viewMode === 'table' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            )}
            title="תצוגת טבלה"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// פונקציות עזר לשמירה וטעינה של פילטרים
const FILTERS_STORAGE_KEY = 'ticketList_filters';
const VIEW_MODE_STORAGE_KEY = 'ticketList_viewMode';
const SORT_CONFIG_STORAGE_KEY = 'ticketList_sortConfig';

const loadFiltersFromStorage = () => {
  try {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error);
    return {};
  }
};

const saveFiltersToStorage = (filters: any) => {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.warn('Failed to save filters to localStorage:', error);
  }
};

const loadViewModeFromStorage = (): 'cards' | 'table' => {
  try {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return saved === 'table' ? 'table' : 'cards';
  } catch (error) {
    console.warn('Failed to load view mode from localStorage:', error);
    return 'cards';
  }
};

const saveViewModeToStorage = (viewMode: 'cards' | 'table') => {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  } catch (error) {
    console.warn('Failed to save view mode to localStorage:', error);
  }
};

const loadSortConfigFromStorage = () => {
  try {
    const saved = localStorage.getItem(SORT_CONFIG_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load sort config from localStorage:', error);
    return null;
  }
};

const saveSortConfigToStorage = (sortConfig: { key: string; direction: 'asc' | 'desc' } | null) => {
  try {
    if (sortConfig) {
      localStorage.setItem(SORT_CONFIG_STORAGE_KEY, JSON.stringify(sortConfig));
    } else {
      localStorage.removeItem(SORT_CONFIG_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to save sort config to localStorage:', error);
  }
};



export const TicketList: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => loadFiltersFromStorage());
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => loadViewModeFromStorage());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(() => loadSortConfigFromStorage());

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

  // שמירת פילטרים ב-localStorage כשהם משתנים
  useEffect(() => {
    saveFiltersToStorage(filters);
    fetchTickets();
  }, [filters]);

  // שמירת מצב תצוגה ב-localStorage כשהוא משתנה
  useEffect(() => {
    saveViewModeToStorage(viewMode);
  }, [viewMode]);

  // שמירת הגדרות מיון ב-localStorage כשהן משתנות
  useEffect(() => {
    saveSortConfigToStorage(sortConfig);
  }, [sortConfig]);

  const handleTicketClick = (ticket: Ticket) => {
    // נווט לדף הכרטיס המלא
    navigate(`/tickets/${ticket.id}`);
  };

  const handleNewTicket = () => {
    setIsNewTicketModalOpen(true);
  };

  const handleTicketCreated = () => {
    fetchTickets(); // Refresh the ticket list
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // פונקציה לזיהוי כרטיסים דחופים
  const getUrgentTickets = (tickets: Ticket[]) => {
    const now = new Date();
    return tickets.filter(ticket => {
      const createdAt = new Date(ticket.created_at);
      const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      // כרטיסים דחופים או בעדיפות גבוהה שלא טופלו
      if ((ticket.priority === 'urgent' || ticket.priority === 'high') && ticket.status === 'open') {
        return true;
      }

      // כרטיסים בטיפול יותר מ-24 שעות
      if (ticket.status === 'in_progress' && hoursOld > 24) {
        return true;
      }

      // כרטיסים ישנים שלא טופלו (יותר מ-48 שעות)
      if (ticket.status === 'open' && hoursOld > 48) {
        return true;
      }

      // כרטיסים עם סנטימנט שלילי חזק
      if (ticket.sentiment_score && ticket.sentiment_score < -0.5 && ticket.status !== 'resolved') {
        return true;
      }

      return false;
    });
  };

  // פילטר כרטיסים לפי הפילטרים הרגילים
  const filteredTickets = tickets.filter(ticket => {
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.priority && ticket.priority !== filters.priority) return false;
    if (filters.category && ticket.category !== filters.category) return false;
    if (filters.search && !ticket.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !ticket.description.toLowerCase().includes(filters.search.toLowerCase()) &&
        !ticket.customer_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.tags && filters.tags.length > 0 && 
        !filters.tags.some((tag: string) => ticket.tags?.includes(tag))) return false;
    return true;
  });

  // החלת פילטר דחוף אם מופעל
  const ticketsToShow = showUrgentOnly ? getUrgentTickets(filteredTickets) : filteredTickets;
  
  const sortedTickets = sortConfig
    ? [...ticketsToShow].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Ticket];
        const bValue = b[sortConfig.key as keyof Ticket];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      })
    : ticketsToShow;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">כרטיסי תמיכה</h1>
        <div className="flex items-center space-x-3 space-x-reverse">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUrgentOnly(!showUrgentOnly)}
            className={clsx(
              "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-sm",
              showUrgentOnly 
                ? "bg-red-700 text-white hover:bg-red-800 focus:ring-red-500" 
                : "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            )}
          >
            <BoltIcon className="h-4 w-4 ml-2" />
            {showUrgentOnly ? 'הצג הכל' : 'מה דחוף לי עכשיו?'}
          </motion.button>
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
      </div>

      <SupabaseSetupBanner />

      {showUrgentOnly && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 space-x-reverse">
            <BoltIcon className="h-5 w-5 text-red-600" />
            <h3 className="text-sm font-medium text-red-800">
              מציג רק כרטיסים דחופים ({getUrgentTickets(filteredTickets).length} מתוך {filteredTickets.length})
            </h3>
          </div>
          <p className="text-xs text-red-600 mt-1">
            כרטיסים בעדיפות גבוהה/דחופה, כרטיסים בטיפול יותר מ-24 שעות, כרטיסים ישנים ולקוחות כועסים
          </p>
        </div>
      )}

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onClearFilters={() => {
          setFilters(loadFiltersFromStorage());
          setSortConfig(null);
        }}
      />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => handleTicketClick(ticket)}
                />
              ))}
            </div>
          ) : (
            <TicketTable
              tickets={sortedTickets}
              onTicketClick={handleTicketClick}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}
        </div>
      )}

      {!loading && sortedTickets.length === 0 && (
        <div className="text-center py-12">
          <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">אין כרטיסים</h3>
          <p className="mt-1 text-sm text-gray-500">התחל עם יצירת כרטיס חדש.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleNewTicket}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              כרטיס חדש
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
