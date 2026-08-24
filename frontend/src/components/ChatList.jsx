import React from 'react';
import { Search, Plus, MessageSquare, Lock, Flame } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const ChatList = ({ onOpenNewChat, onOpenPrivateVaultModal }) => {
  const {
    chats,
    activeChat,
    setActiveChat,
    activeTab,
    setActiveTab,
    isVaultUnlocked,
    searchQuery,
    setSearchQuery,
    isLoadingChats,
  } = useChat();

  const { isUserOnline } = useSocket();
  const { user } = useAuth();

  // Filter conversations based on tab & search query
  const filteredChats = chats.filter((chat) => {
    // Search query filter
    const matchesSearch =
      chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.latestMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Vault Tab Filter
    if (activeTab === 'vault') {
      return chat.isPrivate;
    }

    // Direct Tab Filter
    if (activeTab === 'direct') {
      return !chat.isPrivate;
    }

    // All Tab (Exclude private if vault is locked)
    if (chat.isPrivate && !isVaultUnlocked) {
      return false;
    }

    return true;
  });

  const handleTabClick = (tab) => {
    if (tab === 'vault' && !isVaultUnlocked) {
      onOpenPrivateVaultModal && onOpenPrivateVaultModal();
    } else {
      setActiveTab(tab);
    }
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      style={{
        width: '340px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Search and Action Bar */}
      <div style={{ padding: '16px 16px 12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Messages
          </h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onOpenNewChat}
              className="btn-icon"
              title="Start New Chat"
              style={{ background: 'rgba(0, 242, 254, 0.12)', color: 'var(--accent-cyan)' }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="input-field"
            style={{ paddingLeft: '40px', fontSize: '13px', borderRadius: '12px' }}
          />
        </div>
      </div>

      {/* Filter Tabs (All, Direct, Vault) */}
      <div
        style={{
          display: 'flex',
          padding: '0 16px 12px 16px',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {[
          { key: 'all', label: 'All' },
          { key: 'direct', label: 'Direct' },
          { key: 'vault', label: 'Vault 🔒' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: '20px',
              border: 'none',
              background: activeTab === tab.key ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === tab.key ? '#07090e' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chat List Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {isLoadingChats ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading conversations...
          </div>
        ) : filteredChats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
            <MessageSquare size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ fontSize: '13px' }}>No conversations found</p>
            <button
              onClick={onOpenNewChat}
              style={{
                marginTop: '12px',
                background: 'transparent',
                border: '1px dashed var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Start a Conversation
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = activeChat?.id === chat.id;
            const isOnline = chat.otherMember ? isUserOnline(chat.otherMember.id) || chat.isOnline : false;

            return (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                  border: isSelected ? '1px solid rgba(0, 242, 254, 0.25)' : '1px solid transparent',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Avatar with Status Dot */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={chat.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(chat.name || 'chat')}`}
                    alt={chat.name}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: '#131826',
                      objectFit: 'cover',
                      border: '1px solid var(--border-subtle)',
                    }}
                  />
                  <span
                    className={`status-dot ${isOnline ? '' : 'offline'}`}
                    style={{ position: 'absolute', bottom: '-2px', right: '-2px' }}
                  />
                </div>

                {/* Info and Preview */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {chat.name || 'Conversation'}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatMessageTime(chat.lastMessageAt)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0,
                      }}
                    >
                      {chat.latestMessage
                        ? chat.latestMessage.isDeleted
                          ? 'Message deleted'
                          : chat.latestMessage.content || (chat.latestMessage.messageType !== 'text' ? `[${chat.latestMessage.messageType}]` : '')
                        : 'No messages yet'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                      {chat.isPrivate && <Lock size={12} color="var(--accent-purple)" />}
                      {chat.disappearingTimer > 0 && <Flame size={12} color="#ff007a" />}

                      {chat.unreadCount > 0 && (
                        <span
                          style={{
                            background: 'var(--accent-cyan)',
                            color: '#07090e',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '10px',
                            minWidth: '18px',
                            textAlign: 'center',
                          }}
                        >
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
