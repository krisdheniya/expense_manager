import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupView from './pages/GroupView';
import Navbar from './components/Navbar';

function App() {
  // Mock auth state for UI development
  const isAuthenticated = true;

  return (
    <Router>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/group/:groupId" element={isAuthenticated ? <GroupView /> : <Navigate to="/login" />} />

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
