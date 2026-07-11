import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobs } from '../services/api';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

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

  if (loading) return <p>Loading jobs...</p>;

  return (
    <div>
      <h2>Job Listings</h2>

      {user?.role === 'recruiter' && (
        <Link to="/jobs/new">
          <button>Post a Job</button>
        </Link>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {jobs.length === 0 && !error && <p>No jobs posted yet.</p>}

      {jobs.map((job) => (
        <div key={job._id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <h3>
            <Link to={`/jobs/${job._id}`}>{job.title}</Link>
          </h3>
          <p>{job.location}</p>
          <p>Posted by: {job.postedBy?.name}</p>
          <p>Skills: {job.skillsRequired?.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}

export default Jobs;