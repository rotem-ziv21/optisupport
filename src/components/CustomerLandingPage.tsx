import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function CustomerLandingPage() {
  const [ticketToken, setTicketToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const handleTicketSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketToken.trim()) return;
    
    setIsSubmitting(true);
    // ניווט לדף הצפייה בכרטיס עם הטוקן שהוזן
    navigate(`/customer-view/${ticketToken}`);
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8 rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            ברוכים הבאים למערכת התמיכה שלנו
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            אנו כאן כדי לעזור לכם לפתור כל בעיה טכנית ולענות על כל שאלה
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">פתיחת קריאת שירות חדשה</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>מלאו את הטופס ונציג שלנו יחזור אליכם בהקדם האפשרי</p>
                </div>
                <div className="mt-5">
                  <Link
                    to="/customer-ticket"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    פתיחת פנייה חדשה
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">מעקב אחר קריאת שירות קיימת</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>הזינו את מספר הפנייה שקיבלתם במייל כדי לעקוב אחר הסטטוס שלה</p>
                </div>
                <div className="mt-5">
                  <form onSubmit={handleTicketSearch} className="flex rtl">
                    <input
                      type="text"
                      value={ticketToken}
                      onChange={(e) => setTicketToken(e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ml-2"
                      placeholder="הזינו מספר פנייה או טוקן"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !ticketToken.trim()}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isSubmitting || !ticketToken.trim() ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                    >
                      {isSubmitting ? 'טוען...' : 'בדיקה'}
                    </button>
                  </form>
                  <p className="mt-2 text-xs text-gray-500">הזינו את מספר הפנייה או הטוקן שקיבלתם במייל</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">שאלות נפוצות</h3>
              <div className="mt-5 space-y-6">
                <details className="group">
                  <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
                    <span>כמה זמן לוקח לקבל מענה לפנייה?</span>
                    <span className="transition group-open:rotate-180">
                      <svg fill="none" height="24" width="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </span>
                  </summary>
                  <p className="text-gray-600 mt-3 group-open:animate-fadeIn">
                    אנו משתדלים לענות לכל הפניות בתוך 24 שעות עבודה. פניות דחופות מטופלות בעדיפות גבוהה יותר.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
                    <span>האם ניתן לעדכן פנייה קיימת?</span>
                    <span className="transition group-open:rotate-180">
                      <svg fill="none" height="24" width="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </span>
                  </summary>
                  <p className="text-gray-600 mt-3 group-open:animate-fadeIn">
                    כן, תוכלו לעדכן פנייה קיימת באמצעות הקישור שנשלח אליכם במייל או באמצעות הזנת מספר הפנייה במערכת.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
                    <span>מה לעשות במקרה של תקלה דחופה?</span>
                    <span className="transition group-open:rotate-180">
                      <svg fill="none" height="24" width="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </span>
                  </summary>
                  <p className="text-gray-600 mt-3 group-open:animate-fadeIn">
                    במקרה של תקלה דחופה, יש לציין זאת בטופס הפנייה ולבחור בקטגוריה המתאימה. בנוסף, ניתן ליצור קשר טלפוני עם מוקד התמיכה שלנו.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center">
          <p className="text-sm text-gray-500">© 2025 OptiSupport. כל הזכויות שמורות.</p>
        </footer>
      </div>
    </div>
  );
}
