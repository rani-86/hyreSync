import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  useDocumentTitle('Log in');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await loginApi(formData);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="page-narrow">
      <h1 style={{ textAlign: 'center', marginBottom: 4 }}>Welcome back</h1>
      <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 32 }}>
        Log in to HireSync
      </p>

      <form onSubmit={handleSubmit} className="card">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Log in
        </button>

        <p style={{ textAlign: 'center', marginTop: 12 }}>
          <Link to="/forgot-password" style={{ fontSize: '0.9rem' }}>Forgot password?</Link>
        </p>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20 }}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;