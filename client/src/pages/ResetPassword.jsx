import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const checks = getPasswordChecks(newPassword);
  const isValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValid) {
      setError('Please meet all password requirements below');
      return;
    }
    const token = searchParams.get('token');
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  if (success) {
    return (
      <div className="page-narrow">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--signal)' }}>Password reset!</h2>
          <p>Redirecting you to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-narrow">
      <h1 style={{ textAlign: 'center', marginBottom: 4 }}>Reset your password</h1>

      <form onSubmit={handleSubmit} className="card">
        <label htmlFor="newPassword">New password</label>
        <input
          id="newPassword"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        {newPassword.length > 0 && (
          <div style={{ marginTop: -6, marginBottom: 14, fontSize: '0.82rem' }}>
            <PasswordCheck ok={checks.length} label="At least 8 characters" />
            <PasswordCheck ok={checks.upper} label="One uppercase letter" />
            <PasswordCheck ok={checks.lower} label="One lowercase letter" />
            <PasswordCheck ok={checks.number} label="One number" />
            <PasswordCheck ok={checks.special} label="One special character" />
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Reset password
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20 }}>
        <Link to="/login">← Back to login</Link>
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

export default ResetPassword;