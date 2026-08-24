import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import ChatList from '../components/ChatList';
import ChatHeader from '../components/ChatHeader';
import ChatArea from '../components/ChatArea';
import ChatInput from '../components/ChatInput';
import ContactsModal from '../components/ContactsModal';
import ProfileModal from '../components/ProfileModal';
import SettingsModal from '../components/SettingsModal';
import PrivateChatModal from '../components/PrivateChatModal';
import MediaPreviewModal from '../components/MediaPreviewModal';
import CallModal from '../components/CallModal';

export const ChatPage = () => {
  const { activeChat, setActiveChat } = useChat();
  const { incomingCall, dismissCall } = useSocket();

  // Modals state
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [activeCallData, setActiveCallData] = useState(null);

  const startCall = (callType) => {
    if (!activeChat) return;
    setActiveCallData({
      type: callType,
      name: activeChat.name,
      avatar: activeChat.avatar,
      chatId: activeChat.id,
    });
  };

  const endCall = () => {
    setActiveCallData(null);
    dismissCall();
  };

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}
    >
      {/* 1. Global Navigation Sidebar */}
      <Sidebar
        onOpenContacts={() => setIsContactsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenVault={() => setIsVaultModalOpen(true)}
      />

      {/* 2. Conversations List Panel */}
      <div
        className={`${activeChat ? 'hide-on-mobile' : ''}`}
        style={{
          display: 'flex',
          height: '100%',
          flexShrink: 0,
        }}
      >
        <ChatList
          onOpenNewChat={() => setIsContactsOpen(true)}
          onOpenPrivateVaultModal={() => setIsVaultModalOpen(true)}
        />
      </div>

      {/* 3. Main Chat Stream Window */}
      <main
        className={`${!activeChat ? 'hide-on-mobile' : ''}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 242, 254, 0.03) 0%, transparent 60%)',
        }}
      >
        {activeChat ? (
          <>
            <ChatHeader
              onBack={() => setActiveChat(null)}
              onOpenInfo={() => setIsSettingsOpen(true)}
              onStartCall={startCall}
            />
            <ChatArea onPreviewMedia={(media) => setPreviewMedia(media)} />
            <ChatInput />
          </>
        ) : (
          <ChatArea onPreviewMedia={(media) => setPreviewMedia(media)} />
        )}
      </main>

      {/* Modals & Overlays */}
      <ContactsModal
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <PrivateChatModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />

      <MediaPreviewModal
        media={previewMedia}
        onClose={() => setPreviewMedia(null)}
      />

      {(activeCallData || incomingCall) && (
        <CallModal
          callData={activeCallData || incomingCall}
          onEndCall={endCall}
        />
      )}
    </div>
  );
};

export default ChatPage;
