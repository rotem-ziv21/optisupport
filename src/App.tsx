
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Automations } from './components/Automations';
import { CustomerTicketForm } from './components/CustomerTicketForm';
import { CustomerLandingPage } from './components/CustomerLandingPage';
import { CustomerTicketView } from './components/CustomerTicketView';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public customer routes - freely accessible */}
          <Route path="/customer" element={<CustomerLandingPage />} />
          <Route path="/customer-ticket" element={<CustomerTicketForm />} />
          <Route path="/customer-view" element={<CustomerLandingPage />} />
          <Route path="/customer-view/:id" element={<CustomerTicketView />} />
          
          {/* Authentication route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected agent routes - require authentication */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tickets" element={
            <ProtectedRoute>
              <Layout>
                <TicketList />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tickets/:id" element={
            <ProtectedRoute>
              <Layout>
                <TicketDetail />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/knowledge" element={
            <ProtectedRoute>
              <Layout>
                <KnowledgeBase />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/automations" element={
            <ProtectedRoute>
              <Layout>
                <Automations />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">ניהול צוות</h2>
                  <p className="text-gray-500 mt-2">בקרוב...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">אנליטיקה</h2>
                  <p className="text-gray-500 mt-2">בקרוב...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">הגדרות</h2>
                  <p className="text-gray-500 mt-2">בקרוב...</p>
                </div>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;