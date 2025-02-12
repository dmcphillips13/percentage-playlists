import React from 'react';

export default function SpotifyPlaylists({ playlists, onPlaylistClick }) {
  if (!playlists || playlists.length === 0) {
    return <p style={{ color: '#bbb' }}>No playlists found.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {playlists.map((playlist) => (
        <li key={playlist.id} style={{ marginBottom: '12px' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPlaylistClick(playlist);
            }}
            style={{
              textDecoration: 'none',
              color: '#1DB954',
              fontSize: '18px'
            }}
          >
            <strong>{playlist.name}</strong> — {playlist.tracks.total} tracks
          </a>
        </li>
      ))}
    </ul>
  );
}
