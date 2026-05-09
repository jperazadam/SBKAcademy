import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/auth-context'
import LoginPage from './pages/login-page'
import RegisterPage from './pages/register-page'
import DashboardPage from './pages/dashboard-page'
import StudentsPage from './pages/students-page'
import ClassesPage from './pages/classes-page'
import ClassFormPage from './pages/class-form-page'
import StudentHomePage from './pages/student-home-page'
import RoleRoute from './components/role-route'
import AppLayout from './components/app-layout'
import StudentLayout from './layouts/student-layout'

function App() {
  return (
    /*
     * AuthProvider wraps BrowserRouter so that RoleRoute and PrivateRoute
     * can access useAuth() at any nesting level. Placing it here (inside App,
     * above BrowserRouter) keeps main.tsx minimal.
     */
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          {/*
           * Professor routes — protected by RoleRoute(professor).
           * A student navigating here is redirected to /portal.
           * An unauthenticated user is redirected to /login.
           */}
          <Route
            element={
              <RoleRoute allow="professor">
                <AppLayout />
              </RoleRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/students" element={<StudentsPage />} />
            <Route path="/dashboard/classes" element={<ClassesPage />} />
            <Route path="/dashboard/classes/new" element={<ClassFormPage mode="create" />} />
            <Route
              path="/dashboard/classes/:classId/edit"
              element={<ClassFormPage mode="edit" />}
            />
          </Route>

          {/*
           * Student routes — protected by RoleRoute(student).
           * A professor navigating here is redirected to /dashboard.
           * An unauthenticated user is redirected to /login.
           */}
          <Route
            element={
              <RoleRoute allow="student">
                <StudentLayout />
              </RoleRoute>
            }
          >
            <Route path="/portal" element={<StudentHomePage />} />
          </Route>

          {/* Fallback: anything else → /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
