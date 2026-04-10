import React from 'react';
import { X, Banknote } from 'lucide-react';
import './Modal.css';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettleUpModal: React.FC<SettleUpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card settle-modal text-center" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header justify-end">
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="settle-hero">
          <div className="settle-icon-wrap">
            <Banknote size={48} className="text-positive" />
          </div>
          <h2 className="mt-3">Settle Up</h2>
          <p className="text-secondary">Record a payment to settle balances</p>
        </div>

        <form className="mt-4 text-left">
          <div className="settle-payment-flow">
            <div className="input-group">
              <label className="input-label">Who Paid</label>
              <select className="input-field shadow-sm">
                <option>You</option>
                <option>Priya</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">To Whom</label>
              <select className="input-field shadow-sm">
                <option>Rahul</option>
                <option>Amit</option>
              </select>
            </div>
          </div>
          
          <div className="input-group mt-3">
            <label className="input-label">Amount</label>
            <div className="input-wrapper">
              <span className="input-icon font-bold">₹</span>
              <input type="number" className="input-field has-icon text-center font-bold" style={{fontSize: '1.5rem'}} defaultValue="1450" />
            </div>
          </div>

          <div className="modal-actions mt-4">
            <button type="button" className="btn btn-secondary w-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary w-full" style={{background: 'var(--positive)'}}>Record Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettleUpModal;
