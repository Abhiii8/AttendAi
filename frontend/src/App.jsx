import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import FacultyManagement from './pages/FacultyManagement';
import Departments from './pages/Departments';
import Courses from './pages/Courses';
import Subjects from './pages/Subjects';
import FacultyStudents from './pages/FacultyStudents';
import GenerateQR from './pages/GenerateQR';
import ScanQR from './pages/ScanQR';
import AdminClasses from './pages/AdminClasses';
import FacultyClasses from './pages/FacultyClasses';

import Timetable from './pages/Timetable';

import Records from './pages/Records';
import History from './pages/History';
import StudentReports from './pages/StudentReports';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="faculty" element={<FacultyManagement />} />
          <Route path="courses" element={<Courses />} />
          <Route path="departments" element={<Departments />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="users" element={<Users />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="my-classes" element={<FacultyClasses />} />
          <Route path="students" element={<FacultyStudents />} />
          <Route path="qr" element={<GenerateQR />} />
          <Route path="scan" element={<ScanQR />} />
          <Route path="records" element={<Records />} />
          <Route path="reports" element={<StudentReports />} />
          <Route path="student-reports" element={<StudentReports />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
