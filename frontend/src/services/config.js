/**
 * VR Connect - Client & Mobile Environment Configuration
 * 
 * Automatically switches between Local Development and Production Render Backend
 * based on environment variables or hostname detection.
 */

const getApiBaseUrl = () => {
  // 1. Explicit Vite Environment Variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Production Browser / Vercel Hostname detection
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://vr-connect-backend.onrender.com';
  }

  // 3. Local Development Default
  return 'http://localhost:5000';
};

const getSocketBaseUrl = () => {
  // 1. Explicit Vite Environment Variable
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // 2. Production Browser / Vercel Hostname detection
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://vr-connect-backend.onrender.com';
  }

  // 3. Local Development Default
  return 'http://localhost:5000';
};

export const API_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketBaseUrl();

export default {
  API_URL,
  SOCKET_URL,
};
