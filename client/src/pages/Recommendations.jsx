import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendedJobs } from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function Recommendations() {
  useDocumentTitle('Recommended');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await getRecommendedJobs();
        setRecommendations(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (loading) return <div className="page"><p className="loading-text">Finding jobs for you…</p></div>;

  return (
    <div className="page">
      <h1 style={{ marginBottom: 24 }}>Recommended for You</h1>

      {error && (
        <div className="card">
          <p className="form-error" style={{ margin: 0 }}>{error}</p>
          <p style={{ margin: '8px 0 0 0' }}>
            <Link to="/profile">Update your profile →</Link>
          </p>
        </div>
      )}

      {recommendations.map(({ job, score }) => (
        <div key={job._id} className="card">
          <h3 style={{ marginBottom: 4 }}>
            <Link to={`/jobs/${job._id}`}>{job.title}</Link>
          </h3>
          <p style={{ margin: '0 0 12px 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            {job.location}
          </p>
          <div className="match-meter">
            <div className="match-meter-track">
              <div className="match-meter-fill" style={{ width: `${score}%` }} />
            </div>
            <span className="match-meter-score">{score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Recommendations;