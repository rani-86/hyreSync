import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getJobById } from '../services/api';

function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');

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

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!job) return <p>Loading...</p>;

  return (
    <div>
      <Link to="/jobs">← Back to jobs</Link>
      <h2>{job.title}</h2>
      <p><strong>Location:</strong> {job.location}</p>
      <p><strong>Posted by:</strong> {job.postedBy?.name}</p>
      <p><strong>Skills:</strong> {job.skillsRequired?.join(', ')}</p>
      <p>{job.description}</p>
    </div>
  );
}

export default JobDetails;