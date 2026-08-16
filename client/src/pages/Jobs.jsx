import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobs } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await getJobs();
        setJobs(res.data);
      } catch (err) {
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) return <div className="page"><p className="loading-text">Loading jobs…</p></div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
        <h1>Job Listings</h1>
        {user?.role === 'recruiter' && (
          <Link to="/jobs/new">
            <button className="btn-primary">Post a job</button>
          </Link>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      {jobs.length === 0 && !error && (
        <div className="card">
          <p style={{ margin: 0 }}>No jobs posted yet.</p>
        </div>
      )}

      {jobs.map((job) => (
        <div key={job._id} className="card">
          <h3 style={{ marginBottom: 4 }}>
            <Link to={`/jobs/${job._id}`}>{job.title}</Link>
          </h3>
          <p style={{ margin: '0 0 12px 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            {job.location}{job.postedBy?.name ? ` · Posted by ${job.postedBy.name}` : ''}
          </p>
          <div>
            {job.skillsRequired?.map((skill) => (
              <span key={skill} className="tag tag-signal" style={{ marginRight: 6, marginBottom: 6, display: 'inline-block' }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Jobs;