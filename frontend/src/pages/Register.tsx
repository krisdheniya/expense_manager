import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Wallet } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registering with', name, email);
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
            <h1 className="text-gradient">Create Account</h1>
            <p className="auth-subtitle">Join SplitMate and simplify group expenses</p>
          </div>
          
          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input 
                  type="text" 
                  className="input-field has-icon" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>

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
              <label className="input-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  className="input-field has-icon" 
                  placeholder="Create a strong password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary w-full shadow-glow auth-submit">
              Sign Up <ArrowRight size={18} />
            </button>
          </form>
          
          <p className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
