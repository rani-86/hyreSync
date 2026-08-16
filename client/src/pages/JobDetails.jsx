import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJobById, applyToJob, deleteJob } from '../services/api';
import { useAuth } from '../context/AuthContext';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await getJobById(id);
        setJob(res.data);
      } catch (err) {
        setError('Job not found');
      }
    };
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    setApplyMessage('');
    setApplyError('');
    try {
      await applyToJob(id);
      setApplyMessage('Application submitted!');
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to apply');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this job posting? This cannot be undone.')) return;
    try {
      await deleteJob(id);
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete job');
    }
  };

  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!job) return <div className="page">Loading…</div>;

  const isOwner = user?.role === 'recruiter' && job.postedBy?._id === user.id;

  return (
    <div className="page">
      <Link to="/jobs">← Back to jobs</Link>

      <div className="card" style={{ marginTop: 20 }}>
        <h1 style={{ marginBottom: 4 }}>{job.title}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          {job.location} · Posted by {job.postedBy?.name}
        </p>

        <div style={{ marginBottom: 20 }}>
          {job.skillsRequired?.map((skill) => (
            <span key={skill} className="tag tag-signal" style={{ marginRight: 6, display: 'inline-block' }}>
              {skill}
            </span>
          ))}
        </div>

        <p style={{ marginBottom: 20 }}>{job.description}</p>

        {user?.role === 'candidate' && (
          <>
            <button className="btn-primary" onClick={handleApply}>Apply to this job</button>
            {applyMessage && <p className="form-success">{applyMessage}</p>}
            {applyError && <p className="form-error">{applyError}</p>}
          </>
        )}

        {isOwner && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/jobs/${id}/edit`}>
              <button className="btn-secondary">Edit job</button>
            </Link>
            <Link to={`/jobs/${id}/applicants`}>
              <button className="btn-secondary">View applicants</button>
            </Link>
            <button className="btn-secondary" onClick={handleDelete} style={{ color: 'var(--danger)' }}>
              Delete job
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDetails;