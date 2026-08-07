import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Signup from './pages/Signup';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import PostJob from './pages/PostJob';
import JobDetails from './pages/JobDetails';
import JobApplicants from './pages/JobApplicants';
import MyApplications from './pages/MyApplications';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/jobs" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/jobs/new" element={
          <ProtectedRoute requiredRole="recruiter"><PostJob /></ProtectedRoute>
        } />
        <Route path="/jobs/:id/applicants" element={
          <ProtectedRoute requiredRole="recruiter"><JobApplicants /></ProtectedRoute>
        } />
        <Route path="/my-applications" element={
          <ProtectedRoute requiredRole="candidate"><MyApplications /></ProtectedRoute>
        } />
        <Route path="/profile" element={
        <ProtectedRoute requiredRole="candidate"><Profile /></ProtectedRoute>
      } />
      <Route path="/recommendations" element={
        <ProtectedRoute requiredRole="candidate"><Recommendations /></ProtectedRoute>
      } />
      </Routes>
    </>
  );
}

export default App;