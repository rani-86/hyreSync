import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../services/api';

function Signup() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'candidate',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await signup(formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="page-narrow">
      <h1 style={{ textAlign: 'center', marginBottom: 4 }}>Create your account</h1>
      <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 32 }}>
        Join HireSync as a candidate or recruiter
      </p>

      <form onSubmit={handleSubmit} className="card">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" placeholder="Jane Doe" value={formData.name} onChange={handleChange} required />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />

        <label htmlFor="role">I am a…</label>
        <select id="role" name="role" value={formData.role} onChange={handleChange}>
          <option value="candidate">Candidate</option>
          <option value="recruiter">Recruiter</option>
        </select>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Create account
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Signup;