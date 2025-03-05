import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function SoundCloudPlaylists({ onPlaylistClick }) {
  const { soundcloudToken } = useContext(AuthContext);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    if (soundcloudToken) {
      fetch(`https://api.soundcloud.com/me/playlists`, {
        headers: {
          Authorization: `OAuth ${soundcloudToken}`
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch SoundCloud playlists");
          }
          return response.json();
        })
        .then((data) => {
          // SoundCloud returns an array of playlist objects.
          setPlaylists(data);
        })
        .catch((error) => console.error("Error fetching SoundCloud playlists:", error));
    }
  }, [soundcloudToken]);

  return (
    <div>
      <h2 style={{ color: "#fff" }}>SoundCloud Playlists</h2>
      {playlists && playlists.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {playlists.map((playlist) => (
            <li key={playlist.id} style={{ marginBottom: '12px' }}>
              <button
                onClick={() => onPlaylistClick(playlist)}
                style={{ 
                  color: '#1DB954', 
                  fontSize: '18px', 
                  textDecoration: 'none',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left'
                }}
              >
                {playlist.title} – {playlist.track_count} tracks
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#bbb" }}>No playlists found.</p>
      )}
    </div>
  );
}
