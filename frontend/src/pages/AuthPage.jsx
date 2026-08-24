import React, { useState } from 'react';
import { Shield, Lock, Mail, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email || username, password);
      } else {
        await register(username, email, password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill for testing
  const handleQuickDemo = async (demoUsername) => {
    setUsername(demoUsername);
    setEmail(`${demoUsername}@vrconnect.io`);
    setPassword('password123');
    setError('');
    setIsLoading(true);

    try {
      // Attempt login, or register if account doesn't exist
      try {
        await login(`${demoUsername}@vrconnect.io`, 'password123');
      } catch (loginErr) {
        await register(demoUsername, `${demoUsername}@vrconnect.io`, 'password123');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Demo initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(0, 242, 254, 0.12) 0%, rgba(121, 40, 202, 0.08) 40%, #07090e 80%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Neon Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'rgba(0, 242, 254, 0.1)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'rgba(121, 40, 202, 0.12)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Glass Card */}
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px',
          position: 'relative',
          zIndex: 10,
          border: '1px solid rgba(0, 242, 254, 0.25)',
          boxShadow: 'var(--shadow-glow)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '18px',
              background: 'var(--gradient-card)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              boxShadow: 'var(--shadow-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <span style={{ fontWeight: 900, fontSize: '24px', color: 'var(--accent-cyan)' }}>VR</span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>
            <span className="text-gradient">VR Connect</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Next-Gen Real-Time Secure Messaging & Media
          </p>
        </div>

        {/* Tab Toggle (Sign In / Register) */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '9px',
              border: 'none',
              background: isLogin ? 'var(--gradient-primary)' : 'transparent',
              color: isLogin ? '#07090e' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '9px',
              border: 'none',
              background: !isLogin ? 'var(--gradient-primary)' : 'transparent',
              color: !isLogin ? '#07090e' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cyber_user"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {isLogin ? 'Email or Username' : 'Email Address'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={isLogin ? 'text' : 'email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isLogin ? 'user@vrconnect.io or username' : 'user@vrconnect.io'}
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div
              className="animate-fade-in"
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--accent-rose)',
                fontSize: '12px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', marginBottom: '16px' }}
          >
            {isLoading ? 'Connecting...' : isLogin ? 'Access VR Connect' : 'Register Account'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Test Buttons */}
        <div style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px' }}>
            Instant Pair Programming / Demo Access:
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('Alice_VR')}
              className="btn-secondary"
              style={{ flex: 1, fontSize: '11px', padding: '8px 10px' }}
            >
              <Sparkles size={12} color="var(--accent-cyan)" /> Alice (User 1)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('Bob_Matrix')}
              className="btn-secondary"
              style={{ flex: 1, fontSize: '11px', padding: '8px 10px' }}
            >
              <Sparkles size={12} color="var(--accent-purple)" /> Bob (User 2)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
