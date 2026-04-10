import { Link } from 'react-router-dom';
import { Users, Plus, IndianRupee, TrendingUp, Activity } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  // Mock data out of backend integration so far
  const groups = [
    { id: '1', name: 'Goa Trip 🏖️', balance: 1450, youOwe: false, members: 4 },
    { id: '2', name: 'Pune Flatmates 🏠', balance: -450, youOwe: true, members: 3 },
    { id: '3', name: 'Dinner & Drinks 🍕', balance: 0, youOwe: false, members: 6 },
    { id: '4', name: 'Office Lunch 🍔', balance: 120, youOwe: false, members: 5 },
  ];

  const totalBalance = groups.reduce((acc, g) => acc + (g.youOwe ? g.balance : g.balance), 0);
  const isTotalNegative = totalBalance < 0;

  return (
    <div className="container page-container">
      <header className="dashboard-header">
        <div className="header-greeting">
          <h1 className="text-gradient">Dashboard</h1>
          <p className="subtitle">Welcome back, Demo User. Here's your financial overview.</p>
        </div>
        
        <div className="balance-hero glass">
          <div className="balance-hero-content">
            <p className="balance-label">Total Balance</p>
            <h2 className={`balance-amount ${isTotalNegative ? 'text-negative' : totalBalance > 0 ? 'text-positive' : ''}`}>
              {isTotalNegative ? '-' : totalBalance > 0 ? '+' : ''}₹{Math.abs(totalBalance).toLocaleString()}
            </h2>
            <p className="balance-subtext">
              {isTotalNegative ? 'You owe money overall' : 'You are owed overall'}
            </p>
          </div>
          <div className="balance-hero-icon-wrap">
            <TrendingUp size={36} className={`balance-icon ${isTotalNegative ? 'icon-negative' : 'icon-positive'}`} />
          </div>
        </div>
      </header>

      <div className="dashboard-actions">
        <div className="section-title">
          <Users className="section-icon" size={24} />
          <h2>Your Groups</h2>
        </div>
        <button className="btn btn-primary shadow-glow">
          <Plus size={18} /> Create New Group
        </button>
      </div>

      <div className="groups-grid">
        {groups.map((group, index) => (
          <Link to={`/group/${group.id}`} key={group.id} className="group-card glass-card block-link" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="group-card-header">
              <h3 className="group-name">{group.name}</h3>
              <div className="group-members-badge">
                <Users size={14} />
                <span>{group.members}</span>
              </div>
            </div>
            
            <div className="group-card-body">
              <div className={`status-indicator ${group.balance === 0 ? 'settled' : group.youOwe ? 'owes' : 'owed'}`}></div>
              <div className="group-meta">
                {group.balance === 0 ? (
                  <span className="settled-text">Settled Up</span>
                ) : (
                  <div className={group.youOwe ? 'text-negative' : 'text-positive'}>
                    <span className="owe-label">{group.youOwe ? 'You owe' : 'You are owed'}</span>
                    <span className="owe-amount">₹{Math.abs(group.balance).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="recent-activity mt-4">
        <div className="section-title">
          <Activity className="section-icon" size={24} />
          <h2>Recent Activity</h2>
        </div>
        <div className="activity-list glass-card">
          <div className="activity-item">
            <div className="activity-icon-wrap positive-bg"><IndianRupee size={16} /></div>
            <div className="activity-details">
              <h4>Rahul paid you</h4>
              <p>For "Goa Trip 🏖️"</p>
            </div>
            <div className="activity-amount text-positive">+₹500</div>
          </div>
          <div className="activity-item">
            <div className="activity-icon-wrap negative-bg"><IndianRupee size={16} /></div>
            <div className="activity-details">
              <h4>You paid Priya</h4>
              <p>For "Dinner & Drinks 🍕"</p>
            </div>
            <div className="activity-amount text-negative">-₹1,200</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
