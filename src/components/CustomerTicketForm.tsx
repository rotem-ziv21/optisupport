import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon, 
  TagIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 rtl">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">פתיחת קריאת שירות</h2>
          <p className="mt-2 text-gray-600">מלאו את הפרטים ונחזור אליכם בהקדם</p>
        </div>
        
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-green-800">הפנייה נשלחה בהצלחה</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>תודה שפנית אלינו. נציג שירות יצור איתך קשר בהקדם.</p>
                </div>
                
                {ticketUrl && (
                  <div className="mt-4 p-3 bg-white rounded-md border border-green-100">
                    <h4 className="text-sm font-medium text-gray-800">קישור למעקב אחר הפנייה שלך:</h4>
                    <div className="mt-2 flex items-center">
                      <input 
                        type="text" 
                        readOnly 
                        value={ticketUrl} 
                        className="flex-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(ticketUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4 ml-1" />
                        {copied ? 'הועתק!' : 'העתק'}
                      </button>
                    </div>
                    <div className="mt-3">
                      <Link 
                        to={`/customer-view/${createdTicketId}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        צפייה בפנייה
                      </Link>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">שמרו קישור זה כדי לעקוב אחר סטטוס הפנייה ולהגיב להודעות</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="mr-3">
                    <h3 className="text-sm font-medium text-red-800">שגיאה</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* שם */}
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  שם מלא <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                    placeholder="ישראל ישראלי"
                    required
                  />
                </div>
              </div>
              
              {/* אימייל */}
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  אימייל <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              
              {/* טלפון */}
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  טלפון
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                    placeholder="050-0000000"
                  />
                </div>
              </div>
              
              {/* חברה */}
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  שם חברה
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="company"
                    id="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="block w-full pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                    placeholder="שם החברה שלך"
                  />
                </div>
              </div>
              
              {/* נושא */}
              <div className="col-span-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  נושא <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="block w-full pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                    placeholder="נושא הפנייה"
                    required
                  />
                </div>
              </div>
              
              {/* קטגוריה */}
              <div className="col-span-2">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  קטגוריה
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <TagIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <select
                    name="category"
                    id="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  תיאור הפנייה <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-right"
                    placeholder="אנא תארו את הבעיה או הפנייה שלכם בפירוט"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {loading ? 'שולח...' : 'שליחת הפנייה'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
