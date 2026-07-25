import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../services/api';

function PostJob() {
  const [formData, setFormData] = useState({
    title: '', description: '', skillsRequired: '', location: '',
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
        skillsRequired: formData.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
      };
      await createJob(payload);
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    }
  };

  return (
    <div className="page-narrow">
      <h1 style={{ textAlign: 'center', marginBottom: 4 }}>Post a job</h1>
      <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 32 }}>
        Reach candidates on HireSync
      </p>

      <form onSubmit={handleSubmit} className="card">
        <label htmlFor="title">Job title</label>
        <input id="title" name="title" placeholder="Software Engineer" value={formData.title} onChange={handleChange} required />

        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" placeholder="What will this person do?" value={formData.description} onChange={handleChange} required />

        <label htmlFor="skillsRequired">Skills</label>
        <input id="skillsRequired" name="skillsRequired" placeholder="React, Node.js, MongoDB" value={formData.skillsRequired} onChange={handleChange} />

        <label htmlFor="location">Location</label>
        <input id="location" name="location" placeholder="Remote" value={formData.location} onChange={handleChange} />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Post job
        </button>
      </form>
    </div>
  );
}

export default PostJob;