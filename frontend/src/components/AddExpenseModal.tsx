import React, { useState } from 'react';
import { X, SplitSquareHorizontal, CheckCircle2 } from 'lucide-react';
import './Modal.css';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string, amount: number, paidBy: string) => void;
}

type SplitType = 'equal' | 'unequal' | 'percentage';

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paidBy, setPaidBy] = useState('You');
  const [currency, setCurrency] = useState('₹');
  const [splitType, setSplitType] = useState<SplitType>('equal');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description && amount && Number(amount) > 0) {
      onSubmit(description, Number(amount), paidBy);
      setDescription('');
      setAmount('');
      setPaidBy('You');
      setSplitType('equal');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-gradient">Add an Expense</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Description</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Dinner at the pub"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="amount-currency-row">
            <div className="input-group flex-1">
              <label className="input-label">Amount</label>
              <input
                type="number"
                className="input-field"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                required
              />
            </div>
            <div className="input-group currency-select">
              <label className="input-label">Currency</label>
              <select
                className="input-field"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="₹">₹ INR</option>
                <option value="$">$ USD</option>
                <option value="€">€ EUR</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Paid By</label>
            <select
              className="input-field"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
            >
              <option value="You">You</option>
              <option value="Rahul">Rahul</option>
              <option value="Priya">Priya</option>
              <option value="Amit">Amit</option>
            </select>
          </div>

          <div className="split-options">
            <label className="input-label mb-1 block">Split Options</label>
            <div className="split-toggle-group">
              <button 
                type="button" 
                className={`split-btn ${splitType === 'equal' ? 'active' : ''}`}
                onClick={() => setSplitType('equal')}
              >
                <SplitSquareHorizontal size={16} /> Equally
              </button>
              <button 
                type="button" 
                className={`split-btn ${splitType === 'unequal' ? 'active' : ''}`}
                onClick={() => setSplitType('unequal')}
              >
                Unequally
              </button>
              <button 
                type="button" 
                className={`split-btn ${splitType === 'percentage' ? 'active' : ''}`}
                onClick={() => setSplitType('percentage')}
              >
                By %
              </button>
            </div>
            
            {/* Mock for unequal split view */}
            {splitType === 'unequal' && (
              <div className="unequal-split-preview mt-2">
                <div className="mock-split-list">
                  <div className="mock-split-item">
                    <span>You</span>
                    <input type="number" className="mock-input" placeholder="0.00" value={amount ? Math.floor(Number(amount)*0.6) : ''} readOnly />
                  </div>
                  <div className="mock-split-item">
                    <span>Priya</span>
                    <input type="number" className="mock-input" placeholder="0.00" value={amount ? Math.ceil(Number(amount)*0.4) : ''} readOnly />
                  </div>
                </div>
                <p className="split-hint text-positive mt-1"><CheckCircle2 size={12} className="inline-icon" /> Split matches total amount</p>
              </div>
            )}
          </div>

          <div className="modal-actions mt-4">
            <button type="button" className="btn btn-secondary w-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary w-full shadow-glow">Save Expense</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
