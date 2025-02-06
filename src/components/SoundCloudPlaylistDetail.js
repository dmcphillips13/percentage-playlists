import React from 'react';

export default function SoundCloudPlaylistDetail({
  playlist,
  onBack,
  onTrackClick,
  onPlayPause,
  playingTrackId,
  isPlaying
}) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#1DB954',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        &larr; Back to Playlists
      </button>
      <h2 style={{ color: "#fff" }}>{playlist.title}</h2>
      {playlist.tracks && playlist.tracks.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {playlist.tracks.map((track) => (
            <li key={track.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onTrackClick(track);
                }}
                style={{ textDecoration: 'none', color: '#1DB954', fontSize: '16px' }}
              >
                {track.title}
              </a>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (playingTrackId === track.id && isPlaying) {
                    onPlayPause(track, 'pause');
                  } else {
                    onPlayPause(track, 'play');
                  }
                }}
                style={{
                  marginLeft: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#1DB954',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {(playingTrackId === track.id && isPlaying) ? 'Pause' : 'Play'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#bbb" }}>No tracks in this playlist.</p>
      )}
    </div>
  );
}
