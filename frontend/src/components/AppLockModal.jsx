import React, { useState, useRef, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AppLockModal = () => {
  const { verifyAppPin, logout, user } = useAuth();
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    // Move to next box
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // If 4 digits entered, auto verify
    if (index === 3 && value) {
      const fullPin = newPin.join('');
      if (fullPin.length === 4) {
        handleSubmit(fullPin);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (enteredPin) => {
    const finalPin = enteredPin || pin.join('');
    if (finalPin.length !== 4) {
      setError('Please enter your complete 4-digit PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyAppPin(finalPin);
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect PIN code. Try again.');
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(7, 9, 14, 0.95)',
        backdropFilter: 'blur(24px)',
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
          padding: '36px 28px',
          textAlign: 'center',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          boxShadow: 'var(--shadow-glow)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(0, 242, 254, 0.15)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Lock size={32} color="var(--accent-cyan)" />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
          VR Connect Locked
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong>. Enter your 4-digit security PIN to continue.
        </p>

        {/* PIN Digit Inputs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="pin-digit-box"
              disabled={isSubmitting}
            />
          ))}
        </div>

        {error && (
          <div
            className="animate-fade-in"
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              fontSize: '12px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={() => handleSubmit()}
          disabled={isSubmitting || pin.join('').length !== 4}
          className="btn-primary"
          style={{ width: '100%', marginBottom: '14px' }}
        >
          {isSubmitting ? 'Verifying PIN...' : 'Unlock Application'}
        </button>

        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Logout and switch account
        </button>
      </div>
    </div>
  );
};

export default AppLockModal;
