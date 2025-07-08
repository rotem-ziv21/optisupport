import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { KnowledgeBase } from './components/KnowledgeBase';
import { CustomerTicketForm } from './components/CustomerTicketForm';
import { CustomerLandingPage } from './components/CustomerLandingPage';
import { CustomerTicketView } from './components/CustomerTicketView';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/customer" element={<CustomerLandingPage />} />
          <Route path="/customer-ticket" element={<CustomerTicketForm />} />
          <Route path="/customer-view" element={<CustomerLandingPage />} />
          <Route path="/customer-view/:id" element={<CustomerTicketView />} />
          <Route path="/team" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">ניהול צוות</h2><p className="text-gray-500 mt-2">בקרוב...</p></div>} />
          <Route path="/analytics" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">אנליטיקה</h2><p className="text-gray-500 mt-2">בקרוב...</p></div>} />
          <Route path="/settings" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">הגדרות</h2><p className="text-gray-500 mt-2">בקרוב...</p></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;