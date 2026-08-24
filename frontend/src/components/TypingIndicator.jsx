import React from 'react';

export const TypingIndicator = ({ username }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0s' }}></span>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }}></span>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }}></span>
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
        {username ? `${username} is typing...` : 'typing...'}
      </span>
    </div>
  );
};

export default TypingIndicator;
