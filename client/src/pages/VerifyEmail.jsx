import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../services/api';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    const doVerify = async () => {
      try {
        const res = await verifyEmail(token);
        setStatus('success');
        setMessage(res.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      }
    };
    doVerify();
  }, [searchParams]);

  return (
    <div className="page-narrow">
      <div className="card" style={{ textAlign: 'center' }}>
        {status === 'verifying' && <p>Verifying your email…</p>}
        {status === 'success' && (
          <>
            <h2 style={{ color: 'var(--signal)' }}>Email verified!</h2>
            <p>{message}</p>
            <Link to="/dashboard"><button className="btn-primary">Go to dashboard</button></Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 style={{ color: 'var(--danger)' }}>Verification failed</h2>
            <p>{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;