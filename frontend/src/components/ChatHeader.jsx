import React, { useState } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Flame, Lock, ShieldCheck, Users } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';

export const ChatHeader = ({ onBack, onOpenInfo, onStartCall }) => {
  const { activeChat, updateChatSettings } = useChat();
  const { isUserOnline } = useSocket();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  if (!activeChat) return null;

  const isDirect = activeChat.type === 'direct';
  const partnerUser = activeChat.otherMember || activeChat.members?.find((m) => m.id !== activeChat.adminId);
  const isOnline = isDirect && partnerUser ? isUserOnline(partnerUser.id) || activeChat.isOnline : false;

  const toggleDisappearingTimer = async (seconds) => {
    await updateChatSettings(activeChat.id, { disappearingTimer: seconds });
    setShowSettingsDropdown(false);
  };

  const togglePrivateChat = async () => {
    await updateChatSettings(activeChat.id, { isPrivate: !activeChat.isPrivate });
    setShowSettingsDropdown(false);
  };

  return (
    <header
      style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(13, 17, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Left: Back button & Partner Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <button
          onClick={onBack}
          className="btn-icon hide-on-desktop"
          style={{ width: '36px', height: '36px' }}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ position: 'relative' }}>
          <img
            src={activeChat.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeChat.name || 'chat')}`}
            alt={activeChat.name}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: '#131826',
              border: '2px solid rgba(0, 242, 254, 0.3)',
              objectFit: 'cover',
            }}
          />
          {isDirect && (
            <span
              className={`status-dot ${isOnline ? '' : 'offline'}`}
              style={{ position: 'absolute', bottom: '-2px', right: '-2px' }}
            />
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeChat.name || 'Conversation'}
            </h3>

            {activeChat.isPrivate && (
              <span
                title="End-to-End Encrypted Private Chat"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: 'rgba(121, 40, 202, 0.25)',
                  border: '1px solid rgba(121, 40, 202, 0.5)',
                  color: 'var(--accent-purple)',
                  fontWeight: 600,
                }}
              >
                <Lock size={10} /> Vault
              </span>
            )}

            {activeChat.disappearingTimer > 0 && (
              <span
                title={`Disappearing messages active: ${activeChat.disappearingTimer}s`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: 'rgba(255, 0, 122, 0.2)',
                  border: '1px solid rgba(255, 0, 122, 0.4)',
                  color: '#ff4d94',
                  fontWeight: 600,
                }}
              >
                <Flame size={10} />
              </span>
            )}
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isDirect
              ? isOnline
                ? 'Online'
                : 'Offline'
              : `${activeChat.members?.length || 0} members`}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onStartCall && onStartCall('audio')}
          className="btn-icon"
          title="Start Voice Call"
        >
          <Phone size={18} />
        </button>

        <button
          onClick={() => onStartCall && onStartCall('video')}
          className="btn-icon"
          title="Start Video Call"
        >
          <Video size={18} />
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            className="btn-icon"
            title="Chat Options"
          >
            <MoreVertical size={18} />
          </button>

          {showSettingsDropdown && (
            <div
              className="glass-card animate-fade-in"
              style={{
                position: 'absolute',
                top: '48px',
                right: '0',
                width: '230px',
                padding: '8px',
                zIndex: 50,
                background: 'rgba(16, 22, 36, 0.95)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Disappearing Messages
              </div>
              {[
                { label: 'Off', seconds: 0 },
                { label: '30 Seconds', seconds: 30 },
                { label: '5 Minutes', seconds: 300 },
                { label: '1 Hour', seconds: 3600 },
                { label: '24 Hours', seconds: 86400 },
              ].map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={() => toggleDisappearingTimer(opt.seconds)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: activeChat.disappearingTimer === opt.seconds ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: activeChat.disappearingTimer === opt.seconds ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{opt.label}</span>
                  {activeChat.disappearingTimer === opt.seconds && <Flame size={14} />}
                </button>
              ))}

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />

              <button
                onClick={togglePrivateChat}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Lock size={14} color="var(--accent-purple)" />
                <span>{activeChat.isPrivate ? 'Remove Vault Protection' : 'Move to Private Vault'}</span>
              </button>

              <button
                onClick={() => {
                  setShowSettingsDropdown(false);
                  onOpenInfo && onOpenInfo();
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Users size={14} color="var(--accent-cyan)" />
                <span>View Conversation Info</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
