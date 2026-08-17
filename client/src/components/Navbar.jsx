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
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            {menuOpen ? (
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
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