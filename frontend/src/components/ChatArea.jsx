import React, { useRef, useEffect } from 'react';
import { MessageSquare, ShieldCheck, Lock, Flame } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export const ChatArea = ({ onPreviewMedia }) => {
  const { activeChat, messages, isLoadingMessages, typingUsers, deleteMessage } = useChat();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  if (!activeChat) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center',
          background: 'radial-gradient(circle at center, rgba(0, 242, 254, 0.04) 0%, transparent 70%)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'var(--gradient-card)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <MessageSquare size={36} color="var(--accent-cyan)" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
          Welcome to <span className="text-gradient">VR Connect</span>
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: '1.6' }}>
          Select a conversation from the left or start a new direct or group chat to begin end-to-end real-time communication.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} color="var(--accent-emerald)" /> End-to-End Encrypted
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Flame size={14} color="#ff007a" /> Disappearing Messages
          </div>
        </div>
      </div>
    );
  }

  const activeTypingList = typingUsers[activeChat.id] || [];

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        background: 'rgba(7, 9, 14, 0.6)',
      }}
    >
      {/* Encryption Header Pill */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px 0' }}>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px 14px',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Lock size={12} color="var(--accent-cyan)" />
          Messages in this chat are secured and synced across your devices
        </span>
      </div>

      {/* Loading state */}
      {isLoadingMessages && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading messages...</span>
        </div>
      )}

      {/* Messages Stream */}
      {!isLoadingMessages && messages.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No messages here yet. Say hello to start the conversation! 👋
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onDelete={deleteMessage}
          onPreviewMedia={onPreviewMedia}
        />
      ))}

      {/* Typing Indicator */}
      {activeTypingList.length > 0 && (
        <div style={{ marginTop: '6px' }}>
          <TypingIndicator username={activeTypingList.join(', ')} />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatArea;
