import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function Nav() {
    const { user } = useAuth()
  const navigate = useNavigate()
    const dashboardPath = user?.isITTeam
        ? "/it-dashboard"
        : "/my-tickets";
  return (
    <nav className="bg-indigo-700 text-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
                      <Link to={dashboardPath} className="text-xl font-bold tracking-wide hover:text-indigo-200 transition">
              🎫  Tickets
            </Link>
          </div>
          <div className="flex items-center space-x-4">
                     
                      <Link to={dashboardPath} className="text-sm hover:text-indigo-200 transition">
              Dashboard
            </Link>
            <button
              onClick={() => navigate('/')}
              className="text-sm bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
