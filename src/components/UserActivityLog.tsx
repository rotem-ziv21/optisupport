import React, { useState, useEffect } from 'react';
import { UserActivityWithDetails } from '../types';
import { userActivityService } from '../services/userActivityService';
import { FiClock, FiMail, FiMessageSquare, FiCheckCircle, FiAlertCircle, FiLogIn, FiLogOut, FiEdit, FiPlus } from 'react-icons/fi';

interface UserActivityLogProps {
  userId: string | null;
  activityStats: Record<string, any>;
}

const UserActivityLog: React.FC<UserActivityLogProps> = ({ userId, activityStats }) => {
  const [activities, setActivities] = useState<UserActivityWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    if (userId) {
      fetchUserActivities();
    } else {
      fetchAllActivities();
    }
  }, [userId, page]);

  const fetchUserActivities = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await userActivityService.getUserActivitiesWithDetails(userId, limit, page * limit);
      
      if (data.length < limit) {
        setHasMore(false);
      }
      
      if (page === 0) {
        setActivities(data);
      } else {
        setActivities(prev => [...prev, ...data]);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllActivities = async () => {
    setIsLoading(true);
    try {
      const data = await userActivityService.getAllActivities(limit, page * limit);
      
      if (data.length < limit) {
        setHasMore(false);
      }
      
      if (page === 0) {
        setActivities(data);
      } else {
        setActivities(prev => [...prev, ...data]);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching all activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'ticket_update':
        return <FiEdit className="text-blue-500" />;
      case 'message_sent':
        return <FiMessageSquare className="text-green-500" />;
      case 'status_change':
        return <FiCheckCircle className="text-purple-500" />;
      case 'ticket_assigned':
        return <FiMail className="text-orange-500" />;
      case 'login':
        return <FiLogIn className="text-indigo-500" />;
      case 'logout':
        return <FiLogOut className="text-gray-500" />;
      case 'ticket_created':
        return <FiPlus className="text-green-500" />;
      case 'ticket_resolved':
        return <FiCheckCircle className="text-teal-500" />;
      default:
        return <FiAlertCircle className="text-gray-500" />;
    }
  };

  const formatActivityDetails = (activity: UserActivityWithDetails) => {
    const { action_type, action_details, ticket } = activity;
    
    switch (action_type) {
      case 'ticket_update':
        return `עדכן כרטיס ${ticket?.ticket_number || ''}: ${action_details.message || ''}`;
      case 'message_sent':
        return `שלח הודעה בכרטיס ${ticket?.ticket_number || ''}: ${action_details.message_preview || ''}`;
      case 'status_change':
        return `שינה סטטוס כרטיס ${ticket?.ticket_number || ''} ל-${action_details.new_status || ''}`;
      case 'ticket_assigned':
        return `שייך כרטיס ${ticket?.ticket_number || ''} ל${action_details.assigned_to_name || ''}`;
      case 'login':
        return `התחבר למערכת`;
      case 'logout':
        return `התנתק מהמערכת`;
      case 'ticket_created':
        return `יצר כרטיס חדש: ${ticket?.title || action_details.message || ''}`;
      case 'ticket_resolved':
        return `סגר כרטיס ${ticket?.ticket_number || ''} עם פתרון`;
      default:
        return action_details.message || 'פעולה לא ידועה';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `לפני ${diffMins} דקות`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `לפני ${hours} שעות`;
    } else {
      return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <div></div> {/* Empty div for flex spacing */}
        <h2 className="text-lg font-semibold">פעילות משתמשים</h2>
      </div>

      {/* Activity Stats */}
      {activityStats && Object.keys(activityStats).length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
          <h3 className="text-md font-semibold mb-3 text-right">סטטיסטיקת פעילות</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Activity by Type */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 text-right">פעילות לפי סוג</h4>
              <ul className="space-y-1">
                {activityStats.activity_by_type?.map((item: any) => (
                  <li key={item.action_type} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.count}</span>
                    <span>
                      {item.action_type === 'login' ? 'התחברויות' :
                         item.action_type === 'logout' ? 'התנתקויות' :
                         item.action_type === 'message_sent' ? 'הודעות שנשלחו' :
                         item.action_type === 'ticket_update' ? 'עדכוני כרטיסים' :
                         item.action_type === 'status_change' ? 'שינויי סטטוס' :
                         item.action_type === 'ticket_assigned' ? 'שיוכי כרטיסים' :
                         item.action_type === 'ticket_created' ? 'כרטיסים שנוצרו' :
                         item.action_type === 'ticket_resolved' ? 'כרטיסים שנפתרו' :
                         item.action_type}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Activity by User */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 text-right">פעילות לפי משתמש</h4>
              <ul className="space-y-1">
                {activityStats.activity_by_user?.map((item: any) => (
                  <li key={item.user_id} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.count}</span>
                    <span>{item.user_name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-lg font-semibold">{activityStats.total_activities || 0}</span>
            <span className="text-sm text-gray-600 mr-1">פעולות בסה"כ</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-right">
          <span>{error}</span>
        </div>
      )}

      {/* Activity List */}
      <div className="overflow-y-auto max-h-[500px]">
        {activities.length === 0 && !isLoading ? (
          <div className="text-center py-4 text-gray-500">
            לא נמצאו פעילויות
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {activities.map(activity => (
              <li key={activity.id} className="py-3 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center text-gray-500 text-sm">
                    <FiClock className="mr-1" />
                    <span>{formatDate(activity.created_at)}</span>
                  </div>
                  
                  <div className="text-right flex items-start">
                    <div className="mr-3">
                      <div className="font-medium text-gray-900">
                        {!userId && (
                          <span className="text-blue-600">{activity.user?.name}: </span>
                        )}
                        {formatActivityDetails(activity)}
                      </div>
                      
                      {activity.related_ticket_id && activity.ticket && (
                        <div className="text-sm text-gray-500 mt-1">
                          כרטיס: {activity.ticket.title}
                        </div>
                      )}
                      
                      {activity.ip_address && (
                        <div className="text-xs text-gray-400 mt-1">
                          IP: {activity.ip_address}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1">
                      {getActivityIcon(activity.action_type)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}
        
        {hasMore && activities.length > 0 && (
          <div className="text-center mt-4">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm"
            >
              טען עוד
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ייצוא ברירת מחדל לקומפוננטה
export default UserActivityLog;
