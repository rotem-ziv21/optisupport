import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TicketIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  SparklesIcon,
  FaceSmileIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { ticketService } from '../services/ticketService';
import { DashboardStats } from '../types';

const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  subtitle?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className="text-green-600 font-medium">{trend}</span>
        <span className="text-gray-500 mr-1">לעומת השבוע שעבר</span>
      </div>
    )}
  </motion.div>
);

const RecentTickets = ({ tickets }: { tickets: any[] }) => {
  const navigate = useNavigate();
  
  const handleTicketClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">כרטיסים אחרונים</h3>
      <div className="space-y-4">
        {tickets.length > 0 ? (
          tickets.map((ticket, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => handleTicketClick(ticket.id)}
              role="button"
              tabIndex={0}
              aria-label={`פתח כרטיס: ${ticket.title}`}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`p-2 rounded-lg ${
                  ticket.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  <TicketIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{ticket.title}</p>
                  <p className="text-sm text-gray-500">{ticket.customer_name || ticket.customer}</p>
                </div>
              </div>
              <div className="text-left">
                <p className={`text-xs font-medium px-2 py-1 rounded-full ${
                  ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                  ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {ticket.status === 'open' ? 'פתוח' :
                  ticket.status === 'in_progress' ? 'בטיפול' : 'נפתר'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{ticket.time || ticket.formatted_time || new Date(ticket.created_at).toLocaleString('he-IL')}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">אין כרטיסים אחרונים להצגה</p>
        )}
      </div>
    </motion.div>
  );
};

const AIInsights = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl shadow-sm p-6 text-white"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">תובנות בינה מלאכותית</h3>
      <SparklesIcon className="h-6 w-6" />
    </div>
    <div className="space-y-4">
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-sm font-medium mb-1">אופטימיזציה של תור עדיפויות</p>
        <p className="text-xs opacity-90">3 כרטיסים בעדיפות גבוהה דורשים טיפול מיידי</p>
      </div>
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-sm font-medium mb-1">ניתוח סנטימנט</p>
        <p className="text-xs opacity-90">שביעות רצון לקוחות עלתה ב-12% השבוע</p>
      </div>
      <div className="bg-white/10 rounded-lg p-3">
        <p className="text-sm font-medium mb-1">זמן תגובה</p>
        <p className="text-xs opacity-90">זמן תגובה ממוצע: 2.5 שעות</p>
      </div>
    </div>
  </motion.div>
);

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dashboardStats = await ticketService.getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentTickets = async () => {
      try {
        setTicketsLoading(true);
        // קבלת כל הכרטיסים ואז לקחת רק 5 הראשונים
        const allTickets = await ticketService.getTickets();
        console.log('All tickets fetched:', allTickets);
        
        // בדיקה אם יש כרטיסים שהוחזרו
        if (allTickets && allTickets.length > 0) {
          // לקיחת 5 הכרטיסים הראשונים בלבד
          const recentTickets = allTickets.slice(0, 5);
          console.log('Recent tickets to display:', recentTickets);
          setRecentTickets(recentTickets);
        } else {
          console.warn('No tickets returned from service, using fallback data');
          // אם אין כרטיסים, השתמש בנתונים מדגמיים
          setRecentTickets([
            { id: 'mock1', title: 'בעיות התחברות באפליקציה הנייד', customer_name: 'שרה יוחנן', status: 'open', priority: 'high', time: 'לפני שעתיים' },
            { id: 'mock2', title: 'אי התאמה בחיוב', customer_name: 'מיכאל כהן', status: 'in_progress', priority: 'medium', time: 'לפני 4 שעות' },
            { id: 'mock3', title: 'בקשת תכונה: מצב לילה', customer_name: 'אלכס ריברה', status: 'open', priority: 'low', time: 'לפני 6 שעות' },
            { id: 'mock4', title: 'איפוס סיסמה לא עובד', customer_name: 'ליסה פארק', status: 'resolved', priority: 'urgent', time: 'לפני יום' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch recent tickets:', error);
        // Fallback to mock data if API fails
        setRecentTickets([
          { id: 'mock1', title: 'בעיות התחברות באפליקציה הנייד', customer_name: 'שרה יוחנן', status: 'open', priority: 'high', time: 'לפני שעתיים' },
          { id: 'mock2', title: 'אי התאמה בחיוב', customer_name: 'מיכאל כהן', status: 'in_progress', priority: 'medium', time: 'לפני 4 שעות' },
          { id: 'mock3', title: 'בקשת תכונה: מצב לילה', customer_name: 'אלכס ריברה', status: 'open', priority: 'low', time: 'לפני 6 שעות' },
          { id: 'mock4', title: 'איפוס סיסמה לא עובד', customer_name: 'ליסה פארק', status: 'resolved', priority: 'urgent', time: 'לפני יום' },
        ]);
      } finally {
        setTicketsLoading(false);
      }
    };

    fetchStats();
    fetchRecentTickets();
  }, []);

  if (loading || ticketsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
        <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
          <BoltIcon className="h-4 w-4" />
          <span>תובנות מבוססות בינה מלאכותית</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="סך הכל כרטיסים"
          value={stats?.total_tickets || 0}
          icon={TicketIcon}
          color="bg-blue-500"
          trend="+12%"
        />
        <StatCard
          title="כרטיסים פתוחים"
          value={stats?.open_tickets || 0}
          icon={ClockIcon}
          color="bg-orange-500"
          trend="-8%"
        />
        <StatCard
          title="נפתרו היום"
          value={stats?.resolved_today || 0}
          icon={CheckCircleIcon}
          color="bg-green-500"
          trend="+24%"
        />
        <StatCard
          title="סיכון גבוה"
          value={stats?.high_risk_tickets || 0}
          icon={ExclamationTriangleIcon}
          color="bg-red-500"
          subtitle="דורשים תשומת לב"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="זמן תגובה ממוצע"
          value={`${stats?.avg_response_time || 0} שעות`}
          icon={ClockIcon}
          color="bg-purple-500"
          trend="-15%"
        />
        <StatCard
          title="ציון שביעות רצון"
          value={stats?.satisfaction_score || 0}
          icon={FaceSmileIcon}
          color="bg-indigo-500"
          subtitle="מתוך 5"
        />
        <StatCard
          title="דיוק בינה מלאכותית"
          value={`${Math.round((stats?.ai_accuracy || 0) * 100)}%`}
          icon={SparklesIcon}
          color="bg-cyan-500"
          trend="+3%"
        />
        <StatCard
          title="בטיפול"
          value={stats?.in_progress_tickets || 0}
          icon={ChartBarIcon}
          color="bg-yellow-500"
          subtitle="כרטיסים פעילים"
        />
      </div>

      {/* Recent Activity and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTickets tickets={recentTickets} />
        </div>
        <div>
          <AIInsights />
        </div>
      </div>
    </div>
  );
}