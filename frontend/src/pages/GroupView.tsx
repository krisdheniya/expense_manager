import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Plus, Settings, PieChart, Calendar, Banknote } from 'lucide-react';
import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';
import './GroupView.css';

const GroupView = () => {
  const { groupId } = useParams();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Mock Data
  const group = {
    id: groupId,
    name: 'Euro Trip ✈️',
    members: ['You', 'Rahul', 'Priya', 'Amit'],
    totalExpenses: 84500,
  };

  const expenses = [
    { 
      id: 1, 
      description: 'Flight to Paris', 
      amount: 45000, 
      paidBy: 'Rahul', 
      date: 'Aug 10', 
      type: 'equal',
      currency: '₹'
    },
    { 
      id: 2, 
      description: 'Eiffel Tower Tickets', 
      amount: 80, 
      paidBy: 'You', 
      date: 'Aug 12', 
      type: 'unequal',
      currency: '€',
      splitDetails: 'You (40€), Priya (40€)' // Mock uneven split info
    },
    { 
      id: 3, 
      description: 'Cab to Hotel', 
      amount: 25, 
      paidBy: 'Priya', 
      date: 'Aug 12', 
      type: 'percentage',
      currency: '€'
    },
  ];

  return (
    <div className="container page-container">
      <div className="group-header-glass">
        <div className="group-header-content">
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="group-title-row">
            <h1 className="text-gradient mb-0">{group.name}</h1>
            <button className="btn-icon">
              <Settings size={20} />
            </button>
          </div>
          <div className="group-members-list">
            {group.members.map((m, i) => (
              <span key={i} className="member-badge">{m}</span>
            ))}
          </div>
        </div>
        <div className="group-header-actions">
          <div className="total-expense-badge">
            <span>Total Group Expense</span>
            <h3>₹{group.totalExpenses.toLocaleString()}</h3>
          </div>
          <button 
            className="btn btn-primary shadow-glow"
            onClick={() => setShowExpenseModal(true)}
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      <div className="group-content-grid">
        {/* Expenses Timeline */}
        <div className="expenses-section glass-card">
          <div className="section-title mb-3">
            <Calendar className="section-icon" size={24} />
            <h2>Timeline</h2>
          </div>
          
          <div className="expenses-timeline">
            {expenses.map((expense, i) => (
              <div key={expense.id} className="timeline-item" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="timeline-date">
                  <span className="date-text">{expense.date}</span>
                </div>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="expense-card glass">
                    <div className="expense-card-header">
                      <div className="expense-primary-info">
                        <div className="expense-avatar">{expense.paidBy[0]}</div>
                        <div>
                          <h4 className="expense-desc">{expense.description}</h4>
                          <p className="expense-meta">
                            {expense.paidBy} paid 
                            {expense.type === 'unequal' && <span className="split-badge unequal">Unequal</span>}
                            {expense.type === 'percentage' && <span className="split-badge percentage">%</span>}
                          </p>
                        </div>
                      </div>
                      <div className="expense-amount-wrap">
                        <div className="expense-amount">
                          {expense.currency}{expense.amount.toLocaleString()}
                        </div>
                        {expense.splitDetails && (
                          <div className="expense-split-details text-secondary">{expense.splitDetails}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balances Sidebar */}
        <div className="balances-sidebar">
          <div className="balances-section glass-card">
            <div className="section-title mb-3">
              <PieChart className="section-icon" size={24} />
              <h2>Balances</h2>
            </div>
            
            <div className="balances-list">
              <div className="balance-item">
                <div className="balance-users">
                  <div className="avatar-overlap">
                    <div className="avatar micro">Y</div>
                    <div className="avatar micro">R</div>
                  </div>
                  <span>You owe Rahul</span>
                </div>
                <span className="text-negative font-bold">₹1,450</span>
              </div>
              <div className="balance-item">
                <div className="balance-users">
                  <div className="avatar-overlap">
                    <div className="avatar micro">P</div>
                    <div className="avatar micro">Y</div>
                  </div>
                  <span>Priya owes You</span>
                </div>
                <span className="text-positive font-bold">₹500</span>
              </div>
              <div className="balance-item">
                <div className="balance-users">
                  <div className="avatar-overlap">
                    <div className="avatar micro">Y</div>
                    <div className="avatar micro">A</div>
                  </div>
                  <span>You owe Amit</span>
                </div>
                <span className="text-negative font-bold">€12</span>
              </div>
            </div>

            <div className="settle-up-container mt-4">
              <button 
                className="btn w-full btn-settle"
                onClick={() => setShowSettleModal(true)}
              >
                <Banknote size={18} /> Settle Up
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddExpenseModal 
        isOpen={showExpenseModal} 
        onClose={() => setShowExpenseModal(false)}
        onSubmit={(d, a, p) => console.log('Mock add', d, a, p)}
      />

      <SettleUpModal 
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
      />
    </div>
  );
};

export default GroupView;
