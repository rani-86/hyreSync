import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup as signupApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function Signup() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'candidate',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const checks = getPasswordChecks(formData.password);
  const isPasswordValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isPasswordValid) {
      setError('Please meet all password requirements below');
      return;
    }
    try {
      const res = await signupApi(formData);
      login(res.data.user, res.data.token);
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

        {formData.password.length > 0 && (
          <div style={{ marginTop: -6, marginBottom: 14, fontSize: '0.82rem' }}>
            <PasswordCheck ok={checks.length} label="At least 8 characters" />
            <PasswordCheck ok={checks.upper} label="One uppercase letter" />
            <PasswordCheck ok={checks.lower} label="One lowercase letter" />
            <PasswordCheck ok={checks.number} label="One number" />
            <PasswordCheck ok={checks.special} label="One special character" />
          </div>
        )}

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

function PasswordCheck({ ok, label }) {
  return (
    <div style={{ color: ok ? 'var(--signal)' : 'var(--muted)', marginBottom: 2 }}>
      {ok ? '✓' : '○'} {label}
    </div>
  );
}

export default Signup;