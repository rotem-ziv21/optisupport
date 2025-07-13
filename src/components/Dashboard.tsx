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
  BoltIcon,
  ArrowPathIcon
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
    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-600 tracking-wide uppercase">{title}</p>
        <p className="text-3xl font-black text-gray-900 mt-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-4 rounded-2xl ${color} shadow-lg group-hover:scale-110 transition-transform duration-300 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <Icon className="h-7 w-7 text-white relative z-10" />
      </div>
    </div>
    {trend && (
      <div className="relative mt-5 flex items-center text-sm bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200/50">
        <span className="text-green-700 font-bold text-base">{trend}</span>
        <span className="text-gray-600 mr-2 font-medium">לעומת השבוע שעבר</span>
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
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
      <h3 className="relative text-xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">כרטיסים אחרונים</h3>
      <div className="relative space-y-4">
        {tickets.length > 0 ? (
          tickets.map((ticket, index) => (
            <div 
              key={index} 
              className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/80 to-gray-100/50 rounded-xl hover:from-blue-50/80 hover:to-indigo-50/50 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg border border-gray-200/30 backdrop-blur-sm"
              onClick={() => handleTicketClick(ticket.id)}
              role="button"
              tabIndex={0}
              aria-label={`פתח כרטיס: ${ticket.title}`}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                  ticket.priority === 'urgent' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' :
                  ticket.priority === 'high' ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' :
                  ticket.priority === 'medium' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white' :
                  'bg-gradient-to-br from-green-500 to-green-600 text-white'
                }`}>
                  <TicketIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{ticket.title}</p>
                  <p className="text-sm text-gray-600 font-medium">{ticket.customer_name || ticket.customer}</p>
                </div>
              </div>
              <div className="text-left">
                <p className={`text-xs font-bold px-3 py-2 rounded-full shadow-md ${
                  ticket.status === 'open' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                  ticket.status === 'in_progress' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' :
                  'bg-gradient-to-r from-green-500 to-green-600 text-white'
                }`}>
                  {ticket.status === 'open' ? 'פתוח' :
                  ticket.status === 'in_progress' ? 'בטיפול' : 'נפתר'}
                </p>
                <p className="text-xs text-gray-600 mt-2 font-medium">{ticket.time || ticket.formatted_time || new Date(ticket.created_at).toLocaleString('he-IL')}</p>
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

interface AIInsight {
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success' | 'urgent';
  icon?: React.ElementType;
}

const generateInsights = (stats: DashboardStats | null, tickets: any[]): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  if (!stats && tickets.length === 0) {
    return [
      {
        title: 'אין נתונים זמינים',
        description: 'טען נתונים לצורך יצירת תובנות',
        type: 'info'
      }
    ];
  }
  
  // Priority queue analysis
  if (stats?.high_risk_tickets !== undefined) {
    if (stats.high_risk_tickets > 0) {
      insights.push({
        title: 'אלרט עדיפות',
        description: `${stats.high_risk_tickets} כרטיסים בסיכון גבוה דורשים טיפול מיידי`,
        type: stats.high_risk_tickets > 5 ? 'urgent' : 'warning'
      });
    } else {
      insights.push({
        title: 'אין כרטיסי סיכון גבוה',
        description: 'כל הכרטיסים בסיכון גבוה נפתרו - עבודה מצוינת!',
        type: 'success'
      });
    }
  }
  
  // Resolution time analysis
  if (stats?.avg_response_time) {
    const resolutionTime = stats.avg_response_time;
    const timeDisplay = resolutionTime < 1 ? 
      `${Math.round(resolutionTime * 60)} דקות` : 
      resolutionTime < 24 ? 
        `${resolutionTime.toFixed(1)} שעות` : 
        `${(resolutionTime / 24).toFixed(1)} ימים`;
    
    if (resolutionTime > 48) { // מעל 48 שעות
      insights.push({
        title: 'זמן פתרון ארוך',
        description: `זמן פתרון ממוצע ${timeDisplay} - נדרש שיפור בתהליכים`,
        type: 'urgent'
      });
    } else if (resolutionTime > 24) { // מעל 24 שעות
      insights.push({
        title: 'זמן פתרון איטי',
        description: `זמן פתרון ממוצע ${timeDisplay} - מומלץ לסקור תהליכים`,
        type: 'warning'
      });
    } else if (resolutionTime <= 4) { // עד 4 שעות
      insights.push({
        title: 'זמן פתרון מצוין',
        description: `זמן פתרון ממוצע ${timeDisplay} - ביצוע מצוין של הצוות!`,
        type: 'success'
      });
    } else if (resolutionTime <= 8) { // 4-8 שעות
      insights.push({
        title: 'זמן פתרון סביר',
        description: `זמן פתרון ממוצע ${timeDisplay} - בטווח התעשייתי`,
        type: 'info'
      });
    }
  }
  
  // Satisfaction analysis
  if (stats?.satisfaction_score) {
    const satisfaction = stats.satisfaction_score;
    if (satisfaction < 3) {
      insights.push({
        title: 'שביעות רצון נמוכה',
        description: `ציון ${satisfaction.toFixed(1)}/5 - נדרש שיפור בשירות`,
        type: 'urgent'
      });
    } else if (satisfaction >= 4) {
      insights.push({
        title: 'שביעות רצון גבוהה',
        description: `ציון ${satisfaction.toFixed(1)}/5 - לקוחות מרוצים מהשירות`,
        type: 'success'
      });
    }
  }
  
  // Workload analysis
  if (stats?.open_tickets && stats?.in_progress_tickets) {
    const totalActive = stats.open_tickets + stats.in_progress_tickets;
    if (totalActive > 20) {
      insights.push({
        title: 'עומס עבודה גבוה',
        description: `${totalActive} כרטיסים פעילים - שקול העסקת נציגים נוספים`,
        type: 'warning'
      });
    }
  }
  
  // Ticket distribution analysis from recent tickets
  if (tickets.length > 0) {
    const urgentCount = tickets.filter(t => t.priority === 'urgent').length;
    const openCount = tickets.filter(t => t.status === 'open').length;
    
    if (urgentCount > 0) {
      insights.push({
        title: 'כרטיסים דחופים',
        description: `${urgentCount} כרטיסים דחופים ברשימה האחרונה`,
        type: 'urgent'
      });
    } else if (openCount > tickets.length * 0.7) {
      insights.push({
        title: 'רוב הכרטיסים פתוחים',
        description: `${openCount} מתוך ${tickets.length} כרטיסים עדיין פתוחים - שקול עדיפות`,
        type: 'warning'
      });
    }
  }
  
  // AI accuracy insight
  if (stats?.ai_accuracy) {
    const accuracy = stats.ai_accuracy * 100;
    if (accuracy < 70) {
      insights.push({
        title: 'דיוק AI נמוך',
        description: `דיוק ${accuracy.toFixed(0)}% - נדרש שיפור במודל`,
        type: 'warning'
      });
    } else if (accuracy >= 85) {
      insights.push({
        title: 'דיוק AI מצוין',
        description: `דיוק ${accuracy.toFixed(0)}% - המודל פועל בצורה מעולה`,
        type: 'success'
      });
    }
  }
  
  // Performance summary insight
  if (stats && insights.length === 0) {
    const resolvedToday = stats.resolved_today || 0;
    const openTickets = stats.open_tickets || 0;
    
    if (resolvedToday > 5) {
      insights.push({
        title: 'יום פרודוקטיבי',
        description: `נפתרו ${resolvedToday} כרטיסים היום - עבודה מצוינת של הצוות!`,
        type: 'success'
      });
    } else if (openTickets < 5) {
      insights.push({
        title: 'עומס עבודה נמוך',
        description: `רק ${openTickets} כרטיסים פתוחים - מצב יציב ושלט`,
        type: 'success'
      });
    } else {
      insights.push({
        title: 'מצב יציב',
        description: 'כל המצבים בטווח נרמלי - המשך עבודה טובה!',
        type: 'info'
      });
    }
  } else if (insights.length === 0) {
    insights.push({
      title: 'אין נתונים',
      description: 'טען נתונים לצורך יצירת תובנות משמעותיות',
      type: 'info'
    });
  }
  
  return insights.slice(0, 3); // Show max 3 insights
};

const AIInsights = ({ stats, tickets }: { stats: DashboardStats | null, tickets: any[] }) => {
  const insights = generateInsights(stats, tickets);
  
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-red-300 bg-red-50/10';
      case 'warning': return 'border-yellow-300 bg-yellow-50/10';
      case 'success': return 'border-green-300 bg-green-50/10';
      default: return 'border-blue-300 bg-blue-50/10';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 rounded-2xl shadow-2xl p-6 text-white relative overflow-hidden backdrop-blur-xl border border-white/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text">תובנות בינה מלאכותית</h3>
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <SparklesIcon className="h-6 w-6 text-yellow-200" />
        </div>
      </div>
      
      <div className="relative space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group ${getInsightColor(insight.type)}`}
          >
            <p className="text-sm font-bold mb-2 text-white group-hover:text-yellow-200 transition-colors">{insight.title}</p>
            <p className="text-xs opacity-90 font-medium">{insight.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // פונקציה לרענון ידני של הנתונים
  const refreshDashboard = () => {
    console.log('Refreshing dashboard data...');
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const dashboardStats = await ticketService.getDashboardStats();
        console.log('Dashboard stats updated:', dashboardStats);
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
  }, [refreshTrigger]); // רענון נתונים כאשר refreshTrigger משתנה

  // רענון אוטומטי כל 30 שניות
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing dashboard data...');
      setRefreshTrigger(prev => prev + 1);
    }, 30000); // 30 שניות

    return () => clearInterval(interval);
  }, []);

  if (loading || ticketsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-6 -m-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text">לוח בקרה</h1>
          <p className="text-gray-600 mt-2 font-medium">ניהול ומעקב כרטיסי תמיכה</p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={refreshDashboard}
            disabled={loading || ticketsLoading}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-300 shadow-md hover:shadow-lg"
            title="רענן נתונים"
          >
            <ArrowPathIcon className={`h-4 w-4 text-gray-600 ${(loading || ticketsLoading) ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700">רענן</span>
          </button>
          <div className="flex items-center space-x-3 space-x-reverse bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 rounded-2xl border border-blue-200/50 backdrop-blur-sm">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <BoltIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">תובנות מבוססות בינה מלאכותית</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          title="זמן פתרון ממוצע"
          value={stats?.avg_response_time ? (
            stats.avg_response_time < 1 ? 
              `${Math.round(stats.avg_response_time * 60)} דקות` : 
              stats.avg_response_time < 24 ? 
                `${stats.avg_response_time.toFixed(1)} שעות` : 
                `${(stats.avg_response_time / 24).toFixed(1)} ימים`
          ) : '0 שעות'}
          icon={ClockIcon}
          color="bg-purple-500"
          trend={stats?.avg_response_time && stats.avg_response_time < 4 ? "-15%" : stats?.avg_response_time && stats.avg_response_time > 8 ? "+25%" : ""}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentTickets tickets={recentTickets} />
        </div>
        <div>
          <AIInsights stats={stats} tickets={recentTickets} />
        </div>
      </div>
    </div>
  );
}