import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/login-page'
import DashboardPage from './pages/dashboard-page'
import StudentsPage from './pages/students-page'
import StudentFormPage from './pages/student-form-page'
import ClassesPage from './pages/classes-page'
import ClassFormPage from './pages/class-form-page'
import PrivateRoute from './components/private-route'
import AppLayout from './components/app-layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/*
          Todas las rutas privadas anidadas bajo un único wrapper.
          PrivateRoute verifica el token; AppLayout provee el shell persistente.
          <Outlet /> en AppLayout renderiza la ruta hija activa.
        */}
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/students" element={<StudentsPage />} />
          <Route path="/dashboard/students/new" element={<StudentFormPage mode="create" />} />
          <Route
            path="/dashboard/students/:studentId/edit"
            element={<StudentFormPage mode="edit" />}
          />
          <Route path="/dashboard/classes" element={<ClassesPage />} />
          <Route path="/dashboard/classes/new" element={<ClassFormPage mode="create" />} />
          <Route
            path="/dashboard/classes/:classId/edit"
            element={<ClassFormPage mode="edit" />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
