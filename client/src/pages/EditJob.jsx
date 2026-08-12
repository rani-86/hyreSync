import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById, updateJob } from '../services/api';

function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', skillsRequired: '', location: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await getJobById(id);
        setFormData({
          title: res.data.title,
          description: res.data.description,
          skillsRequired: (res.data.skillsRequired || []).join(', '),
          location: res.data.location,
        });
      } catch (err) {
        setError('Failed to load job');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

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
      await updateJob(id, payload);
      navigate(`/jobs/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update job');
    }
  };

  if (loading) return <div className="page">Loading…</div>;

  return (
    <div className="page-narrow">
      <h1 style={{ textAlign: 'center', marginBottom: 4 }}>Edit job</h1>

      <form onSubmit={handleSubmit} className="card">
        <label htmlFor="title">Job title</label>
        <input id="title" name="title" value={formData.title} onChange={handleChange} required />

        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange} required />

        <label htmlFor="skillsRequired">Skills</label>
        <input id="skillsRequired" name="skillsRequired" value={formData.skillsRequired} onChange={handleChange} />

        <label htmlFor="location">Location</label>
        <input id="location" name="location" value={formData.location} onChange={handleChange} />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Save changes
        </button>
      </form>
    </div>
  );
}

export default EditJob;