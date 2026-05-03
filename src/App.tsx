import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import EditaisPage from './pages/EditaisPage'
import EditalDetailPage from './pages/EditalDetailPage'
import ExamsPage from './pages/ExamsPage'
import ExamDetailPage from './pages/ExamDetailPage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import ParseErrorsPage from './pages/ParseErrorsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/editais" replace />} />
          <Route path="editais" element={<EditaisPage />} />
          <Route path="editais/:id" element={<EditalDetailPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="exams/:id" element={<ExamDetailPage />} />
          <Route path="questions/:id" element={<QuestionDetailPage />} />
          <Route path="exams/:id/errors" element={<ParseErrorsPage />} />
          <Route path="*" element={<Navigate to="/editais" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
