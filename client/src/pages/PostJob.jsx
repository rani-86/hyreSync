import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../services/api';

function PostJob() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skillsRequired: '',
    location: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...formData,
        skillsRequired: formData.skillsRequired
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await createJob(payload);
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    }
  };

  return (
    <div>
      <h2>Post a Job</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Job Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Job Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <input
          name="skillsRequired"
          placeholder="Skills (comma separated, e.g. React, Node.js)"
          value={formData.skillsRequired}
          onChange={handleChange}
        />
        <input
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
        />
        <button type="submit">Post Job</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default PostJob;