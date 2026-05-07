import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/login-page'
import DashboardPage from './pages/dashboard-page'
import StudentsPage from './pages/students-page'
import StudentFormPage from './pages/student-form-page'
import PrivateRoute from './components/private-route'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/students"
          element={
            <PrivateRoute>
              <StudentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/students/new"
          element={
            <PrivateRoute>
              <StudentFormPage mode="create" />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/students/:studentId/edit"
          element={
            <PrivateRoute>
              <StudentFormPage mode="edit" />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
