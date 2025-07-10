import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  TicketIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const navigation = [
  { name: 'לוח בקרה', href: '/', icon: HomeIcon },
  { name: 'כרטיסים', href: '/tickets', icon: TicketIcon },
  { name: 'מאגר הידע', href: '/knowledge', icon: BookOpenIcon },
  { name: 'צוות', href: '/team', icon: UserGroupIcon },
  { name: 'אנליטיקה', href: '/analytics', icon: ChartBarIcon },
  { name: 'הגדרות', href: '/settings', icon: CogIcon },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // בדיקה אם אנחנו בדף לקוחות
  const isCustomerPage = location.pathname.includes('/customer');

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* אם זה דף לקוחות, לא מציגים את הסרגל הצדדי */}
      {!isCustomerPage && (
        <>
          {/* Mobile sidebar */}
          <div className={clsx(
            'fixed inset-0 z-40 lg:hidden',
            sidebarOpen ? 'block' : 'hidden'
          )}>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h1 className="text-2xl font-bold text-gray-900">אופטי-תמיכה</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <nav className="mt-6 px-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1',
                      location.pathname === item.href
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5 ml-3" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-40 lg:w-64 lg:bg-white lg:shadow-lg lg:flex lg:flex-col">
            <div className="flex items-center px-6 py-4 border-b">
              <h1 className="text-2xl font-bold text-gray-900">אופטי-תמיכה</h1>
            </div>
            <nav className="flex-1 mt-6 px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors',
                    location.pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="h-5 w-5 ml-3" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Main content */}
      <div className={isCustomerPage ? "" : "lg:pr-64"}>
        {/* סרגל עליון - רק אם לא בדף לקוחות */}
        {!isCustomerPage && (
          <header className="bg-white shadow-sm lg:hidden">
            <div className="flex items-center justify-between h-16 px-4">
              <h1 className="text-xl font-bold text-gray-900">אופטי-תמיכה</h1>
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </header>
        )}
        
        {/* סרגל ניווט עליון - רק אם לא בדף לקוחות */}
        {!isCustomerPage && (
          <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-white shadow-sm border-b lg:px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="hidden md:flex md:items-center md:space-x-4 md:space-x-reverse">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="חיפוש כרטיסים..."
                    className="pr-10 pl-4 py-2 w-64 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="relative group">
                  <img
                    src={user?.user_metadata?.avatar_url || "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop"}
                    alt="פרופיל"
                    className="h-8 w-8 rounded-full cursor-pointer"
                  />
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                    <button
                      onClick={async () => {
                        await signOut();
                        navigate('/login');
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 ml-2 text-gray-500" />
                      התנתק
                    </button>
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.email?.split('@')[0] || 'משתמש'}</p>
                  <p className="text-xs text-gray-500">{user?.user_metadata?.role || 'נציג'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* תוכן העמוד */}
        <main className={isCustomerPage ? "p-4" : "py-6"}>
          {children}
        </main>
      </div>
    </div>
  );
}