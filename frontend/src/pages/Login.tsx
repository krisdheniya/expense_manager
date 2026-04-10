import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Wallet } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Connect to backend here later
    console.log('Logging in with', email);
    // Temporary redirect for UI testing
    navigate('/dashboard');
  };

  return (
    <div className="auth-page-container">
      {/* Decorative Background Elements */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      
      <div className="container flex-center" style={{ minHeight: '100vh', zIndex: 10, position: 'relative' }}>
        <div className="auth-card glass-card">
          <div className="auth-header">
            <div className="logo-icon-wrap mb-3 mx-auto" style={{ width: '48px', height: '48px' }}>
              <Wallet size={24} />
            </div>
            <h1 className="text-gradient">Welcome Back</h1>
            <p className="auth-subtitle">Log in to manage your group expenses</p>
          </div>
          
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  className="input-field has-icon" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="input-group mb-4">
              <div className="flex-between w-full mb-1">
                <label className="input-label mb-0">Password</label>
                <a href="#" className="forgot-password">Forgot?</a>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  className="input-field has-icon" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary w-full shadow-glow auth-submit">
              Sign In <ArrowRight size={18} />
            </button>
          </form>
          
          <p className="auth-footer">
            Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
