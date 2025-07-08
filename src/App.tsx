import React from 'react';
// ייבוא Toaster באופן דינמי כדי לפתור בעיית בנייה
import * as ReactHotToast from 'react-hot-toast';
const { Toaster } = ReactHotToast;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TicketList } from './components/TicketList';
import { KnowledgeBase } from './components/KnowledgeBase';
import { TicketDetail } from './components/TicketDetail.tsx';

function App() {
  return (
    <Router>
      <Layout>
        <Toaster position="top-center" toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            direction: 'rtl',
            textAlign: 'right'
          },
        }} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/team" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">ניהול צוות</h2><p className="text-gray-500 mt-2">בקרוב...</p></div>} />
          <Route path="/analytics" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">אנליטיקה</h2><p className="text-gray-500 mt-2">בקרוב...</p></div>} />
          <Route path="/settings" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">הגדרות</h2><p className="text-gray-500 mt-2">בקרוב...</p></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;