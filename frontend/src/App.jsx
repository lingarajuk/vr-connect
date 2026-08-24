import React from 'react';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import AppLockModal from './components/AppLockModal';

export const App = () => {
  const { isAuthenticated, isLoading, isAppLocked } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--accent-cyan)',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(0, 242, 254, 0.2)',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%',
              animation: 'typingBounce 1s infinite ease-in-out',
              margin: '0 auto 16px',
            }}
          />
          Initializing VR Connect...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <SocketProvider>
      <ChatProvider>
        {isAppLocked && <AppLockModal />}
        <ChatPage />
      </ChatProvider>
    </SocketProvider>
  );
};

export default App;
