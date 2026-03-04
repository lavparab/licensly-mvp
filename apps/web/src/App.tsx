import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './components/theme-provider';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Licenses } from './pages/Licenses';
import { Integrations } from './pages/Integrations';
import { Optimization } from './pages/Optimization';
import { Compliance } from './pages/Compliance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import { Onboarding } from './pages/Onboarding';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="licensly-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/licenses" element={<Licenses />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/optimization" element={<Optimization />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;