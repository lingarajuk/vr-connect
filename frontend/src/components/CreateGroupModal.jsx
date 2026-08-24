import React, { useState, useEffect } from 'react';
import { Users, X, Check, Shield } from 'lucide-react';
import authService from '../services/auth';
import { useChat } from '../context/ChatContext';

export const CreateGroupModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { createGroupChat } = useChat();

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        const data = await authService.getUsers('');
        setUsers(data.users || []);
      } catch (err) {
        console.error('Failed to load contacts:', err.message);
      }
    };

    fetchUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleUserSelection = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name.');
      return;
    }

    if (selectedUserIds.length === 0) {
      setError('Please select at least one participant.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createGroupChat(name.trim(), selectedUserIds, '', description.trim(), isPrivate);
      setName('');
      setDescription('');
      setSelectedUserIds([]);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(7, 9, 14, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '620px',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Create New Group</h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VR Core Engineering, Cyber Squad"
              className="input-field"
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Group purpose or guidelines"
              className="input-field"
            />
          </div>

          {/* Private Vault Checkbox */}
          <div
            onClick={() => setIsPrivate(!isPrivate)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(121, 40, 202, 0.15)',
              border: '1px solid rgba(121, 40, 202, 0.3)',
              marginBottom: '14px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--accent-purple)" />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700 }}>Private Vault Group</p>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Hide behind security PIN</span>
              </div>
            </div>
            <input type="checkbox" checked={isPrivate} onChange={() => {}} style={{ accentColor: 'var(--accent-purple)' }} />
          </div>

          {/* Member Selection */}
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Select Members ({selectedUserIds.length} selected)
          </label>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '8px' }}>
            {users.map((item) => {
              const isSelected = selectedUserIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleUserSelection(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={item.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.username)}`}
                      alt={item.username}
                      style={{ width: '32px', height: '32px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600 }}>{item.username}</p>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.email}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: isSelected ? 'none' : '2px solid var(--border-subtle)',
                      background: isSelected ? 'var(--accent-cyan)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && <Check size={14} color="#07090e" strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', fontSize: '12px', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || selectedUserIds.length === 0}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
