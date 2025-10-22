import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './providers/AuthContext';
import { ThemeProvider } from './providers/ThemeContext';
import { ModalProvider } from './providers/ModalContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AgentsList } from './pages/AgentsList';
import { AgentDetail } from './pages/AgentDetail';
import { Merchants } from './pages/Merchants';
import { Reports } from './pages/Reports';
import { AIReportBuilder } from './pages/AIReportBuilder';
import { Tools } from './pages/Tools';
import { Settings } from './pages/Settings';
import { Float } from './pages/Float';
import AddAgentModal from './components/AddAgentModal';
import AddMerchantModal from './components/AddMerchantModal';
import Toast from './components/Toast';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModalProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AgentsList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AgentDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/merchants"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Merchants />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-report"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AIReportBuilder />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Tools />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/float/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Float />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <AddAgentModal />
          <AddMerchantModal />
          <Toast />
        </BrowserRouter>
      </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
