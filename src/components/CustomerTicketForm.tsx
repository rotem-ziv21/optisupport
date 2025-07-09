import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon, 
  TagIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { ticketService } from '../services/ticketService';

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  category: string;
  description: string;
}

export function CustomerTicketForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    category: 'תמיכה טכנית',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [ticketUrl, setTicketUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  const categories = ['תמיכה טכנית', 'שאלה כללית', 'דיווח על תקלה', 'בקשת שיפור', 'אחר'];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const validatePhone = (phone: string) => {
    // בדיקה בסיסית למספר טלפון ישראלי
    const phoneRegex = /^(0[23489]|05[0-9]|07[0-9])-?[0-9]{7}$/;
    return phone === '' || phoneRegex.test(phone);
  };
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // וידוא תקינות הטופס
    if (!formData.name) {
      setError('נא להזין שם');
      return;
    }
    
    if (!formData.email || !validateEmail(formData.email)) {
      setError('נא להזין כתובת אימייל תקינה');
      return;
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      setError('נא להזין מספר טלפון תקין');
      return;
    }
    
    if (!formData.subject) {
      setError('נא להזין נושא לפנייה');
      return;
    }
    
    if (!formData.description) {
      setError('נא להזין תיאור לפנייה');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // יצירת הכרטיס
      const newTicket = await ticketService.createTicket({
        title: formData.subject,
        description: formData.description,
        category: formData.category,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        company_name: formData.company,
        priority: 'רגילה'
      });
      
      // שמירת מזהה הכרטיס ויצירת הקישור לצפייה בו
      setCreatedTicketId(newTicket.id);
      
      // יצירת הכתובת לצפייה בכרטיס
      const baseUrl = window.location.origin;
      const ticketViewUrl = `${baseUrl}/customer-view/${newTicket.id}`;
      setTicketUrl(ticketViewUrl);
      
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        category: 'תמיכה טכנית',
        description: ''
      });
      
    } catch (err) {
      console.error('Failed to create ticket:', err);
      setError('אירעה שגיאה בשליחת הטופס. אנא נסו שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-16 px-4 sm:px-6 lg:px-8 rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-lg w-full mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-white/20">
        <div className="text-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-2xl opacity-20"></div>
            <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 mb-6 shadow-lg">
              <ChatBubbleLeftRightIcon className="h-10 w-10" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">פתיחת קריאת שירות חדשה</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">אנא מלאו את הפרטים הבאים ונחזור אליכם בהקדם</p>
        </div>
        
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full blur-2xl opacity-20"></div>
              <div className="relative mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 mb-8 shadow-lg">
                <CheckCircleIcon className="h-10 w-10 text-emerald-600" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">תודה על פנייתך!</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              פנייתך התקבלה בהצלחה. מספר הפנייה שלך הוא: <span className="font-semibold text-blue-600">{createdTicketId}</span>
            </p>
            
            {ticketUrl && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-10 border border-blue-200/50 shadow-lg">
                <p className="text-sm font-semibold text-slate-700 mb-4">קישור לצפייה בפנייה:</p>
                <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4 shadow-lg">
                  <span className="text-sm text-slate-500 truncate ml-2 overflow-hidden">{ticketUrl}</span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      navigator.clipboard.writeText(ticketUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${copied ? 'bg-emerald-100 text-emerald-700 shadow-lg' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-md hover:shadow-lg'}`}
                  >
                    {copied ? 'הועתק! ✓' : 'העתק קישור'}
                  </motion.button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse justify-center">
              <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={ticketUrl}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-semibold rounded-2xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full justify-center transition-all duration-200 hover:shadow-xl"
                >
                  צפייה בפנייה
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/customer"
                  className="inline-flex items-center px-8 py-3 border border-slate-300 text-base font-semibold rounded-2xl shadow-lg text-slate-700 bg-white/80 backdrop-blur-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full justify-center transition-all duration-200 hover:shadow-xl"
                >
                  חזרה לדף הראשי
                </Link>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit} 
            className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 p-6 mb-6 border border-red-200/50 shadow-lg">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-red-800">שגיאה</h3>
                    <div className="mt-2 text-sm text-red-700 leading-relaxed">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="grid grid-cols-2 gap-6">
              {/* שם */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                  שם מלא <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pr-12 border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-right shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl py-3 px-4"
                    placeholder="שם מלא"
                    required
                  />
                </div>
              </div>
              
              {/* אימייל */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  אימייל <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pr-12 border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-right shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl py-3 px-4"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              
              {/* טלפון */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                  טלפון
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pr-12 border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-right shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl py-3 px-4"
                    placeholder="050-0000000"
                  />
                </div>
              </div>
              
              {/* חברה */}
              <div>
                <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
                  חברה
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="company"
                    id="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="block w-full pr-12 border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-right shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl py-3 px-4"
                    placeholder="שם החברה שלך"
                  />
                </div>
              </div>
              
              {/* נושא */}
              <div className="col-span-2">
                <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                  נושא <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="block w-full pr-12 border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-right shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl py-3 px-4"
                    placeholder="נושא הפנייה"
                    required
                  />
                </div>
              </div>
              
              {/* קטגוריה */}
              <div className="col-span-2">
                <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-2">
                  קטגוריה
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <TagIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  </div>
                  <select
                    name="category"
                    id="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full pr-12 border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-right shadow-lg appearance-none bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl py-3 px-4"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* תיאור */}
              <div className="col-span-2">
                <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                  תיאור הפנייה <span className="text-red-500">*</span>
                </label>
                <div>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full border-slate-300 rounded-xl shadow-lg focus:ring-blue-500 focus:border-blue-500 text-right bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl py-3 px-4"
                    placeholder="אנא תארו את הבעיה או הפנייה שלכם בפירוט"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-lg text-base font-semibold text-white transition-all duration-200 ${
                  loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    שולח את הפנייה...
                  </span>
                ) : (
                  'שליחת הפנייה'
                )}
              </motion.button>
              <p className="text-xs text-slate-500 text-center mt-4">* שדות חובה</p>
            </div>
          </motion.form>
        )}
      </motion.div>
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center text-sm text-slate-500">
        <p className="bg-gradient-to-r from-slate-500 to-gray-500 bg-clip-text text-transparent">© 2025 OptiSupport. כל הזכויות שמורות.</p>
      </motion.footer>
    </div>
  );
}
