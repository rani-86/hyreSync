import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../services/api';

function Profile() {
  const [skills, setSkills] = useState('');
  const [domainsOfInterest, setDomains] = useState('');
  const [education, setEducation] = useState([{ degree: '', institution: '', year: '' }]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setSkills((res.data.skills || []).join(', '));
        setDomains((res.data.domainsOfInterest || []).join(', '));
        if (res.data.education?.length > 0) {
          setEducation(res.data.education);
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEducationChange = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const addEducationRow = () => {
    setEducation([...education, { degree: '', institution: '', year: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await updateProfile({
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        domainsOfInterest: domainsOfInterest.split(',').map((s) => s.trim()).filter(Boolean),
        education: education.filter((e) => e.degree || e.institution),
      });
      setMessage('Profile updated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) return <div className="page"><p className="loading-text">Loading…</p></div>;

  return (
    <div className="page-narrow">
      <h1 style={{ textAlign: 'center', marginBottom: 4 }}>Your Profile</h1>
      <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 32 }}>
        We'll use this to recommend jobs to you
      </p>

      <form onSubmit={handleSubmit} className="card">
        <label htmlFor="skills">Skills</label>
        <input
          id="skills"
          placeholder="React, Node.js, MongoDB"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />

        <label htmlFor="domains">Domains of interest</label>
        <input
          id="domains"
          placeholder="Web Development, Backend Engineering"
          value={domainsOfInterest}
          onChange={(e) => setDomains(e.target.value)}
        />

        <label>Education</label>
        {education.map((edu, i) => (
          <div key={i} className="profile-education-row" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              placeholder="Degree"
              value={edu.degree}
              onChange={(e) => handleEducationChange(i, 'degree', e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <input
              placeholder="Institution"
              value={edu.institution}
              onChange={(e) => handleEducationChange(i, 'institution', e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <input
              placeholder="Year"
              value={edu.year}
              onChange={(e) => handleEducationChange(i, 'year', e.target.value)}
              style={{ marginBottom: 0, maxWidth: 100 }}
            />
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={addEducationRow} style={{ marginBottom: 16 }}>
          + Add another
        </button>

        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          Save profile
        </button>
      </form>
    </div>
  );
}

export default Profile;