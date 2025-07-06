/*
  # יצירת טבלת הודעות

  1. טבלאות חדשות
    - `messages`
      - `id` (uuid, מפתח ראשי)
      - `ticket_id` (uuid, קישור לכרטיס)
      - `content` (text, תוכן ההודעה)
      - `sender` (text, שולח ההודעה)
      - `sender_name` (text, שם השולח)
      - `created_at` (timestamptz, תאריך יצירה)
      - `is_ai_suggested` (boolean, האם הוצע על ידי בינה מלאכותית)

  2. אבטחה
    - הפעלת RLS על טבלת `messages`
    - הוספת מדיניות לקריאה ועדכון נתונים
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  content text NOT NULL,
  sender text NOT NULL,
  sender_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_ai_suggested boolean DEFAULT false
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on messages"
  ON messages
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);