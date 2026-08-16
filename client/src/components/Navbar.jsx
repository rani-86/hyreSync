import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/jobs" className="navbar-brand" onClick={() => setMenuOpen(false)}>HireSync</Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links${menuOpen ? ' navbar-links-open' : ''}`}>
          <Link to="/jobs" onClick={() => setMenuOpen(false)}>Jobs</Link>
          {user && <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>}

          {user?.role === 'candidate' && <Link to="/my-applications" onClick={() => setMenuOpen(false)}>My Applications</Link>}
          {user?.role === 'candidate' && <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>}
          {user?.role === 'candidate' && <Link to="/recommendations" onClick={() => setMenuOpen(false)}>Recommended</Link>}

          {user ? (
            <>
              <span className="navbar-user">{user.name}</span>
              <button className="btn-secondary navbar-btn" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}>
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