import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/jobs" className="navbar-brand">HireSync</Link>

        <div className="navbar-links">
          <Link to="/jobs">Jobs</Link>
          {user && <Link to="/dashboard">Dashboard</Link>}

          {user?.role === 'candidate' && <Link to="/my-applications">My Applications</Link>}
          {user?.role === 'candidate' && <Link to="/profile">Profile</Link>}
          {user?.role === 'candidate' && <Link to="/recommendations">Recommended</Link>}

          {user ? (
            <>
              <span className="navbar-user">{user.name}</span>
              <button className="btn-secondary navbar-btn" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup">
                <button className="btn-primary navbar-btn">Sign up</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;