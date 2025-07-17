import React from 'react';
import { User } from '../types';

export interface UserListProps {
  users: User[];
  isLoading: boolean;
  onUserAdded: (user: User) => void;
  onUserUpdated: (user: User) => void;
  onUserSelected: (userId: string) => void;
  selectedUserId: string | null;
}

declare const UserList: React.FC<UserListProps>;
export default UserList;
