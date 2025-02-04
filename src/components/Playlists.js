import React from 'react';

export default function Playlists({ playlists }) {
  if (!playlists || playlists.length === 0) {
    return <p>No playlists found.</p>;
  }

  return (
    <ul>
      {playlists.map((playlist) => (
        <li key={playlist.id}>
          <strong>{playlist.name}</strong> — {playlist.tracks.total} tracks
        </li>
      ))}
    </ul>
  );
}
