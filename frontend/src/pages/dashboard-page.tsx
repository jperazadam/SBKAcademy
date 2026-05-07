import { useNavigate } from 'react-router-dom'

function DashboardPage() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
      <h1 className="text-3xl font-bold text-primary-600 tracking-tight">
        Bienvenido a SBKAcademy
      </h1>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/dashboard/students')}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold
                     rounded-lg px-6 py-2.5 text-base transition-colors duration-150
                     cursor-pointer focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          Alumnos
        </button>
        <button
          onClick={handleLogout}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold
                     rounded-lg px-6 py-2.5 text-base transition-colors duration-150
                     cursor-pointer focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-gray-600 focus-visible:ring-offset-2"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default DashboardPage
