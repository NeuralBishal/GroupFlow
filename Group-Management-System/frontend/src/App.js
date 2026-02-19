import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Cookies from 'js-cookie';
import { Link } from 'react-router-dom';

// Landing Page
import LandingPage from './components/LandingPage';

// Student Components
import StudentLogin from './components/StudentLogin';
import Dashboard from './components/Dashboard';  // ✅ FIXED: Import as Dashboard
import CreateGroup from './components/CreateGroup';
import GroupLogin from './components/GroupLogin';
import GroupWindow from './components/GroupWindow';
import FirstLoginPasswordChange from './components/FirstLoginPasswordChange';
import StudentSettings from './components/StudentSettings';

// Faculty Components
import FacultyLogin from './components/FacultyLogin';
import FacultyDashboard from './components/FacultyDashboard';

// Admin Components
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminCreateFaculty from './components/AdminCreateFaculty';
import ManageDomains from './components/ManageDomains';
import FacultyImport from './components/FacultyImport';
import AdminGroups from './components/AdminGroups';
import AdminStudents from './components/AdminStudents';
import AdminProfile from './components/AdminProfile';
import AdminForgotPassword from './components/AdminForgotPassword';
import AdminFacultyOverview from './components/AdminFacultyOverview';


// Super Admin Components 
import SuperAdminLogin from './components/SuperAdminLogin';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import SuperAdminAdmins from './components/SuperAdminAdmins';
import SuperAdminAnalytics from './components/SuperAdminAnalytics';
import SuperAdminAuditLogs from './components/SuperAdminAuditLogs';
import SuperAdminEmergencyRecovery from './components/SuperAdminEmergencyRecovery';
import SuperAdminPaperKeys from './components/SuperAdminPaperKeys';
import SuperAdminSettings from './components/SuperAdminSettings';
import SuperAdminBiometric from './components/SuperAdminBiometric';
import ImportStudents from './components/ImportStudents';

// Common Components
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import PasswordReset from './components/PasswordReset';

// Set up axios
axios.defaults.baseURL = 'http://localhost:8000/api';
axios.defaults.withCredentials = true;

// CSRF Token Interceptor
axios.interceptors.request.use(
  config => {
    const csrfToken = Cookies.get('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Student Routes */}
          <Route path="/student/login" element={<StudentLogin setUser={setUser} />} />
          <Route path="/student/dashboard" element={user?.role === 'student' ? <Dashboard user={user} /> : <Navigate to="/" />} />  {/* ✅ FIXED: Changed StudentDashboard to Dashboard */}
          <Route path="/student/create-group" element={user?.role === 'student' ? <CreateGroup user={user} /> : <Navigate to="/" />} />
          <Route path="/student/group-login" element={user?.role === 'student' ? <GroupLogin user={user} /> : <Navigate to="/" />} />
          <Route path="/student/group/:groupId" element={user?.role === 'student' ? <GroupWindow user={user} /> : <Navigate to="/" />} />
          <Route path="/change-password" element={user?.is_first_login ? <FirstLoginPasswordChange user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/student/settings" element={user?.role === 'student' ? <StudentSettings user={user} /> : <Navigate to="/" />} />

          {/* Faculty Routes */}
          <Route path="/faculty/login" element={<FacultyLogin setUser={setUser} />} />
          <Route path="/faculty/dashboard" element={user?.role === 'faculty' ? <FacultyDashboard user={user} /> : <Navigate to="/" />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin setUser={setUser} />} />
          <Route path="/admin/dashboard" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/" />} />
          <Route path="/admin/faculties" element={user?.role === 'admin' ? <AdminCreateFaculty user={user} /> : <Navigate to="/" />} />
          <Route path="/admin/domains" element={user?.role === 'admin' ? <ManageDomains /> : <Navigate to="/" />} />
          <Route path="/admin/import-students" element={user?.role === 'admin' ? <ImportStudents /> : <Navigate to="/" />} />
          <Route path="/admin/faculty-import" element={user?.role === 'admin' ? <FacultyImport /> : <Navigate to="/" />} />
          <Route path="/admin/all-groups" element={user?.role === 'admin' ? <AdminGroups /> : <Navigate to="/" />} />
          <Route path="/admin/all-students" element={user?.role === 'admin' ? <AdminStudents /> : <Navigate to="/" />} />
          <Route path="/admin/profile" element={user?.role === 'admin' ? <AdminProfile user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin/faculty-overview" element={user?.role === 'admin' ? <AdminFacultyOverview /> : <Navigate to="/" />} />

          {/* Super Admin Routes */}
          <Route path="/super-admin/login" element={<SuperAdminLogin setUser={setUser} />} />
          <Route path="/super-admin/dashboard" element={user?.role === 'super_admin' ? <SuperAdminDashboard user={user} /> : <Navigate to="/" />} />
          <Route path="/super-admin/admins" element={user?.role === 'super_admin' ? <SuperAdminAdmins user={user} /> : <Navigate to="/" />} />
          <Route path="/super-admin/analytics" element={user?.role === 'super_admin' ? <SuperAdminAnalytics user={user} /> : <Navigate to="/" />} />
          <Route path="/super-admin/audit-logs" element={user?.role === 'super_admin' ? <SuperAdminAuditLogs user={user} /> : <Navigate to="/" />} />
          <Route path="/super-admin/emergency-recovery" element={user?.role === 'super_admin' ? <SuperAdminEmergencyRecovery user={user} /> : <Navigate to="/" />} />
          <Route path="/super-admin/paper-keys" element={user?.role === 'super_admin' ? <SuperAdminPaperKeys user={user} /> : <Navigate to="/" />} />
          <Route path="/super-admin/settings" element={user?.role === 'super_admin' ? <SuperAdminSettings user={user} /> : <Navigate to="/" />} />
          <Route path="/super-admin/biometric" element={user?.role === 'super_admin' ? <SuperAdminBiometric user={user} /> : <Navigate to="/" />} />  
          <Route path="/super-admin/import-students" element={user?.role === 'super_admin' ? <ImportStudents /> : <Navigate to="/" />} />

          {/* Common Routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:userId/:token" element={<ResetPassword />} />
          <Route path="/reset-password" element={<PasswordReset />} />

          {/* 404 Page */}
          <Route path="*" element={<div className="text-center mt-5"><h2>404 - Page Not Found</h2><Link to="/">Go Home</Link></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;