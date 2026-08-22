import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { resendVerificationEmail } from '../services/api';

function VerifyBanner() {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  if (!user || user.isVerified) return null;

  const handleResend = async () => {
    setStatus('sending');
    setError('');
    try {
      await resendVerificationEmail();
      setStatus('sent');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification email');
      setStatus('idle');
    }
  };

  return (
    <div className="verify-banner">
      <p>
        {status === 'sent'
          ? 'Verification email sent — check your inbox.'
          : "Verify your email to unlock posting jobs and applying to them."}
      </p>
      {status !== 'sent' && (
        <button className="btn-secondary verify-banner-btn" onClick={handleResend} disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Resend verification email'}
        </button>
      )}
      {error && <span className="verify-banner-error">{error}</span>}
    </div>
  );
}

export default VerifyBanner;
