import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { analyticsService, ClientTicketStats, AnalyticsFilters } from '../services/analyticsService';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface AnalyticsSummary {
  totalClients: number;
  highLoadClients: number;
  mediumLoadClients: number;
  lowLoadClients: number;
  avgHandlingTime: number;
  totalTickets: number;
}

export const Analytics: React.FC = () => {
  const [clientStats, setClientStats] = useState<ClientTicketStats[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    sortBy: 'avg_handling_time_minutes',
    sortOrder: 'desc',
    loadRating: 'all'
  });

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [statsData, summaryData] = await Promise.all([
        analyticsService.getClientTicketStats(filters),
        analyticsService.getAnalyticsSummary()
      ]);
      
      setClientStats(statsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLoadRatingBadge = (rating: string) => {
    const badges = {
      high: { color: 'bg-red-100 text-red-800', icon: '🟥', text: 'גבוה' },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: '🟨', text: 'בינוני' },
      low: { color: 'bg-green-100 text-green-800', icon: '🟩', text: 'רגוע' }
    };
    
    const badge = badges[rating as keyof typeof badges] || badges.low;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column as any,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return null;
    return filters.sortOrder === 'desc' ? 
      <ArrowDownIcon className="h-4 w-4" /> : 
      <ArrowUpIcon className="h-4 w-4" />;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}ש ${mins}ד`;
    }
    return `${mins}ד`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* כותרת */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <ChartBarIcon className="h-8 w-8 text-indigo-600 ml-3" />
          אנליטיקה - עומס שירות לקוחות
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          ניתוח מפורט של עומס הטיפול בלקוחות לפי קריאות סגורות
        </p>
      </div>

      {/* הנחיות דירוג עומס */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 ml-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <h3 className="font-medium text-blue-900 mb-2">הסבר דירוג עומס לקוחות:</h3>
            <div className="text-blue-800 space-y-1">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-2"></span>
                <strong>עומס גבוה 🟥:</strong> 4+ כרטיסים או ממוצע זמן טיפול מעל 4 שעות
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full ml-2"></span>
                <strong>עומס בינוני 🟨:</strong> 2-3 כרטיסים או ממוצע זמן טיפול 2-4 שעות
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full ml-2"></span>
                <strong>עומס רגוע 🟩:</strong> פחות מ-2 כרטיסים וממוצע זמן טיפול מתחת ל-2 שעות
              </div>
            </div>
            <p className="text-blue-700 mt-2 text-xs">
              * זמן הטיפול מחושב מרגע מעבר הכרטיס לסטטוס "בטיפול" ועד לפתרון
            </p>
          </div>
        </div>
      </div>

      {/* סיכום כללי */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      סך הכל לקוחות
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {summary.totalClients}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      עומס גבוה
                    </dt>
                    <dd className="text-lg font-medium text-red-600">
                      {summary.highLoadClients}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      ממוצע זמן טיפול
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatMinutes(summary.avgHandlingTime)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      סך הכל קריאות
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {summary.totalTickets}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* פילטרים */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-gray-400 ml-2" />
            <label className="text-sm font-medium text-gray-700">סינון לפי עומס:</label>
          </div>
          <select
            value={filters.loadRating}
            onChange={(e) => setFilters(prev => ({ ...prev, loadRating: e.target.value as any }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">הכל</option>
            <option value="high">עומס גבוה</option>
            <option value="medium">עומס בינוני</option>
            <option value="low">עומס רגוע</option>
          </select>
        </div>
      </div>

      {/* טבלת נתונים */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            פירוט עומס לקוחות
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            רשימת לקוחות ונתוני העומס שלהם מבוססת על קריאות סגורות
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('customer_name')}
                >
                  <div className="flex items-center justify-end">
                    שם לקוח
                    {getSortIcon('customer_name')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פרטי קשר
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total_tickets')}
                >
                  <div className="flex items-center justify-end">
                    כמות קריאות
                    {getSortIcon('total_tickets')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avg_handling_time_minutes')}
                >
                  <div className="flex items-center justify-end">
                    ממוצע זמן טיפול
                    {getSortIcon('avg_handling_time_minutes')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('last_closed_date')}
                >
                  <div className="flex items-center justify-end">
                    סגירה אחרונה
                    {getSortIcon('last_closed_date')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  דירוג עומס
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientStats.map((client, index) => (
                <tr key={client.customer_email} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.customer_name}
                    </div>
                    {client.company_name && (
                      <div className="text-sm text-gray-500">
                        {client.company_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {client.customer_email}
                    </div>
                    {client.customer_phone && (
                      <div className="text-sm text-gray-500">
                        {client.customer_phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {client.total_tickets}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.avg_handling_time_minutes > 240 ? 'bg-red-100 text-red-800' :
                      client.avg_handling_time_minutes > 120 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {formatMinutes(client.avg_handling_time_minutes)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(client.last_closed_date), 'dd/MM/yyyy', { locale: he })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getLoadRatingBadge(client.load_rating)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {clientStats.length === 0 && (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">אין נתונים</h3>
            <p className="mt-1 text-sm text-gray-500">
              לא נמצאו נתוני אנליטיקה לתצוגה
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
