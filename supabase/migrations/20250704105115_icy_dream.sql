/*
  # יצירת טבלת כרטיסי תמיכה

  1. טבלאות חדשות
    - `tickets`
      - `id` (uuid, מפתח ראשי)
      - `title` (text, כותרת הכרטיס)
      - `description` (text, תיאור הבעיה)
      - `status` (text, סטטוס הכרטיס)
      - `priority` (text, רמת עדיפות)
      - `category` (text, קטגוריה)
      - `customer_email` (text, אימייל הלקוח)
      - `customer_name` (text, שם הלקוח)
      - `assigned_to` (uuid, מוקצה לסוכן)
      - `created_at` (timestamptz, תאריך יצירה)
      - `updated_at` (timestamptz, תאריך עדכון)
      - `tags` (text[], תגיות)
      - `sentiment_score` (float4, ציון סנטימנט)
      - `risk_level` (text, רמת סיכון)
      - `ai_summary` (text, סיכום בינה מלאכותית)
      - `suggested_replies` (text[], הצעות תגובה)

  2. אבטחה
    - הפעלת RLS על טבלת `tickets`
    - הוספת מדיניות לקריאה ועדכון נתונים
*/

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  category text NOT NULL DEFAULT 'general',
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  assigned_to uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tags text[] DEFAULT array[]::text[],
  sentiment_score float4 DEFAULT 0,
  risk_level text DEFAULT 'low',
  ai_summary text,
  suggested_replies text[] DEFAULT array[]::text[]
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on tickets"
  ON tickets
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);