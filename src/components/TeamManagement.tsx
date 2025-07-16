import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { userActivityService } from '../services/userActivityService';
import { userService } from '../services/userService';

// מייבא את הקומפוננטות כייבוא ברירת מחדל
import UserList from './UserList';
import UserActivityLog from './UserActivityLog';

export const TeamManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activityStats, setActivityStats] = useState<Record<string, any>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchActivityStats();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const users = await userService.getAllUsers();
      setUsers(users);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const stats = await userActivityService.getUserActivityStats(30); // Get stats for last 30 days
      setActivityStats(stats);
    } catch (err: any) {
      console.error('Error fetching activity stats:', err);
    }
  };

  const handleAddUser = async (newUser: Omit<User, 'id' | 'created_at'>) => {
    try {
      // First create auth user if email/password provided
      let userId = '';
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
        return null;
      }
      
      if (newUser.email && (newUser as any).password) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: newUser.email,
          password: (newUser as any).password,
        });
        
        if (authError) throw new Error(authError.message);
        userId = authData.user?.id || '';
      } else {
        // Generate a random ID if not creating auth user
        userId = crypto.randomUUID();
      }
      
      // Then add to users table
      if (!supabase) {
        throw new Error('Supabase client not initialized');
        return null;
      }
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          is_active: newUser.is_active,
          avatar_url: newUser.avatar_url,
          permissions: newUser.permissions || {},
          created_at: new Date().toISOString()
        });
      
      if (error) throw new Error(error.message);
      
      // Log activity
      await userActivityService.logActivity({
        user_id: userId,
        action_type: 'ticket_created',
        action_details: { message: 'משתמש חדש נוסף למערכת' }
      });
      
      // Refresh user list
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding user:', err);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
        return;
      }
      
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw new Error(error.message);
      
      // Log activity
      await userActivityService.logActivity({
        user_id: userId,
        action_type: 'ticket_update',
        action_details: { message: 'פרטי משתמש עודכנו', updated_fields: Object.keys(updates) }
      });
      
      // Refresh user list
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating user:', err);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId === selectedUserId ? null : userId);
  };

  const handleSyncCurrentUser = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await userService.syncCurrentUser();
      
      if (result.success) {
        setSuccessMessage(result.message);
        if (result.syncedUser) {
          // רענן את רשימת המשתמשים אם נוסף משתמש חדש
          fetchUsers();
        }
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error syncing current user:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleSyncCurrentUser}
          disabled={isSyncing}
          className={`bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSyncing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              מסנכרן משתמש נוכחי...
            </>
          ) : (
            'הוסף אותי למערכת'
          )}
        </button>
        <h1 className="text-2xl font-bold text-right">ניהול צוות</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-right">
          <span>{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-right">
          <span>{successMessage}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-1">
          <UserList 
            users={users} 
            isLoading={isLoading} 
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onSelectUser={handleSelectUser}
            selectedUserId={selectedUserId}
          />
        </div>
        
        {/* User Activity */}
        <div className="lg:col-span-2">
          <UserActivityLog 
            userId={selectedUserId} 
            activityStats={activityStats}
          />
        </div>
      </div>
    </div>
  );
};
