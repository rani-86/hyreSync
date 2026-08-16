import { useState } from 'react';
import { uploadResume } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, updateUser } = useAuth();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a PDF file first');
      return;
    }
    setError('');
    setMessage('');
    try {
      const res = await uploadResume(file);
      setMessage('Resume uploaded successfully!');
      updateUser({ resumeUrl: res.data.resumeUrl });
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div className="page-narrow">
      <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{ color: 'var(--muted)', margin: '0 0 4px 0', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Welcome back
        </p>
        <h1 style={{ marginBottom: 8 }}>{user?.name}</h1>
        <span className="tag tag-signal">{user?.role}</span>
      </div>

      {user?.role === 'candidate' && (
        <div className="card">
          <h3>Resume</h3>
          {user?.resumeUrl ? (
            <p>
              <a href={user.resumeUrl} target="_blank" rel="noreferrer">
                View current resume →
              </a>
            </p>
          ) : (
            <p style={{ color: 'var(--muted)' }}>No resume uploaded yet.</p>
          )}
          <form onSubmit={handleUpload}>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <button type="submit" className="btn-primary">Upload resume</button>
          </form>
          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default Dashboard;