import { useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import EditaisPage from './pages/EditaisPage'
import EditalDetailPage from './pages/EditalDetailPage'
import ExamsPage from './pages/ExamsPage'
import ExamDetailPage from './pages/ExamDetailPage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import ParseErrorsPage from './pages/ParseErrorsPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import AdminJobsPage from './pages/AdminJobsPage'

function AppRoutes() {
  const navigate = useNavigate()
  const handleAuthFailure = useCallback(() => navigate('/login', { replace: true }), [navigate])

  return (
    <AuthProvider onAuthFailure={handleAuthFailure}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/editais" replace />} />
          <Route path="editais" element={<EditaisPage />} />
          <Route path="editais/:id" element={<EditalDetailPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="exams/:id" element={<ExamDetailPage />} />
          <Route path="questions/:id" element={<QuestionDetailPage />} />
          <Route path="exams/:id/errors" element={<ParseErrorsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin/jobs" element={<AdminJobsPage />} />
          <Route path="*" element={<Navigate to="/editais" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
