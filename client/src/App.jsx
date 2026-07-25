import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobApplicants from './pages/JobApplicants';
import Jobs from './pages/Jobs';
import PostJob from './pages/PostJob';
import JobDetails from './pages/JobDetails';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/jobs" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/new" element={<PostJob />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/jobs/:id/applicants" element={<JobApplicants />} />
      </Routes>
    </>
  );
}

export default App;