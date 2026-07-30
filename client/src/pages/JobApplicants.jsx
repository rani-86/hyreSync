import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplicantsWithFitScores, updateApplicationStatus } from '../services/api';

function getMatchLabel(score) {
  if (score === null || score === undefined) return { text: 'Not scored', tone: 'tag-pending' };
  if (score >= 40) return { text: 'Strong match', tone: 'tag-signal' };
  if (score >= 15) return { text: 'Worth a look', tone: 'tag-pending' };
  return { text: 'Limited overlap', tone: 'tag-danger' };
}

const statusTone = {
  pending: 'tag-pending',
  accepted: 'tag-signal',
  rejected: 'tag-danger',
};

function JobApplicants() {
  const { id } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchApplicants = async () => {
    try {
      const res = await getApplicantsWithFitScores(id);
      setApplicants(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [id]);

  const handleStatusChange = async (applicationId, status) => {
    setUpdatingId(applicationId);
    try {
      await updateApplicationStatus(applicationId, status);
      setApplicants((prev) =>
        prev.map((app) => (app._id === applicationId ? { ...app, status } : app))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="page">Loading applicants…</div>;

  return (
    <div className="page">
      <Link to={`/jobs/${id}`}>← Back to job</Link>
      <h1 style={{ marginTop: 20, marginBottom: 24 }}>Applicants</h1>

      {error && <p className="form-error">{error}</p>}

      {applicants.length === 0 && !error && (
        <div className="card"><p style={{ margin: 0 }}>No applicants yet.</p></div>
      )}

      {applicants.map((app) => {
        const score = app.fitScore;
        const match = getMatchLabel(score);
        const displayScore = score === null || score === undefined ? 0 : score;

        return (
          <div key={app._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <h3 style={{ marginBottom: 2 }}>{app.candidate?.name}</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{app.candidate?.email}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={`tag ${match.tone}`}>{match.text}</span>
                <span className={`tag ${statusTone[app.status] || 'tag-pending'}`}>{app.status}</span>
              </div>
            </div>

            <div className="match-meter">
              <div className="match-meter-track">
                <div className="match-meter-fill" style={{ width: `${displayScore}%` }} />
              </div>
              <span className="match-meter-score">{score !== null && score !== undefined ? score : '—'}</span>
            </div>

            {app.explanation && (
              <p style={{ marginTop: 12, marginBottom: 12, fontSize: '0.92rem' }}>{app.explanation}</p>
            )}

            {app.candidate?.resumeUrl && (
              <p style={{ marginBottom: 12 }}>
                <a href={app.candidate.resumeUrl} target="_blank" rel="noreferrer">View resume →</a>
              </p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                disabled={app.status === 'accepted' || updatingId === app._id}
                onClick={() => handleStatusChange(app._id, 'accepted')}
              >
                Accept
              </button>
              <button
                className="btn-secondary"
                disabled={app.status === 'rejected' || updatingId === app._id}
                onClick={() => handleStatusChange(app._id, 'rejected')}
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default JobApplicants;