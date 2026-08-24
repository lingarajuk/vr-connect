import React, { useState, useEffect } from 'react';
import { Search, X, UserPlus, MessageSquare } from 'lucide-react';
import authService from '../services/auth';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';

export const ContactsModal = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { startDirectChat } = useChat();
  const { isUserOnline } = useSocket();

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const data = await authService.getUsers(search);
        setUsers(data.users || []);
      } catch (err) {
        console.error('Failed to search users:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [isOpen, search]);

  if (!isOpen) return null;

  const handleSelectUser = async (targetUserId) => {
    try {
      await startDirectChat(targetUserId);
      onClose();
    } catch (err) {
      console.error('Failed to start chat:', err.message);
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
          maxWidth: '440px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Start a Conversation</h3>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by username or email..."
            className="input-field"
            style={{ paddingLeft: '40px', fontSize: '13px' }}
            autoFocus
          />
        </div>

        {/* User list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Searching directory...
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No matching users found.
            </div>
          ) : (
            users.map((item) => {
              const isOnline = isUserOnline(item.id) || item.isOnline;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectUser(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.03)',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={item.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.username)}`}
                        alt={item.username}
                        style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#131826', objectFit: 'cover' }}
                      />
                      <span className={`status-dot ${isOnline ? '' : 'offline'}`} style={{ position: 'absolute', bottom: '-2px', right: '-2px' }} />
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{item.username}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.statusMessage || item.email}</p>
                    </div>
                  </div>

                  <button
                    className="btn-icon"
                    style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--accent-cyan)', width: '34px', height: '34px' }}
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsModal;
