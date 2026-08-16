import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { uploadResume, getJobs } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function Dashboard() {
  const { user, updateUser } = useAuth();
  useDocumentTitle('Dashboard');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [myJobs, setMyJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(user?.role === 'recruiter');
  const [jobsError, setJobsError] = useState('');

  useEffect(() => {
    if (user?.role !== 'recruiter') return;
    const fetchMyJobs = async () => {
      try {
        const res = await getJobs();
        setMyJobs(res.data.filter((job) => job.postedBy?._id === user.id));
      } catch (err) {
        setJobsError('Failed to load your job postings');
      } finally {
        setJobsLoading(false);
      }
    };
    fetchMyJobs();
  }, [user?.role, user?.id]);

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

  const isRecruiter = user?.role === 'recruiter';

  return (
    <div className={isRecruiter ? 'page' : 'page-narrow'}>
      <div className="card dashboard-welcome">
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

      {isRecruiter && (
        <>
          <div className="page-header" style={{ marginTop: 24, marginBottom: 16 }}>
            <h3>Your job postings</h3>
            <Link to="/jobs/new">
              <button className="btn-primary">Post a job</button>
            </Link>
          </div>

          {jobsLoading && <p className="loading-text">Loading your postings…</p>}
          {jobsError && <p className="form-error">{jobsError}</p>}

          {!jobsLoading && !jobsError && myJobs.length === 0 && (
            <div className="card">
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                You haven't posted any jobs yet. Post one to start receiving applicants.
              </p>
            </div>
          )}

          {myJobs.map((job) => (
            <div key={job._id} className="card">
              <div className="dashboard-job-row">
                <div>
                  <h3 style={{ marginBottom: 2 }}>
                    <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                  </h3>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{job.location}</p>
                </div>
                <Link to={`/jobs/${job._id}/applicants`}>
                  <button className="btn-secondary">View applicants</button>
                </Link>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default Dashboard;