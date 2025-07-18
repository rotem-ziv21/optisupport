-- הוספת נתונים מדגמיים לבדיקת האנליטיקה
-- נוסיף כרטיסים סגורים עם זמני טיפול שונים

-- הוספת כרטיסים סגורים עם זמני טיפול שונים
INSERT INTO tickets (
  id, 
  title, 
  description, 
  status, 
  priority, 
  customer_name, 
  customer_email, 
  customer_phone, 
  company_name,
  created_at, 
  updated_at
) VALUES 
-- לקוח עם עומס גבוה - הרבה כרטיסים וזמן טיפול ארוך
('sample-1', 'בעיה בחיבור למערכת', 'לא מצליח להתחבר למערכת', 'closed', 'high', 'יוסי כהן', 'yossi@example.com', '050-1234567', 'חברת טכנולוגיה בע"מ', '2024-01-15 08:00:00', '2024-01-15 14:30:00'),
('sample-2', 'שגיאה בתשלום', 'השירות לא מקבל תשלומים', 'closed', 'high', 'יוסי כהן', 'yossi@example.com', '050-1234567', 'חברת טכנולוגיה בע"מ', '2024-01-20 09:00:00', '2024-01-20 17:45:00'),
('sample-3', 'בעיה בדוחות', 'הדוחות לא נטענים', 'closed', 'medium', 'יוסי כהן', 'yossi@example.com', '050-1234567', 'חברת טכנולוגיה בע"מ', '2024-01-25 10:00:00', '2024-01-25 18:20:00'),
('sample-4', 'עדכון מערכת', 'בקשה לעדכון גרסה', 'closed', 'low', 'יוסי כהן', 'yossi@example.com', '050-1234567', 'חברת טכנולוגיה בע"מ', '2024-02-01 11:00:00', '2024-02-01 19:30:00'),
('sample-5', 'תמיכה טכנית', 'עזרה בהגדרות', 'closed', 'medium', 'יוסי כהן', 'yossi@example.com', '050-1234567', 'חברת טכנולוגיה בע"מ', '2024-02-05 12:00:00', '2024-02-05 20:15:00'),

-- לקוח עם עומס בינוני - כמות בינונית של כרטיסים וזמן טיפול בינוני
('sample-6', 'שאלה כללית', 'איך להשתמש בתכונה חדשה', 'closed', 'low', 'רחל לוי', 'rachel@example.com', '052-9876543', 'עסק קטן', '2024-01-18 14:00:00', '2024-01-18 16:30:00'),
('sample-7', 'בעיה קלה', 'כפתור לא עובד', 'closed', 'medium', 'רחל לוי', 'rachel@example.com', '052-9876543', 'עסק קטן', '2024-02-02 15:00:00', '2024-02-02 17:45:00'),
('sample-8', 'בקשת שינוי', 'שינוי פרטי חשבון', 'closed', 'low', 'רחל לוי', 'rachel@example.com', '052-9876543', 'עסק קטן', '2024-02-10 16:00:00', '2024-02-10 18:20:00'),

-- לקוח עם עומס נמוך - מעט כרטיסים וזמן טיפול קצר
('sample-9', 'שאלה פשוטה', 'איך לאפס סיסמה', 'closed', 'low', 'דוד ישראלי', 'david@example.com', '054-5555555', NULL, '2024-01-22 10:00:00', '2024-01-22 10:45:00'),
('sample-10', 'עדכון פרטים', 'עדכון כתובת מייל', 'closed', 'low', 'דוד ישראלי', 'david@example.com', '054-5555555', NULL, '2024-02-08 11:00:00', '2024-02-08 11:30:00'),

-- לקוח נוסף עם עומס גבוה - זמן טיפול ארוך מאוד
('sample-11', 'בעיה מורכבת', 'מערכת קורסת', 'closed', 'critical', 'שרה אברהם', 'sarah@bigcorp.com', '03-1234567', 'תאגיד גדול בע"מ', '2024-01-12 08:00:00', '2024-01-14 18:00:00'),
('sample-12', 'שחזור נתונים', 'צריך לשחזר מידע חשוב', 'closed', 'high', 'שרה אברהם', 'sarah@bigcorp.com', '03-1234567', 'תאגיד גדול בע"מ', '2024-01-28 09:00:00', '2024-01-30 17:30:00'),
('sample-13', 'אינטגרציה', 'חיבור למערכת חיצונית', 'closed', 'high', 'שרה אברהם', 'sarah@bigcorp.com', '03-1234567', 'תאגיד גדול בע"מ', '2024-02-15 10:00:00', '2024-02-17 16:45:00'),

-- לקוח עם עומס נמוך - טיפול מהיר
('sample-14', 'עזרה קלה', 'איך לייצא נתונים', 'closed', 'low', 'מיכל גרין', 'michal@startup.com', '050-9999999', 'סטארטאפ חדש', '2024-02-01 14:00:00', '2024-02-01 14:20:00');
