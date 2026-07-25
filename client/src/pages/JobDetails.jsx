import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getJobById, applyToJob } from '../services/api';

function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

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

  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!job) return <div className="page">Loading…</div>;

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

        {user?.role === 'recruiter' && job.postedBy?._id === user.id && (
          <Link to={`/jobs/${id}/applicants`}>
            <button className="btn-secondary">View applicants</button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default JobDetails;