import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { LockClosedIcon, EnvelopeIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('נא למלא את כל השדות');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        console.error('Login error:', signInError);
        setError('שם משתמש או סיסמה שגויים');
        return;
      }
      
      // Navigate to the page the user was trying to access
      navigate(from, { replace: true });
      
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError('אירעה שגיאה בתהליך ההתחברות');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            כניסה למערכת נציגים
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            הזינו את פרטי ההתחברות שלכם
          </p>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center"
          >
            <ExclamationCircleIcon className="h-5 w-5 ml-2 text-red-500" />
            <span>{error}</span>
          </motion.div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                דוא"ל
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pr-10 border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-right shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl py-3 px-4"
                  placeholder="your.email@example.com"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                סיסמה
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-10 border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-right shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-200 focus:shadow-xl py-3 px-4"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
          
          <div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white transition-all duration-200 ${
                loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-xl'
              }`}
            >
              {loading ? 'מתחבר...' : 'התחברות'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
