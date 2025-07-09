import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-16 px-4 sm:px-6 lg:px-8 rtl">
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent sm:text-6xl sm:tracking-tight lg:text-7xl leading-tight">
            ברוכים הבאים למערכת התמיכה שלנו
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-xl text-slate-600 leading-relaxed">
            אנו כאן כדי לעזור לכם לפתור כל בעיה טכנית ולענות על כל שאלה
          </p>
        </motion.div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-2xl rounded-3xl border border-white/20">
              <div className="px-8 py-10 sm:p-12">
                <div className="relative">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-10 blur-xl"></div>
                  <h3 className="text-2xl leading-tight font-bold text-slate-800 relative z-10">פתיחת קריאת שירות חדשה</h3>
                </div>
                <div className="mt-4 text-slate-600 leading-relaxed">
                  <p>מלאו את הטופס ונציג שלנו יחזור אליכם בהקדם האפשרי</p>
                </div>
                <div className="mt-8">
                  <Link
                    to="/customer-ticket"
                    className="inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-2xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-xl hover:scale-105"
                  >
                    פתיחת פנייה חדשה
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-2xl rounded-3xl border border-white/20">
              <div className="px-8 py-10 sm:p-12">
                <div className="relative">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-10 blur-xl"></div>
                  <h3 className="text-2xl leading-tight font-bold text-slate-800 relative z-10">מעקב אחר קריאת שירות קיימת</h3>
                </div>
                <div className="mt-4 text-slate-600 leading-relaxed">
                  <p>הזינו את מספר הפנייה שקיבלתם במייל כדי לעקוב אחר הסטטוס שלה</p>
                </div>
                <div className="mt-8">
                  <form onSubmit={handleTicketSearch} className="flex gap-3 rtl">
                    <input
                      type="text"
                      value={ticketToken}
                      onChange={(e) => setTicketToken(e.target.value)}
                      className="shadow-lg focus:ring-blue-500 focus:border-blue-500 block w-full text-sm border border-slate-300 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl"
                      placeholder="הזינו מספר פנייה או טוקן"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !ticketToken.trim()}
                      className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-white transition-all duration-200 ${isSubmitting || !ticketToken.trim() ? 'bg-blue-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-xl hover:scale-105'}`}
                    >
                      {isSubmitting ? 'טוען...' : 'בדיקה'}
                    </button>
                  </form>
                  <p className="mt-3 text-xs text-slate-500">הזינו את מספר הפנייה או הטוקן שקיבלתם במייל</p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 bg-white/90 backdrop-blur-sm overflow-hidden shadow-2xl rounded-3xl border border-white/20">
            <div className="px-8 py-10 sm:p-12">
              <div className="relative">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-10 blur-xl"></div>
                <h3 className="text-2xl leading-tight font-bold text-slate-800 relative z-10">שאלות נפוצות</h3>
              </div>
              <div className="mt-8 space-y-6">
                <details className="group bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 shadow-lg border border-slate-200/50">
                  <summary className="flex justify-between items-center font-semibold cursor-pointer list-none text-slate-800">
                    <span>כמה זמן לוקח לקבל מענה לפנייה?</span>
                    <span className="transition-transform duration-300 group-open:rotate-180">
                      <svg fill="none" height="24" width="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                        <path d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </span>
                  </summary>
                  <p className="text-slate-600 mt-4 group-open:animate-fadeIn leading-relaxed">
                    אנו משתדלים לענות לכל הפניות בתוך 24 שעות עבודה. פניות דחופות מטופלות בעדיפות גבוהה יותר.
                  </p>
                </details>

                <details className="group bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 shadow-lg border border-slate-200/50">
                  <summary className="flex justify-between items-center font-semibold cursor-pointer list-none text-slate-800">
                    <span>האם ניתן לעדכן פנייה קיימת?</span>
                    <span className="transition-transform duration-300 group-open:rotate-180">
                      <svg fill="none" height="24" width="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                        <path d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </span>
                  </summary>
                  <p className="text-slate-600 mt-4 group-open:animate-fadeIn leading-relaxed">
                    כן, תוכלו לעדכן פנייה קיימת באמצעות הקישור שנשלח אליכם במייל או באמצעות הזנת מספר הפנייה במערכת.
                  </p>
                </details>

                <details className="group bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 shadow-lg border border-slate-200/50">
                  <summary className="flex justify-between items-center font-semibold cursor-pointer list-none text-slate-800">
                    <span>מה לעשות במקרה של תקלה דחופה?</span>
                    <span className="transition-transform duration-300 group-open:rotate-180">
                      <svg fill="none" height="24" width="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                        <path d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </span>
                  </summary>
                  <p className="text-slate-600 mt-4 group-open:animate-fadeIn leading-relaxed">
                    במקרה של תקלה דחופה, יש לציין זאת בטופס הפנייה ולבחור בקטגוריה המתאימה. בנוסף, ניתן ליצור קשר טלפוני עם מוקד התמיכה שלנו.
                  </p>
                </details>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center">
          <p className="text-sm text-slate-500 bg-gradient-to-r from-slate-500 to-gray-500 bg-clip-text text-transparent">© 2025 OptiSupport. כל הזכויות שמורות.</p>
        </motion.footer>
      </div>
    </div>
  );
}
