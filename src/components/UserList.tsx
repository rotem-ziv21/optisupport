import React, { useState } from 'react';
import { User } from '../types';
import { FiPlus, FiEdit2, FiX, FiUser, FiMail, FiLock, FiUserCheck } from 'react-icons/fi';

interface UserListProps {
  users: User[];
  isLoading: boolean;
  selectedUserId: string | null;
  onAddUser: (user: Omit<User, 'id' | 'created_at'>) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onSelectUser: (userId: string) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  isLoading,
  selectedUserId,
  onAddUser,
  onUpdateUser,
  onSelectUser
}) => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<any>({
    name: '',
    email: '',
    password: '',
    role: 'agent',
    is_active: true
  });

  const handleAddUser = () => {
    // Validate required fields
    if (!newUser.name || !newUser.email) {
      alert('שם ואימייל הם שדות חובה');
      return;
    }
    
    onAddUser(newUser);
    setIsAddingUser(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'agent',
      is_active: true
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewUser((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setNewUser((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleUserStatus = (user: User) => {
    onUpdateUser(user.id, { is_active: !user.is_active });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsAddingUser(!isAddingUser)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center text-sm"
        >
          {isAddingUser ? <FiX className="mr-1" /> : <FiPlus className="mr-1" />}
          {isAddingUser ? 'ביטול' : 'הוספת משתמש'}
        </button>
        <h2 className="text-lg font-semibold">אנשי צוות</h2>
      </div>

      {isAddingUser && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
          <h3 className="text-md font-semibold mb-3 text-right">הוספת משתמש חדש</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="text"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                placeholder="שם מלא"
                className="border border-gray-300 rounded px-3 py-2 w-full text-right"
              />
              <FiUser className="mr-2 text-gray-500 -ml-8" />
            </div>
            
            <div className="flex items-center">
              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                placeholder="אימייל"
                className="border border-gray-300 rounded px-3 py-2 w-full text-right"
              />
              <FiMail className="mr-2 text-gray-500 -ml-8" />
            </div>
            
            <div className="flex items-center">
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                placeholder="סיסמה (אופציונלי)"
                className="border border-gray-300 rounded px-3 py-2 w-full text-right"
              />
              <FiLock className="mr-2 text-gray-500 -ml-8" />
            </div>
            
            <div className="flex justify-between">
              <select
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="agent">נציג</option>
                <option value="manager">מנהל</option>
                <option value="admin">מנהל מערכת</option>
              </select>
              
              <div className="flex items-center">
                <label className="mr-2 text-sm">פעיל</label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={newUser.is_active}
                  onChange={handleInputChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>
            </div>
            
            <button
              onClick={handleAddUser}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full mt-2"
            >
              הוסף משתמש
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">טוען משתמשים...</p>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[600px]">
          {users.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              לא נמצאו משתמשים במערכת
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map(user => (
                <li 
                  key={user.id} 
                  className={`py-3 px-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedUserId === user.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onSelectUser(user.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleUserStatus(user);
                        }}
                        className={`p-1 rounded ${
                          user.is_active ? 'text-green-600 hover:bg-green-100' : 'text-red-600 hover:bg-red-100'
                        }`}
                        title={user.is_active ? 'משתמש פעיל - לחץ להשבתה' : 'משתמש מושבת - לחץ להפעלה'}
                      >
                        {user.is_active ? <FiUserCheck /> : <FiX />}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open edit modal (to be implemented)
                          alert('עריכת משתמש תתווסף בקרוב');
                        }}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        title="ערוך משתמש"
                      >
                        <FiEdit2 />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-1 rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'admin' ? 'מנהל מערכת' : 
                           user.role === 'manager' ? 'מנהל' : 'נציג'}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

// ייצוא ברירת מחדל לקומפוננטה
export default UserList;
