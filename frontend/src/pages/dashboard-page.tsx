import { useNavigate } from 'react-router-dom'

function DashboardPage() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <h1>Bienvenido a SBKAcademy</h1>
      <button className="logout-button" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  )
}

export default DashboardPage
