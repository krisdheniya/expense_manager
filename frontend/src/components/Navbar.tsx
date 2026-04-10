import { Link } from 'react-router-dom';
import { Wallet, LogOut, LayoutDashboard } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar glass">
      <div className="navbar-container container flex-between">
        <Link to="/" className="navbar-brand">
          <div className="logo-icon-wrap">
            <Wallet size={24} className="logo-icon" />
          </div>
          <span className="text-gradient brand-text">SplitMate</span>
        </Link>
        <div className="navbar-menu">
          <Link to="/dashboard" className="nav-link">
            <LayoutDashboard size={18} />
            <span className="nav-text">Dashboard</span>
          </Link>
          
          <div className="nav-divider"></div>
          
          <div className="user-profile">
            <div className="avatar">D</div>
            <span className="username nav-text">Demo User</span>
            <button className="btn-icon btn-logout" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
