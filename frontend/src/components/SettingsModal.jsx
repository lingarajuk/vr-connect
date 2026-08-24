import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  User,
  Mail,
  Lock,
  Key,
  Shield,
  Bell,
  Camera,
  Mic,
  MapPin,
  Image as ImageIcon,
  Flame,
  Bookmark,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  Check,
  AlertTriangle,
  Laptop,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth';

export const SettingsModal = ({ isOpen, onClose }) => {
  const { user, logout, updateUserProfile } = useAuth();

  // Sub-view navigation ('main' | 'username' | 'email' | 'password' | 'sessions' | 'linked' | 'permissions' | 'disappearing' | 'memories' | 'mydata')
  const [activeSubView, setActiveSubView] = useState('main');

  // Username edit state
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' });

  // Email edit state
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailStatus, setEmailStatus] = useState({ state: 'idle', message: '' });

  // Password edit state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ state: 'idle', message: '' });

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionMsg, setSessionMsg] = useState('');

  // Linked accounts state
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [linkFeedback, setLinkFeedback] = useState({ type: '', message: '' });
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnectProvider, setDisconnectProvider] = useState(null);

  // Permissions state
  const [permissions, setPermissions] = useState({
    notifications: 'prompt',
    camera: 'prompt',
    microphone: 'prompt',
    location: 'prompt',
    media: 'granted',
  });

  // Disappearing setting
  const [disappearingOption, setDisappearingOption] = useState(user?.settings?.message_delete_after_viewing || 'off');

  // Memories state
  const [memories, setMemories] = useState([]);

  // Modals & Confirmation dialogs
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const fetchLinkedAccounts = () => {
    authService.getLinkedAccounts().then((res) => {
      if (res.linkedAccounts) setLinkedAccounts(res.linkedAccounts);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!isOpen) {
      setActiveSubView('main');
      setLinkFeedback({ type: '', message: '' });
      return;
    }

    setNewUsername(user?.username || '');
    setNewEmail(user?.email || '');
    setUsernameStatus({ state: 'idle', message: '' });
    setEmailStatus({ state: 'idle', message: '' });
    setDisappearingOption(user?.settings?.message_delete_after_viewing || 'off');

    // Fetch live session info
    authService.getSessions().then((res) => {
      if (res.sessions) setSessions(res.sessions);
    }).catch(() => {});

    // Fetch linked accounts
    fetchLinkedAccounts();

    // Fetch memories
    authService.getMemories().then((res) => {
      if (res.memories) setMemories(res.memories);
    }).catch(() => {});

    // Query browser permissions if available
    if (navigator?.permissions?.query) {
      navigator.permissions.query({ name: 'notifications' }).then((p) => {
        setPermissions((prev) => ({ ...prev, notifications: p.state }));
      }).catch(() => {});
      navigator.permissions.query({ name: 'camera' }).then((p) => {
        setPermissions((prev) => ({ ...prev, camera: p.state }));
      }).catch(() => {});
      navigator.permissions.query({ name: 'microphone' }).then((p) => {
        setPermissions((prev) => ({ ...prev, microphone: p.state }));
      }).catch(() => {});
      navigator.permissions.query({ name: 'geolocation' }).then((p) => {
        setPermissions((prev) => ({ ...prev, location: p.state }));
      }).catch(() => {});
    }

    // Message listener for OAuth popup
    const handleOAuthMessage = (event) => {
      if (event.data && event.data.type === 'GOOGLE_LINK_RESULT') {
        setLinkingLoading(false);
        if (event.data.success) {
          setLinkFeedback({ type: 'success', message: event.data.message || 'Google account linked successfully!' });
          fetchLinkedAccounts();
        } else {
          setLinkFeedback({ type: 'error', message: event.data.message || 'Unable to connect Google account. Please try again.' });
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [isOpen, user]);

  if (!isOpen) return null;

  // --- Handlers ---

  const handleConnectGoogle = async () => {
    setLinkingLoading(true);
    setLinkFeedback({ type: '', message: '' });

    try {
      const token = localStorage.getItem('vr_token');
      const authData = await authService.getGoogleAuthUrl();

      if (authData.authUrl) {
        // Open Google sign-in consent in popup
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        window.open(
          authData.authUrl,
          'google_oauth_popup',
          `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
        );
      }
    } catch (err) {
      setLinkingLoading(false);
      const msg = err.response?.data?.message;
      if (msg && msg.includes('not configured')) {
        // Fallback for development if credentials haven't been provided in local .env yet
        const demoEmail = prompt('Google OAuth client credentials are not configured in .env. To test account linking in development, enter a Google email to link:', `${user?.username || 'user'}@gmail.com`);
        if (demoEmail && demoEmail.includes('@')) {
          try {
            await authService.directLinkGoogle('google_dev_sub_' + Date.now(), demoEmail);
            setLinkFeedback({ type: 'success', message: `Google account (${demoEmail}) linked successfully!` });
            fetchLinkedAccounts();
          } catch (e) {
            setLinkFeedback({ type: 'error', message: e.response?.data?.message || 'Failed to link Google account.' });
          }
        }
      } else {
        setLinkFeedback({ type: 'error', message: msg || 'Unable to start Google authentication flow.' });
      }
    }
  };

  const handleConfirmDisconnect = async () => {
    if (disconnectProvider === 'Google') {
      try {
        await authService.unlinkGoogle();
        setShowDisconnectModal(false);
        setDisconnectProvider(null);
        setLinkFeedback({ type: 'success', message: 'Google account unlinked successfully.' });
        fetchLinkedAccounts();
      } catch (err) {
        setLinkFeedback({ type: 'error', message: 'Failed to disconnect Google account.' });
      }
    }
  };

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setUsernameStatus({ state: 'error', message: 'Please enter a valid username.' });
      return;
    }

    setUsernameStatus({ state: 'checking', message: 'Validating and saving username...' });
    try {
      const res = await authService.updateUsername(newUsername.trim());
      setUsernameStatus({ state: 'available', message: res.message || 'Username updated successfully.' });
      setTimeout(() => {
        setUsernameStatus({ state: 'idle', message: '' });
        setActiveSubView('main');
      }, 1200);
    } catch (err) {
      if (err.response?.status === 409) {
        setUsernameStatus({
          state: 'error',
          message: 'This username is already taken.',
        });
      } else {
        setUsernameStatus({
          state: 'error',
          message: err.response?.data?.message || 'Please enter a valid username.',
        });
      }
    }
  };

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    const trimmedEmail = newEmail.trim();

    if (!trimmedEmail) {
      setEmailStatus({ state: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailStatus({ state: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setEmailStatus({ state: 'checking', message: 'Updating email address...' });
    try {
      const res = await authService.updateEmail(trimmedEmail);
      setEmailStatus({ state: 'available', message: res.message || 'Email updated successfully.' });
      setTimeout(() => {
        setEmailStatus({ state: 'idle', message: '' });
        setActiveSubView('main');
      }, 1200);
    } catch (err) {
      if (err.response?.status === 409) {
        setEmailStatus({
          state: 'error',
          message: 'This email is already registered.',
        });
      } else if (err.response?.status === 400) {
        setEmailStatus({
          state: 'error',
          message: err.response?.data?.message || 'Please enter a valid email address.',
        });
      } else {
        setEmailStatus({
          state: 'error',
          message: err.response?.data?.message || 'Failed to update email. Please try again.',
        });
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ state: 'error', message: 'New passwords do not match.' });
      return;
    }

    setPasswordStatus({ state: 'checking', message: 'Changing password securely...' });
    try {
      await authService.updatePassword(currentPassword, newPassword, confirmPassword);
      setPasswordStatus({ state: 'available', message: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordStatus({ state: 'idle', message: '' });
        setActiveSubView('main');
      }, 1200);
    } catch (err) {
      setPasswordStatus({
        state: 'error',
        message: err.response?.data?.message || 'Failed to change password. Check current password.',
      });
    }
  };

  const handleLogoutAllOtherDevices = async () => {
    try {
      const res = await authService.logoutAll();
      setSessions(res.sessions || []);
      setSessionMsg('Logged out all other devices successfully.');
      setTimeout(() => setSessionMsg(''), 3000);
    } catch (e) {
      console.error(e.message);
    }
  };

  const handleRequestPermission = async (permType) => {
    try {
      if (permType === 'notifications' && 'Notification' in window) {
        const res = await Notification.requestPermission();
        setPermissions((prev) => ({ ...prev, notifications: res }));
      } else if (permType === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissions((prev) => ({ ...prev, camera: 'granted' }));
      } else if (permType === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissions((prev) => ({ ...prev, microphone: 'granted' }));
      } else if (permType === 'location' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => setPermissions((prev) => ({ ...prev, location: 'granted' })),
          () => setPermissions((prev) => ({ ...prev, location: 'denied' }))
        );
      }
    } catch (e) {
      console.warn(`Permission request failed for ${permType}:`, e.message);
    }
  };

  const handleSelectDisappearingOption = async (option) => {
    setDisappearingOption(option);
    try {
      await authService.updateSettings({ message_delete_after_viewing: option });
      await updateUserProfile({ settings: { ...user?.settings, message_delete_after_viewing: option } });
    } catch (e) {
      console.error('Failed to update disappearing setting:', e.message);
    }
  };

  const handleDownloadMyData = async () => {
    try {
      const data = await authService.exportData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `vr_connect_archive_${user?.username || 'user'}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Data export failed:', e.message);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE exactly to confirm.');
      return;
    }

    try {
      await authService.deleteAccount('DELETE');
      window.location.reload();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await authService.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error(e.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(7, 9, 14, 0.88)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '660px',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(13, 17, 26, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeSubView !== 'main' && (
              <button
                onClick={() => setActiveSubView('main')}
                className="btn-icon"
                style={{ width: '32px', height: '32px', marginRight: '4px' }}
              >
                ←
              </button>
            )}
            <Settings size={22} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
              {activeSubView === 'main' && 'Settings'}
              {activeSubView === 'username' && 'Edit Username'}
              {activeSubView === 'email' && 'Change Email'}
              {activeSubView === 'password' && 'Change Password'}
              {activeSubView === 'sessions' && 'Login Information'}
              {activeSubView === 'linked' && 'Linked Accounts'}
              {activeSubView === 'permissions' && 'App Permissions'}
              {activeSubView === 'disappearing' && 'Message Delete After Viewing'}
              {activeSubView === 'memories' && 'Saved Memories'}
              {activeSubView === 'mydata' && 'My Data & Privacy'}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* ================= MAIN SETTINGS MENU ================= */}
          {activeSubView === 'main' && (
            <div>
              {/* SECTION: Account */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '10px' }}>
                  Account
                </h4>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  {/* Username Row */}
                  <div
                    onClick={() => setActiveSubView('username')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <User size={18} color="var(--accent-cyan)" />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>Username</p>
                        <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>@{user?.username}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>

                  {/* Email Row */}
                  <div
                    onClick={() => setActiveSubView('email')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Mail size={18} color="var(--accent-cyan)" />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>Email</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user?.email}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>

                  {/* Password Row */}
                  <div
                    onClick={() => setActiveSubView('password')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Lock size={18} color="var(--accent-cyan)" />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>Password</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>••••••••••••</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>

                  {/* Login Info Row */}
                  <div
                    onClick={() => setActiveSubView('sessions')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Key size={18} color="var(--accent-cyan)" />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>Login Information</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current session & active devices</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>

                  {/* Linked Accounts Row */}
                  <div
                    onClick={() => setActiveSubView('linked')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Shield size={18} color="var(--accent-cyan)" />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>Linked Accounts</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Google, Apple, Phone</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                </div>
              </div>

              {/* SECTION: Privacy & Permissions */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '10px' }}>
                  Privacy & Permissions
                </h4>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  {/* Permissions Row */}
                  <div
                    onClick={() => setActiveSubView('permissions')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Bell size={18} color="var(--accent-purple)" />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>Permissions</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Camera, Mic, Notifications, Location</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>

                  {/* Message Delete After Viewing */}
                  <div
                    onClick={() => setActiveSubView('disappearing')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Flame size={18} color="#ff007a" />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>Message Delete After Viewing</p>
                        <span style={{ fontSize: '12px', color: disappearingOption === 'off' ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>
                          {disappearingOption === 'off' && 'Off'}
                          {disappearingOption === 'view' && 'After viewing'}
                          {disappearingOption === '10s' && '10 seconds'}
                          {disappearingOption === '30s' && '30 seconds'}
                          {disappearingOption === '1m' && '1 minute'}
                          {disappearingOption === '24h' && '24 hours'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                </div>
              </div>

              {/* SECTION: Memories */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '10px' }}>
                  Memories
                </h4>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  <div
                    onClick={() => setActiveSubView('memories')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Bookmark size={18} color="var(--accent-emerald)" />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>Memories</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{memories.length} saved messages & media</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                </div>
              </div>

              {/* SECTION: Your Data */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '10px' }}>
                  Your Data
                </h4>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  <div
                    onClick={() => setActiveSubView('mydata')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Download size={18} color="var(--accent-cyan)" />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>My Data</p>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Download archive or delete account</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                </div>
              </div>

              {/* SECTION: Session / Logout */}
              <div style={{ paddingTop: '10px' }}>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: 'var(--accent-rose)',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <LogOut size={18} />
                  <span>Log Out of VR Connect</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= SUB-VIEW: LINKED ACCOUNTS ================= */}
          {activeSubView === 'linked' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.45' }}>
                Connect third-party authentication providers for seamless single sign-on access.
              </p>

              {linkFeedback.message && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: linkFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    color: linkFeedback.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    border: `1px solid ${linkFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                    fontSize: '12px',
                    marginBottom: '16px',
                  }}
                >
                  {linkFeedback.message}
                </div>
              )}

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: '20px' }}>
                {linkedAccounts.map((acc) => (
                  <div
                    key={acc.provider}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700 }}>{acc.provider}</p>
                        {acc.isConnected && (
                          <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                            Connected
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: acc.isConnected ? 'var(--accent-cyan)' : 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                        {acc.isConnected ? acc.email || acc.phoneNumber || 'Linked' : 'Not connected'}
                      </span>
                    </div>

                    {acc.provider === 'Google' ? (
                      acc.isConnected ? (
                        <button
                          onClick={() => {
                            setDisconnectProvider('Google');
                            setShowDisconnectModal(true);
                          }}
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 14px', borderColor: 'rgba(244, 63, 94, 0.4)', color: 'var(--accent-rose)' }}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={handleConnectGoogle}
                          disabled={linkingLoading}
                          className="btn-primary"
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                        >
                          {linkingLoading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Loader2 size={13} className="spin" /> Connecting...
                            </span>
                          ) : (
                            'Connect'
                          )}
                        </button>
                      )
                    ) : (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 14px', opacity: 0.6 }}
                        onClick={() => alert(`${acc.provider} authentication will be supported in a future update.`)}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= SUB-VIEW: USERNAME ================= */}
          {activeSubView === 'username' && (
            <form onSubmit={handleSaveUsername}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Your username is unique and allows contacts to find and communicate with you securely on VR Connect.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', fontWeight: 700 }}>@</span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => { setNewUsername(e.target.value); setUsernameStatus({ state: 'idle', message: '' }); }}
                    className="input-field"
                    style={{ paddingLeft: '32px' }}
                    required
                  />
                </div>
              </div>

              {usernameStatus.message && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: usernameStatus.state === 'error' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: usernameStatus.state === 'error' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    fontSize: '12px',
                    marginBottom: '16px',
                  }}
                >
                  {usernameStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={usernameStatus.state === 'checking'}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {usernameStatus.state === 'checking' ? 'Validating...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* ================= SUB-VIEW: EMAIL ================= */}
          {activeSubView === 'email' && (
            <form onSubmit={handleSaveEmail}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Manage your primary account email address for password recovery and account security.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="text"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailStatus({ state: 'idle', message: '' }); }}
                  placeholder="your-email@example.com"
                  className="input-field"
                  required
                />
              </div>

              {emailStatus.message && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: emailStatus.state === 'error' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: emailStatus.state === 'error' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    fontSize: '12px',
                    marginBottom: '16px',
                  }}
                >
                  {emailStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={emailStatus.state === 'checking'}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {emailStatus.state === 'checking' ? 'Updating...' : 'Save Email'}
              </button>
            </form>
          )}

          {/* ================= SUB-VIEW: PASSWORD ================= */}
          {activeSubView === 'password' && (
            <form onSubmit={handleChangePassword}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Choose a strong password with at least 6 characters. Passwords are securely hashed on the server.
              </p>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>

              {passwordStatus.message && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: passwordStatus.state === 'error' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: passwordStatus.state === 'error' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    fontSize: '12px',
                    marginBottom: '16px',
                  }}
                >
                  {passwordStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordStatus.state === 'checking' || !currentPassword || !newPassword || !confirmPassword}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {passwordStatus.state === 'checking' ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* ================= SUB-VIEW: SESSIONS ================= */}
          {activeSubView === 'sessions' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Review all devices where your VR Connect account is currently signed in.
              </p>

              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '8px' }}>
                Current Session
              </h4>
              <div style={{ background: 'rgba(0, 242, 254, 0.08)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0, 242, 254, 0.25)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Laptop size={22} color="var(--accent-cyan)" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700 }}>This Device (Windows Web)</p>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Active Now • IP: 127.0.0.1
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', background: 'var(--accent-cyan)', color: '#07090e', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                    Active
                  </span>
                </div>
              </div>

              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '8px' }}>
                Other Active Sessions ({sessions.length > 1 ? sessions.length - 1 : 0})
              </h4>
              {sessions.filter((s) => !s.isCurrent).length === 0 ? (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                  No other active devices found.
                </div>
              ) : (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: '20px' }}>
                  {sessions.filter((s) => !s.isCurrent).map((s) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <Smartphone size={18} color="var(--text-secondary)" />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600 }}>{s.device}</p>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Last active: {new Date(s.lastActive).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sessionMsg && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>
                  {sessionMsg}
                </div>
              )}

              <button
                onClick={handleLogoutAllOtherDevices}
                className="btn-secondary"
                style={{ width: '100%', borderColor: 'rgba(244, 63, 94, 0.4)', color: 'var(--accent-rose)' }}
              >
                Log Out Other Devices
              </button>
            </div>
          )}

          {/* ================= SUB-VIEW: PERMISSIONS ================= */}
          {activeSubView === 'permissions' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                Control device hardware and system access permissions.
              </p>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: '16px' }}>
                {[
                  { key: 'notifications', label: 'Notifications', icon: Bell, state: permissions.notifications },
                  { key: 'camera', label: 'Camera', icon: Camera, state: permissions.camera },
                  { key: 'microphone', label: 'Microphone', icon: Mic, state: permissions.microphone },
                  { key: 'location', label: 'Location', icon: MapPin, state: permissions.location },
                  { key: 'media', label: 'Photos & Media', icon: ImageIcon, state: permissions.media },
                ].map((item) => {
                  const Icon = item.icon;
                  const isGranted = item.state === 'granted';

                  return (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Icon size={18} color="var(--accent-cyan)" />
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</p>
                          <span style={{ fontSize: '11px', color: isGranted ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                            {isGranted ? 'Access Allowed' : item.state === 'denied' ? 'Permanently Denied' : 'Not Requested'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRequestPermission(item.key)}
                        disabled={isGranted}
                        className="btn-secondary"
                        style={{
                          fontSize: '12px',
                          padding: '6px 14px',
                          background: isGranted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          borderColor: isGranted ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)',
                          color: isGranted ? 'var(--accent-emerald)' : 'var(--text-primary)',
                        }}
                      >
                        {isGranted ? 'Allowed' : 'Request'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= SUB-VIEW: DISAPPEARING MESSAGES ================= */}
          {activeSubView === 'disappearing' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                When enabled, newly sent messages will automatically delete on both devices after the receiver views them.
              </p>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: '20px' }}>
                {[
                  { key: 'off', label: 'Off', desc: 'Messages stay indefinitely' },
                  { key: 'view', label: 'After viewing', desc: 'Disappears immediately after opening (3s)' },
                  { key: '10s', label: '10 seconds', desc: 'Disappears 10 seconds after opening' },
                  { key: '30s', label: '30 seconds', desc: 'Disappears 30 seconds after opening' },
                  { key: '1m', label: '1 minute', desc: 'Disappears 1 minute after opening' },
                  { key: '24h', label: '24 hours', desc: 'Disappears 24 hours after opening' },
                ].map((opt) => (
                  <div
                    key={opt.key}
                    onClick={() => handleSelectDisappearingOption(opt.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      background: disappearingOption === opt.key ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: disappearingOption === opt.key ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        {opt.label}
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{opt.desc}</span>
                    </div>
                    {disappearingOption === opt.key && <Check size={18} color="var(--accent-cyan)" />}
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24', fontSize: '12px', lineHeight: '1.45' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Important Notice:</strong> Disappearing messages cannot prevent screenshots, screen recording, or someone photographing the screen with a second device.
                </span>
              </div>
            </div>
          )}

          {/* ================= SUB-VIEW: MEMORIES ================= */}
          {activeSubView === 'memories' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Saved bookmarks, messages, and shared media stored across your conversations.
              </p>

              {memories.length === 0 ? (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '36px 16px', borderRadius: '14px', border: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Bookmark size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>No Saved Memories Yet</p>
                  <span style={{ fontSize: '11px' }}>Click the bookmark icon on any message to save it here.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                          {m.senderName}
                        </span>
                        <p style={{ fontSize: '13px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.content || `[${m.mediaType || 'Media Attachment'}]`}
                        </p>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Saved {new Date(m.savedAt || m.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteMemory(m.id)}
                        className="btn-icon"
                        style={{ width: '32px', height: '32px', color: 'var(--accent-rose)' }}
                        title="Remove from memories"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= SUB-VIEW: MY DATA ================= */}
          {activeSubView === 'mydata' && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                Export a full authenticated copy of your account data or permanently request account deletion.
              </p>

              {/* Download Data */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Download My Data</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Generate an authenticated JSON archive containing your profile, personal chat history, and memories.
                </p>
                <button onClick={handleDownloadMyData} className="btn-primary" style={{ width: '100%' }}>
                  <Download size={16} /> Download Data Archive (.JSON)
                </button>
              </div>

              {/* Delete Account */}
              <div style={{ background: 'rgba(244, 63, 94, 0.06)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '6px' }}>Delete My Data & Account</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                  Permanently delete your profile, chat memberships, and message records. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteDataModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.2)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    color: 'var(--accent-rose)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Delete My Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: DISCONNECT GOOGLE CONFIRMATION ================= */}
      {showDisconnectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Shield size={24} color="var(--accent-rose)" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Disconnect {disconnectProvider}?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '22px', lineHeight: '1.45' }}>
              Your {disconnectProvider} account will no longer be linked to your VR account.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowDisconnectModal(false); setDisconnectProvider(null); }} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={handleConfirmDisconnect}
                className="btn-primary"
                style={{ flex: 1, background: '#f43f5e', color: '#fff' }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: LOGOUT CONFIRMATION ================= */}
      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <LogOut size={24} color="var(--accent-rose)" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Log Out?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '22px' }}>
              Are you sure you want to log out of VR Connect on this device?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLogoutConfirm(false)} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  onClose();
                  await logout();
                }}
                className="btn-primary"
                style={{ flex: 1, background: '#f43f5e', color: '#fff' }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE ACCOUNT CONFIRMATION ================= */}
      {showDeleteDataModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-rose)', marginBottom: '8px' }}>
              Delete My Data & Account?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.45' }}>
              This action permanently deletes your account, conversations, and personal data.
            </p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Type <strong style={{ color: 'var(--accent-rose)' }}>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="input-field"
              style={{ marginBottom: '16px' }}
            />

            {deleteError && (
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', fontSize: '12px', marginBottom: '14px' }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowDeleteDataModal(false); setDeleteConfirmText(''); setDeleteError(''); }} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountConfirm}
                disabled={deleteConfirmText !== 'DELETE'}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  background: '#f43f5e',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                  opacity: deleteConfirmText === 'DELETE' ? 1 : 0.5,
                }}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;
