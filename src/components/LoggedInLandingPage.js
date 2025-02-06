import React from 'react';

export default function LoggedInLandingPage({ onSelectView }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ color: '#fff' }}>Select a Service</h2>
      <button
        onClick={() => onSelectView('spotify')}
        style={{
          padding: '12px 24px',
          margin: '10px',
          backgroundColor: '#1DB954',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Spotify Playlists
      </button>
      <button
        onClick={() => onSelectView('soundcloud')}
        style={{
          padding: '12px 24px',
          margin: '10px',
          backgroundColor: '#ff5500',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        SoundCloud Playlists
      </button>
    </div>
  );
}
