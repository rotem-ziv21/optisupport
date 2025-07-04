# אופטי-תמיכה - מערכת כרטיסי תמיכה מבוססת בינה מלאכותית

מערכת כרטיסי תמיכה חכמה עם יכולות בינה מלאכותית מתקדמות לסיווג כרטיסים, זיהוי סיכונים, ניתוח סנטימנט, סיכום, תעדוף תור והצעת תגובות.

## תכונות

- 🔍 **סיווג וסימון אוטומטי של כרטיסים**: קובע רמת דחיפות ומוסיף תגיות חכמות על בסיס תוכן ההודעה
- 🆘 **זיהוי סיכונים**: מזהה כרטיסים בסיכון ומנתח סנטימנט לקוחות
- 🧾 **סיכום אוטומטי של כרטיסים**: יוצר סיכומים קצרים של תוכן הכרטיס
- ⏱️ **תעדוף תור בבינה מלאכותית**: מתעדף כרטיסים בצורה חכמה לזרימת עבודה אופטימלית של הצוות
- 💬 **תגובות אוטומטיות חכמות**: מציע תגובות קונטקסטואליות על בסיס היסטוריית השיחה
- 📊 **לוח בקרה בזמן אמת**: אנליטיקה מקיפה ומדדי ביצועים
- 🎨 **ממשק משתמש מודרני**: עיצוב יפה ורספונסיבי עם אנימציות חלקות
- 🔧 **ניהול צוות**: תפקידי משתמשים והרשאות

## מחסנית טכנולוגיות

- **ממשק קדמי**: React 18, TypeScript, Tailwind CSS
- **שרת אחורי**: Supabase (PostgreSQL)
- **אימות**: Supabase Auth
- **בינה מלאכותית**: OpenAI GPT-3.5 Turbo
- **אנימציות**: Framer Motion
- **אייקונים**: Heroicons
- **ניתוב**: React Router

## התחלה מהירה

1. **שכפול המאגר**
   ```bash
   git clone <repository-url>
   cd optisupport
   ```

2. **התקנת תלויות**
   ```bash
   npm install
   ```

3. **הגדרת משתני סביבה**
   ```bash
   cp .env.example .env
   ```
   מלא את מפתחות ה-API של Supabase ו-OpenAI בקובץ `.env`.

4. **הגדרת Supabase**
   - לחץ על "התחבר ל-Supabase" בפינה הימנית העליונה
   - צור את טבלאות מסד הנתונים הנדרשות (ראה סכמת מסד נתונים למטה)

5. **הפעלת שרת הפיתוח**
   ```bash
   npm run dev
   ```

## סכמת מסד נתונים

האפליקציה דורשת את הטבלאות הבאות ב-Supabase:

### טבלת כרטיסים
```sql
create table tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  category text not null default 'general',
  customer_email text not null,
  customer_name text not null,
  assigned_to uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  tags text[] default array[]::text[],
  sentiment_score float4 default 0,
  risk_level text default 'low',
  ai_summary text,
  suggested_replies text[] default array[]::text[],
  agent_actions text
);
```

### טבלת הודעות
```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  content text not null,
  sender text not null,
  sender_name text not null,
  created_at timestamptz default now(),
  is_ai_suggested boolean default false
);
```

### טבלת משתמשים
```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text default 'agent',
  avatar_url text,
  created_at timestamptz default now(),
  is_active boolean default true
);
```

## תכונות בינה מלאכותית

### סיווג כרטיסים
- מסווג אוטומטית כרטיסים (טכני, חיוב, כללי, בקשת_תכונה)
- מקצה רמות עדיפות (נמוך, בינוני, גבוה, דחוף)
- מספק ציוני ביטחון לחיזויים

### ניתוח סנטימנט
- מנתח סנטימנט לקוחות מתוכן הכרטיס
- ציונים מ--1 (שלילי) ל-+1 (חיובי)
- עוזר לזהות לקוחות מתוסכלים

### הערכת סיכונים
- מעריך רמות סיכון כרטיסים (נמוך, בינוני, גבוה)
- מזהה גורמי הסלמה פוטנציאליים
- מתעדף כרטיסים הדורשים תשומת לב מיידית

### תגובות חכמות
- יוצר הצעות תגובה קונטקסטואליות
- מבוסס על היסטוריית שיחה ותוכן כרטיס
- עוזר לסוכנים להגיב ביעילות רבה יותר

## מבנה הפרויקט

```
src/
├── components/          # רכיבי React
│   ├── Dashboard.tsx    # לוח בקרה ראשי
│   ├── TicketList.tsx   # תצוגת רשימת כרטיסים
│   └── Layout.tsx       # פריסת האפליקציה
├── services/           # לוגיקה עסקית
│   ├── aiService.ts    # פונקציונליות בינה מלאכותית
│   └── ticketService.ts # פעולות כרטיסים
├── types/             # טיפוסי TypeScript
├── utils/             # פונקציות עזר
└── lib/               # אינטגרציות צד שלישי
```

## משתני סביבה

- `VITE_SUPABASE_URL`: כתובת URL של פרויקט Supabase שלך
- `VITE_SUPABASE_ANON_KEY`: מפתח anon של Supabase שלך
- `VITE_OPENAI_API_KEY`: מפתח API של OpenAI לתכונות בינה מלאכותית

## פיתוח

```bash
# הפעלת שרת פיתוח
npm run dev

# הרצת בדיקות linting
npm run lint

# בנייה לייצור
npm run build
```

## תרומה

1. עשה fork למאגר
2. צור ענף תכונה
3. בצע את השינויים שלך
4. שלח pull request

## רישיון

רישיון MIT - ראה קובץ LICENSE לפרטים.

## תמיכה

לתמיכה, שלח אימייל ל-support@optisupport.com או צור issue במאגר.