import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyApplications } from '../services/api';

const statusTag = {
  pending: 'tag-pending',
  accepted: 'tag-signal',
  rejected: 'tag-danger',
};

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await getMyApplications();
        setApplications(res.data);
      } catch (err) {
        setError('Failed to load your applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  if (loading) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <h1 style={{ marginBottom: 24 }}>My Applications</h1>

      {error && <p className="form-error">{error}</p>}

      {applications.length === 0 && !error && (
        <div className="card">
          <p style={{ margin: 0 }}>
            You haven't applied to any jobs yet. <Link to="/jobs">Browse listings →</Link>
          </p>
        </div>
      )}

      {applications.map((app) => (
        <div key={app._id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ marginBottom: 2 }}>
                <Link to={`/jobs/${app.job?._id}`}>{app.job?.title}</Link>
              </h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{app.job?.location}</p>
            </div>
            <span className={`tag ${statusTag[app.status] || 'tag-pending'}`}>{app.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyApplications;