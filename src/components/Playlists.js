
import React from 'react';

export default function Playlists({ playlists, onPlaylistClick }) {
  if (!playlists || playlists.length === 0) {
    return <p>No playlists found.</p>;
  }

  return (
    <ul>
      {playlists.map((playlist) => (
        <li key={playlist.id} style={{ marginBottom: '10px' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPlaylistClick(playlist);
            }}
            style={{ textDecoration: 'none', color: '#1DB954' }}
          >
            <strong>{playlist.name}</strong> — {playlist.tracks.total} tracks
          </a>
        </li>
      ))}
    </ul>
  );
}
