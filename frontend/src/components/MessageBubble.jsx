import React, { useState, useEffect } from 'react';
import { Check, CheckCheck, Trash2, FileText, Play, Pause, Download, Flame, Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth';

export const MessageBubble = ({ message, onDelete, onPreviewMedia }) => {
  const { user } = useAuth();
  const isOutgoing = message.senderId === user?.id;
  const isDeleted = message.isDeleted;

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioElement, setAudioElement] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [isSavedMemory, setIsSavedMemory] = useState(false);

  // Disappearing countdown calculator
  useEffect(() => {
    if (!message.isDisappearing || !message.expiresAt || isDeleted) return;

    const updateCountdown = () => {
      const remainingMs = new Date(message.expiresAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        setTimeLeft('Expiring...');
      } else {
        const seconds = Math.floor((remainingMs / 1000) % 60);
        const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));

        if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
        else if (minutes > 0) setTimeLeft(`${minutes}m ${seconds}s`);
        else setTimeLeft(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [message.isDisappearing, message.expiresAt, isDeleted]);

  // Audio player toggle
  const togglePlayAudio = (url) => {
    if (!audioElement) {
      const audio = new Audio(url);
      audio.ontimeupdate = () => {
        setAudioProgress((audio.currentTime / audio.duration) * 100 || 0);
      };
      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
      };
      audio.play();
      setAudioElement(audio);
      setIsPlayingAudio(true);
    } else {
      if (isPlayingAudio) {
        audioElement.pause();
        setIsPlayingAudio(false);
      } else {
        audioElement.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const handleSaveToMemories = async () => {
    try {
      await authService.saveMemory({
        messageId: message.id,
        content: message.content,
        mediaUrl: message.fileUrl,
        mediaType: message.messageType,
        senderName: message.sender?.username || (isOutgoing ? user?.username : 'Contact'),
        timestamp: message.createdAt,
      });
      setIsSavedMemory(true);
    } catch (e) {
      console.error('Failed to save to memories:', e.message);
    }
  };

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOutgoing ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '75%',
          minWidth: '100px',
          padding: isDeleted ? '10px 14px' : '10px 14px 6px 14px',
          borderRadius: isOutgoing ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isDeleted
            ? 'rgba(255, 255, 255, 0.04)'
            : isOutgoing
            ? 'linear-gradient(135deg, #0052cc 0%, #7928ca 100%)'
            : 'rgba(24, 30, 48, 0.9)',
          border: isDeleted
            ? '1px dashed rgba(255, 255, 255, 0.15)'
            : isOutgoing
            ? '1px solid rgba(0, 242, 254, 0.25)'
            : '1px solid var(--border-subtle)',
          boxShadow: isOutgoing ? '0 4px 16px rgba(121, 40, 202, 0.25)' : 'var(--shadow-sm)',
          color: isDeleted ? 'var(--text-muted)' : 'var(--text-primary)',
          wordBreak: 'break-word',
        }}
      >
        {/* Disappearing indicator pill */}
        {message.isDisappearing && !isDeleted && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '20px',
              background: 'rgba(255, 0, 122, 0.2)',
              border: '1px solid rgba(255, 0, 122, 0.4)',
              color: '#ff4d94',
              fontSize: '10px',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            <Flame size={12} />
            <span>Disappearing ({timeLeft || 'Active'})</span>
          </div>
        )}

        {/* Deleted Message Notice */}
        {isDeleted ? (
          <p style={{ fontStyle: 'italic', fontSize: '13px' }}>{message.content}</p>
        ) : (
          <>
            {/* Image Media Preview */}
            {message.messageType === 'image' && message.fileUrl && (
              <div
                style={{
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginBottom: message.content ? '8px' : '4px',
                  cursor: 'pointer',
                  maxHeight: '300px',
                  background: '#000',
                }}
                onClick={() => onPreviewMedia && onPreviewMedia({ type: 'image', url: message.fileUrl, name: message.fileName })}
              >
                <img
                  src={message.fileUrl}
                  alt={message.fileName || 'Shared image'}
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                  loading="lazy"
                />
              </div>
            )}

            {/* Video Media Player */}
            {message.messageType === 'video' && message.fileUrl && (
              <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '8px', maxHeight: '320px', background: '#000' }}>
                <video src={message.fileUrl} controls style={{ width: '100%', borderRadius: '10px' }} />
              </div>
            )}

            {/* Audio Voice Note */}
            {message.messageType === 'audio' && message.fileUrl && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '12px',
                  marginBottom: '6px',
                  minWidth: '220px',
                }}
              >
                <button
                  onClick={() => togglePlayAudio(message.fileUrl)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-cyan)',
                    color: '#07090e',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {isPlayingAudio ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${audioProgress}%`, height: '100%', background: 'var(--accent-cyan)' }} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    Voice Note
                  </span>
                </div>
              </div>
            )}

            {/* Document / File attachment */}
            {message.messageType === 'file' && message.fileUrl && (
              <a
                href={message.fileUrl}
                download={message.fileName}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  marginBottom: '6px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <FileText size={24} color="var(--accent-cyan)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {message.fileName || 'Download Attachment'}
                  </p>
                  {message.fileSize > 0 && (
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {(message.fileSize / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
                <Download size={16} color="var(--accent-cyan)" />
              </a>
            )}

            {/* Text Message Content */}
            {message.content && (
              <p style={{ fontSize: '14px', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                {message.content}
              </p>
            )}
          </>
        )}

        {/* Footer info: Timestamp & Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '4px',
            fontSize: '10px',
            color: isOutgoing ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
          }}
        >
          <span>{formatTime(message.createdAt)}</span>

          {/* Bookmark to Memories */}
          {!isDeleted && (
            <button
              onClick={handleSaveToMemories}
              title={isSavedMemory ? 'Saved to Memories' : 'Save to Memories'}
              style={{
                background: 'transparent',
                border: 'none',
                color: isSavedMemory ? '#00f2fe' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {isSavedMemory ? <BookmarkCheck size={13} color="#00f2fe" /> : <Bookmark size={13} />}
            </button>
          )}

          {isOutgoing && !isDeleted && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {message.status === 'read' ? (
                <CheckCheck size={14} color="#00f2fe" />
              ) : message.status === 'delivered' ? (
                <CheckCheck size={14} color="rgba(255,255,255,0.7)" />
              ) : (
                <Check size={14} color="rgba(255,255,255,0.7)" />
              )}
            </span>
          )}

          {isOutgoing && !isDeleted && (
            <button
              onClick={() => onDelete && onDelete(message.id)}
              title="Delete message"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
