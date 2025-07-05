import React from 'react';
import ApiToggle from './ApiToggle';

export const Settings: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">הגדרות</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">הגדרות API</h2>
        <p className="text-gray-600 mb-4">
          בחר את מקור הנתונים עבור האפליקציה. ניתן להשתמש ב-Supabase ישירות או בשרת ה-Backend שפיתחנו.
        </p>
        
        <ApiToggle />
        
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <h3 className="text-md font-medium text-blue-800 mb-2">מידע</h3>
          <p className="text-sm text-blue-600">
            שימוש ב-Backend API מאפשר גישה לכל התכונות המתקדמות של המערכת, כולל אינטגרציה עם OpenAI,
            שליחת התראות, וניתוח נתונים מתקדם. שימוש ישיר ב-Supabase מתאים לפיתוח מקומי ובדיקות.
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">הגדרות נוספות</h2>
        <p className="text-gray-500">הגדרות נוספות יהיו זמינות בקרוב...</p>
      </div>
    </div>
  );
};

export default Settings;
