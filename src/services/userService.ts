import { supabase } from '../lib/supabase';
import { User } from '../types';

class UserService {
  /**
   * מחזיר את כל המשתמשים מטבלת users
   */
  async getAllUsers(): Promise<User[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }
      
      return data as User[];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  }

  /**
   * מסנכרן את המשתמש הנוכחי מה-Authentication לטבלת users
   * הפונקציה תיצור רשומה בטבלת users עבור המשתמש הנוכחי אם הוא לא קיים בטבלה
   */
  async syncCurrentUser(): Promise<{ success: boolean; message: string; syncedUser: User | null }> {
    if (!supabase) return { success: false, message: 'Supabase client not initialized', syncedUser: null };
    
    try {
      // 1. קבל את המשתמש הנוכחי מ-Auth
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error fetching current user:', authError);
        return { 
          success: false, 
          message: `שגיאה בקבלת המשתמש הנוכחי: ${authError.message}`, 
          syncedUser: null 
        };
      }
      
      if (!authData.user) {
        return {
          success: false,
          message: 'לא נמצא משתמש מחובר',
          syncedUser: null
        };
      }
      
      const currentUser = authData.user;
      
      // 2. בדוק אם המשתמש כבר קיים בטבלת users
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking if user exists:', checkError);
        return { 
          success: false, 
          message: `שגיאה בבדיקת קיום המשתמש: ${checkError.message}`, 
          syncedUser: null 
        };
      }
      
      // אם המשתמש כבר קיים, החזר אותו
      if (existingUser) {
        return {
          success: true,
          message: 'המשתמש כבר קיים במערכת',
          syncedUser: existingUser as User
        };
      }
      
      // 3. הוסף את המשתמש לטבלת users
      const newUser = {
        id: currentUser.id,
        email: currentUser.email || '',
        name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'משתמש חדש',
        role: 'agent', // תפקיד ברירת מחדל
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting user:', insertError);
        return { 
          success: false, 
          message: `שגיאה בהוספת המשתמש לטבלה: ${insertError.message}`, 
          syncedUser: null 
        };
      }
      
      return { 
        success: true, 
        message: 'המשתמש נוסף בהצלחה למערכת', 
        syncedUser: insertedUser as User 
      };
    } catch (error: any) {
      console.error('Failed to sync current user:', error);
      return { 
        success: false, 
        message: `שגיאה בסנכרון המשתמש: ${error.message}`, 
        syncedUser: null 
      };
    }
  }
  
  /**
   * מוסיף משתמש ידנית לטבלת users (ללא יצירה ב-Authentication)
   */
  async addUserToTable(userData: { 
    id: string;
    email: string; 
    name: string; 
    role: 'admin' | 'agent' | 'manager';
    is_active?: boolean;
  }): Promise<{ success: boolean; message: string; user?: User }> {
    if (!supabase) return { success: false, message: 'Supabase client not initialized' };
    
    try {
      // בדוק אם המשתמש כבר קיים
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userData.id)
        .single();
      
      if (existingUser) {
        return {
          success: false,
          message: 'משתמש עם מזהה זה כבר קיים במערכת'
        };
      }
      
      const newUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        created_at: new Date().toISOString()
      };
      
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      if (dbError) {
        throw new Error(dbError.message);
      }
      
      return { 
        success: true, 
        message: 'המשתמש נוסף בהצלחה לטבלה', 
        user: dbUser as User 
      };
    } catch (error: any) {
      console.error('Failed to add user to table:', error);
      return { 
        success: false, 
        message: `שגיאה בהוספת משתמש לטבלה: ${error.message}` 
      };
    }
  }

  /**
   * מוסיף משתמש חדש למערכת (גם ב-Authentication וגם בטבלת users)
   */
  async addUser(user: { 
    email: string; 
    password: string; 
    name: string; 
    role: 'admin' | 'agent' | 'manager';
    is_active?: boolean;
  }): Promise<{ success: boolean; message: string; user?: User }> {
    if (!supabase) return { success: false, message: 'Supabase client not initialized' };
    
    try {
      // 1. צור משתמש ב-Authentication
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            role: user.role
          }
        }
      });
      
      if (authError) {
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        throw new Error('לא נוצר משתמש ב-Authentication');
      }
      
      // 2. הוסף את המשתמש לטבלת users
      const newUser = {
        id: authData.user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active !== undefined ? user.is_active : true,
        created_at: new Date().toISOString()
      };
      
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      if (dbError) {
        // נסה למחוק את המשתמש שנוצר ב-Authentication
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(dbError.message);
      }
      
      return { 
        success: true, 
        message: 'המשתמש נוצר בהצלחה', 
        user: dbUser as User 
      };
    } catch (error: any) {
      console.error('Failed to add user:', error);
      return { 
        success: false, 
        message: `שגיאה ביצירת משתמש: ${error.message}` 
      };
    }
  }

  /**
   * עדכון פרטי משתמש
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; message: string }> {
    if (!supabase) return { success: false, message: 'Supabase client not initialized' };
    
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { 
        success: true, 
        message: 'פרטי המשתמש עודכנו בהצלחה' 
      };
    } catch (error: any) {
      console.error('Failed to update user:', error);
      return { 
        success: false, 
        message: `שגיאה בעדכון פרטי משתמש: ${error.message}` 
      };
    }
  }
}

export const userService = new UserService();
