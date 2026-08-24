import React, { useState } from 'react';
import { User, X, RefreshCw, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuth();

  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await updateUserProfile({
        avatar,
        statusMessage,
      });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update profile:', err.message);
    } finally {
      setIsSaving(false);
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
          maxWidth: '400px',
          padding: '28px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Edit Profile</h3>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Avatar Display & Randomizer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <img
              src={avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
              alt={user?.username}
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '24px',
                border: '2px solid var(--accent-cyan)',
                background: '#131826',
                objectFit: 'cover',
                boxShadow: 'var(--shadow-glow)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={generateRandomAvatar}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            <RefreshCw size={14} /> Generate Random Avatar
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="input-field"
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input-field"
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Status Message
            </label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. Connected in VR, Exploring Metaverse"
              className="input-field"
            />
          </div>

          {successMsg && (
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
              {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
