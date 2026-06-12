import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DemoPage from './pages/Demo'
import LandingPage      from './pages/Landing'
import LoginPage        from './pages/Login'
import RegisterPage     from './pages/Register'
import ForgotPassword   from './pages/ForgotPassword'
import EmployeeDashboard from './pages/EmployeeDashboard'
import SubmitTicket     from './pages/SubmitTicket'
import ITDashboard      from './pages/ITDashboard'
import TicketDetail     from './pages/TicketDetail'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/"               element={<LandingPage />} />
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/demo" element={<DemoPage />} />
          {/* Employee routes */}
          <Route path="/my-tickets"     element={<ProtectedRoute role="employee"><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/submit-ticket"  element={<ProtectedRoute role="employee"><SubmitTicket /></ProtectedRoute>} />

          {/* IT routes */}
          <Route path="/it-dashboard"   element={<ProtectedRoute role="it"><ITDashboard /></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/ticket/:id"     element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
