import React, { useState } from 'react';
import { Shield, Lock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import authService from '../services/auth';

export const PrivateChatModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { setIsVaultUnlocked, setActiveTab } = useChat();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!pin || pin.length !== 4) {
      setError('Please enter a valid 4-digit PIN.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (!user?.hasPin) {
        // First time setup PIN for private vault
        await authService.setupPin(pin);
      } else {
        await authService.verifyPin(pin);
      }

      setIsVaultUnlocked(true);
      setActiveTab('vault');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect security PIN. Access denied.');
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
          maxWidth: '380px',
          padding: '28px',
          border: '1px solid rgba(121, 40, 202, 0.4)',
          boxShadow: 'var(--shadow-glow-purple)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={22} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Private Vault</h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
          {user?.hasPin
            ? 'Enter your 4-digit security PIN to unlock your hidden encrypted conversations.'
            : 'Set a 4-digit security PIN to initialize your encrypted Private Vault.'}
        </p>

        <form onSubmit={handleUnlock}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              4-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="input-field"
              style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
              autoFocus
            />
          </div>

          {error && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--accent-rose)',
                fontSize: '12px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || pin.length !== 4}
              className="btn-primary"
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #7928ca 0%, #ff007a 100%)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(121, 40, 202, 0.4)',
              }}
            >
              {isSubmitting ? 'Verifying...' : 'Unlock Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrivateChatModal;
