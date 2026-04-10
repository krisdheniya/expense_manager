import React, { useState } from 'react';
import { X, Users, Type } from 'lucide-react';
import './Modal.css';

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, members: string[]) => void;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [members, setMembers] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onSubmit(name, members.split(',').map(m => m.trim()).filter(Boolean));
      setName('');
      setMembers('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-gradient">Create New Group</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Group Name</label>
            <div className="input-wrapper">
              <Type className="input-icon" size={18} />
              <input
                type="text"
                className="input-field has-icon"
                placeholder="e.g. Goa Trip 🏖️"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="input-group mb-4">
            <div className="flex-between">
              <label className="input-label">Add Members</label>
              <span className="text-muted" style={{fontSize: '0.8rem'}}>Comma separated</span>
            </div>
            <div className="input-wrapper">
              <Users className="input-icon" size={18} />
              <input
                type="text"
                className="input-field has-icon"
                placeholder="Rahul, Priya, Amit"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions mt-4">
            <button type="button" className="btn btn-secondary w-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary w-full shadow-glow">Create Group</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGroupModal;
