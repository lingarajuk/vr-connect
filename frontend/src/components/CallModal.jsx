import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Maximize2 } from 'lucide-react';

export const CallModal = ({ callData, onEndCall }) => {
  if (!callData) return null;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(7, 9, 14, 0.95)',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '40px 24px',
          textAlign: 'center',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          boxShadow: 'var(--shadow-glow)',
        }}
      >
        {/* Partner Avatar & Call Pulse */}
        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 24px' }}>
          <div
            className="animate-pulse-glow"
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '32px',
              background: 'radial-gradient(circle, rgba(0, 242, 254, 0.4) 0%, transparent 70%)',
            }}
          />
          <img
            src={callData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(callData.name || 'User')}`}
            alt="Call Partner"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '28px',
              border: '3px solid var(--accent-cyan)',
              objectFit: 'cover',
              position: 'relative',
              zIndex: 2,
            }}
          />
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
          {callData.name || 'Calling...'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '8px' }}>
          {callData.type === 'video' ? 'VR HD Video Call' : 'VR Secure Voice Call'}
        </p>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {formatSeconds(callDuration)}
        </span>

        {/* Call Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '36px' }}>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="btn-icon"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: isMuted ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: isMuted ? 'var(--accent-rose)' : 'var(--text-primary)',
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {callData.type === 'video' && (
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className="btn-icon"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: isVideoOff ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: isVideoOff ? 'var(--accent-rose)' : 'var(--text-primary)',
              }}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>
          )}

          <button
            onClick={onEndCall}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#f43f5e',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(244, 63, 94, 0.4)',
            }}
            title="End Call"
          >
            <PhoneOff size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
