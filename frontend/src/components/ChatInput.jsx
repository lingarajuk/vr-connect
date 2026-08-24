import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, MicOff, Image, Video, File, X, Flame } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import messageService from '../services/messages';

const EMOJI_LIST = ['😀', '😂', '🔥', '❤️', '🚀', '👍', '🎉', '😎', '⚡', '✨', '🙌', '💯', '🦾', '💬', '👀', '💡'];

export const ChatInput = () => {
  const { activeChat, sendMessage } = useChat();
  const { socketService } = useSocket();

  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [disappearingDuration, setDisappearingDuration] = useState(0);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Sync disappearing timer default with active chat
  useEffect(() => {
    if (activeChat) {
      setDisappearingDuration(activeChat.disappearingTimer || 0);
    }
  }, [activeChat?.id, activeChat?.disappearingTimer]);

  // Handle typing status notification
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (activeChat) {
      socketService.startTyping(activeChat.id);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(activeChat.id);
      }, 2000);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message submit handler
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !selectedFile) || isUploading) return;

    if (activeChat) {
      socketService.stopTyping(activeChat.id);
    }

    try {
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;
      let messageType = 'text';

      if (selectedFile) {
        setIsUploading(true);
        const uploadResult = await messageService.uploadFile(selectedFile);
        fileUrl = uploadResult.fileUrl;
        fileName = uploadResult.fileName;
        fileSize = uploadResult.fileSize;
        messageType = uploadResult.fileType || 'file';
        setIsUploading(false);
      }

      await sendMessage({
        content: text.trim(),
        messageType,
        fileUrl,
        fileName,
        fileSize,
        disappearingDuration,
      });

      setText('');
      removeSelectedFile();
      setShowEmojiPicker(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to dispatch message:', error.message);
      setIsUploading(false);
    }
  };

  // Voice Note simulator
  const toggleVoiceRecording = async () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      // Simulating voice note recording (records for 3 seconds then sends sample voice waveform)
      setTimeout(async () => {
        setIsRecordingVoice(false);
        // Dispatch audio note placeholder
        await sendMessage({
          content: '🎙️ Voice Note (0:04)',
          messageType: 'audio',
          fileUrl: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
          fileName: 'voice_note.ogg',
          disappearingDuration,
        });
      }, 3000);
    } else {
      setIsRecordingVoice(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        padding: '12px 20px',
        background: 'rgba(13, 17, 26, 0.9)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
        position: 'relative',
      }}
    >
      {/* File Preview Bar */}
      {selectedFile && (
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            marginBottom: '10px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {filePreview ? (
            <img src={filePreview} alt="Preview" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
          ) : (
            <File size={32} color="var(--accent-cyan)" />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedFile.name}
            </p>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {(selectedFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
          <button onClick={removeSelectedFile} className="btn-icon" style={{ width: '28px', height: '28px' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          className="glass-card animate-fade-in"
          style={{
            position: 'absolute',
            bottom: '72px',
            left: '20px',
            padding: '10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '8px',
            zIndex: 40,
            background: 'rgba(16, 22, 36, 0.98)',
          }}
        >
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setText((prev) => prev + emoji);
              }}
              style={{
                fontSize: '20px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '8px',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-icon"
          title="Attach media or document"
        >
          <Paperclip size={18} />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`btn-icon ${showEmojiPicker ? 'active' : ''}`}
          title="Add emoji"
        >
          <Smile size={18} />
        </button>

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isRecordingVoice ? 'Recording voice note... (3s)' : 'Type a secure message...'}
          disabled={isRecordingVoice}
          rows={1}
          style={{
            flex: 1,
            background: 'rgba(10, 14, 24, 0.85)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            borderRadius: '16px',
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            resize: 'none',
            maxHeight: '120px',
          }}
        />

        {/* Voice Note Button */}
        <button
          type="button"
          onClick={toggleVoiceRecording}
          className={`btn-icon ${isRecordingVoice ? 'active glow-cyan' : ''}`}
          style={{
            background: isRecordingVoice ? 'rgba(255, 0, 122, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: isRecordingVoice ? '#ff007a' : 'transparent',
            color: isRecordingVoice ? '#ff007a' : 'var(--text-secondary)',
          }}
          title={isRecordingVoice ? 'Recording voice note...' : 'Record Voice Note'}
        >
          {isRecordingVoice ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || isUploading}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: text.trim() || selectedFile ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: text.trim() || selectedFile ? '#07090e' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: text.trim() || selectedFile ? 'pointer' : 'default',
            boxShadow: text.trim() || selectedFile ? '0 4px 16px rgba(0, 242, 254, 0.35)' : 'none',
            transition: 'all var(--transition-fast)',
          }}
          title="Send message"
        >
          <Send size={18} style={{ marginLeft: '2px' }} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
