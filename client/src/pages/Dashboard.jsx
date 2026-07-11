import { useState } from 'react';
import { uploadResume } from '../services/api';

function Dashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
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
      const updatedUser = { ...user, resumeUrl: res.data.resumeUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div>
      <h2>Welcome, {user?.name}</h2>
      <p>Role: {user?.role}</p>

      {user?.role === 'candidate' && (
        <div>
          <h3>Resume</h3>
          {user?.resumeUrl ? (
            <p>
              <a href={user.resumeUrl} target="_blank" rel="noreferrer">
                View current resume
              </a>
            </p>
          ) : (
            <p>No resume uploaded yet.</p>
          )}
          <form onSubmit={handleUpload}>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <button type="submit">Upload Resume</button>
          </form>
          {message && <p style={{ color: 'green' }}>{message}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

export default Dashboard;