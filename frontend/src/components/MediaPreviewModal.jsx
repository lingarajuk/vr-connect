import React from 'react';
import { X, Download } from 'lucide-react';

export const MediaPreviewModal = ({ media, onClose }) => {
  if (!media) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '10px',
          zIndex: 120,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={media.url}
          download={media.name || 'download'}
          target="_blank"
          rel="noreferrer"
          className="btn-icon"
          title="Download Media"
        >
          <Download size={20} />
        </a>
        <button onClick={onClose} className="btn-icon" title="Close">
          <X size={20} />
        </button>
      </div>

      <div
        style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {media.type === 'image' && (
          <img
            src={media.url}
            alt={media.name || 'Full preview'}
            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }}
          />
        )}
        {media.type === 'video' && (
          <video
            src={media.url}
            controls
            autoPlay
            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px' }}
          />
        )}
      </div>
    </div>
  );
};

export default MediaPreviewModal;
