import React from 'react';
import { UserActivityWithDetails } from '../types';

export interface UserActivityLogProps {
  userId: string | null;
  activityStats: Record<string, any>;
}

export declare const UserActivityLog: React.FC<UserActivityLogProps>;
