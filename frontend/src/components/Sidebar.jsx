import React from 'react';
import { MessageSquare, Users, Shield, Lock, Settings, LogOut, Moon, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

export const Sidebar = ({ onOpenProfile, onOpenSettings, onOpenContacts, onOpenVault }) => {
  const { user, logout, lockApp } = useAuth();
  const { activeTab, setActiveTab } = useChat();

  return (
    <aside
      style={{
        width: '72px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        background: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 30,
      }}
    >
      {/* Top Brand Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div
          title="VR Connect"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'var(--gradient-card)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            boxShadow: 'var(--shadow-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontWeight: 900, fontSize: '16px', color: 'var(--accent-cyan)' }}>VR</span>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => setActiveTab('all')}
            className={`btn-icon ${activeTab === 'all' || activeTab === 'direct' || activeTab === 'groups' ? 'active' : ''}`}
            title="Chats"
          >
            <MessageSquare size={20} />
          </button>

          <button
            onClick={onOpenContacts}
            className="btn-icon"
            title="Contacts & Users"
          >
            <Users size={20} />
          </button>

          <button
            onClick={onOpenVault}
            className={`btn-icon ${activeTab === 'vault' ? 'active' : ''}`}
            title="Private Vault (PIN Encrypted)"
            style={{
              color: activeTab === 'vault' ? 'var(--accent-purple)' : 'var(--text-secondary)',
              borderColor: activeTab === 'vault' ? 'rgba(121, 40, 202, 0.4)' : 'transparent',
            }}
          >
            <Shield size={20} />
          </button>

          {user?.hasPin && (
            <button
              onClick={lockApp}
              className="btn-icon"
              title="Lock App with PIN"
            >
              <Lock size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Bottom User Profile & Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onOpenSettings}
          className="btn-icon"
          title="Settings & Security"
        >
          <Settings size={20} />
        </button>

        <button
          onClick={logout}
          className="btn-icon"
          title="Logout"
          style={{ color: 'var(--accent-rose)' }}
        >
          <LogOut size={20} />
        </button>

        {/* User Avatar */}
        <div
          onClick={onOpenProfile}
          title={`${user?.username} (Click to edit profile)`}
          style={{ position: 'relative', cursor: 'pointer', marginTop: '6px' }}
        >
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.username || 'user')}`}
            alt={user?.username}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: '2px solid rgba(0, 242, 254, 0.4)',
              background: '#131826',
              objectFit: 'cover',
            }}
          />
          <span
            className="status-dot"
            style={{ position: 'absolute', bottom: '-2px', right: '-2px' }}
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
