import { supabase } from '../lib/supabase';
import { User, UserActivity, UserActivityWithDetails } from '../types';

class UserActivityService {
  /**
   * תיעוד פעולת משתמש במערכת
   */
  async logActivity(activity: Omit<UserActivity, 'id' | 'created_at'>): Promise<UserActivity | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .insert({
          user_id: activity.user_id,
          action_type: activity.action_type,
          action_details: activity.action_details,
          related_ticket_id: activity.related_ticket_id,
          ip_address: activity.ip_address
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('Error logging user activity:', error);
        return null;
      }
      
      return data as UserActivity;
    } catch (error) {
      console.error('Failed to log user activity:', error);
      return null;
    }
  }

  /**
   * קבלת פעילויות משתמש לפי מזהה משתמש
   */
  async getUserActivities(userId: string, limit = 50, offset = 0): Promise<UserActivity[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('Error fetching user activities:', error);
        return [];
      }
      
      return data as UserActivity[];
    } catch (error) {
      console.error('Failed to fetch user activities:', error);
      return [];
    }
  }

  /**
   * קבלת פעילויות משתמש עם פרטי משתמש וכרטיס
   */
  async getUserActivitiesWithDetails(userId: string, limit = 50, offset = 0): Promise<UserActivityWithDetails[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          user:users(*),
          ticket:tickets(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('Error fetching user activities with details:', error);
        return [];
      }
      
      return data as unknown as UserActivityWithDetails[];
    } catch (error) {
      console.error('Failed to fetch user activities with details:', error);
      return [];
    }
  }

  /**
   * קבלת כל פעילויות המשתמשים במערכת
   */
  async getAllActivities(limit = 100, offset = 0): Promise<UserActivityWithDetails[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          user:users(*),
          ticket:tickets(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('Error fetching all activities:', error);
        return [];
      }
      
      return data as unknown as UserActivityWithDetails[];
    } catch (error) {
      console.error('Failed to fetch all activities:', error);
      return [];
    }
  }

  /**
   * קבלת פעילויות הקשורות לכרטיס מסוים
   */
  async getTicketActivities(ticketId: string): Promise<UserActivityWithDetails[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          user:users(*),
          ticket:tickets(*)
        `)
        .eq('related_ticket_id', ticketId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching ticket activities:', error);
        return [];
      }
      
      return data as unknown as UserActivityWithDetails[];
    } catch (error) {
      console.error('Failed to fetch ticket activities:', error);
      return [];
    }
  }

  /**
   * קבלת סטטיסטיקות פעילות משתמשים
   */
  async getUserActivityStats(days = 7): Promise<Record<string, any>> {
    if (!supabase) return {};
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    try {
      // Count activities by type
      const { data: activityTypes, error: typesError } = await supabase
        .from('user_activities')
        .select('action_type, count')
        .gte('created_at', startDate.toISOString())
        .group('action_type');
      
      // Count activities by user
      const { data: userActivities, error: userError } = await supabase
        .from('user_activities')
        .select('user_id, count')
        .gte('created_at', startDate.toISOString())
        .group('user_id');
      
      if (typesError || userError) {
        console.error('Error fetching activity stats:', typesError || userError);
        return {};
      }
      
      // Get user details for the active users
      const userIds = userActivities.map(item => item.user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);
      
      if (usersError) {
        console.error('Error fetching users for stats:', usersError);
        return {};
      }
      
      // Map user details to activity counts
      const userActivityStats = userActivities.map(activity => {
        const user = users.find(u => u.id === activity.user_id);
        return {
          user_id: activity.user_id,
          count: activity.count,
          user_name: user?.name || 'Unknown',
          user_email: user?.email || 'Unknown'
        };
      });
      
      return {
        activity_by_type: activityTypes,
        activity_by_user: userActivityStats,
        total_activities: userActivities.reduce((sum, item) => sum + parseInt(item.count), 0),
        period_days: days
      };
    } catch (error) {
      console.error('Failed to fetch user activity stats:', error);
      return {};
    }
  }
}

export const userActivityService = new UserActivityService();
