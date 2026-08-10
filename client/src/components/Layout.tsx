import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-800">
            足球预测平台
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/leaderboard" className="text-gray-600 hover:text-gray-900">
              排行榜
            </Link>
            {user ? (
              <>
                <span className="text-gray-700">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-blue-500 hover:text-blue-700">
                  登录
                </Link>
                <Link to="/register" className="text-blue-500 hover:text-blue-700">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
