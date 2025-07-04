/*
  # יצירת טבלת משתמשים

  1. טבלאות חדשות
    - `users`
      - `id` (uuid, מפתח ראשי)
      - `email` (text, אימייל ייחודי)
      - `name` (text, שם המשתמש)
      - `role` (text, תפקיד)
      - `avatar_url` (text, קישור לתמונת פרופיל)
      - `created_at` (timestamptz, תאריך יצירה)
      - `is_active` (boolean, האם פעיל)

  2. אבטחה
    - הפעלת RLS על טבלת `users`
    - הוספת מדיניות לקריאה ועדכון נתונים
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'agent',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on users"
  ON users
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);