// src/components/PlaylistDetail.js
import React, { useState, useEffect } from 'react';

export default function PlaylistDetail({ token, playlistId, goBack, onTrackClick }) {
  const [tracks, setTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState('');

  useEffect(() => {
    if (token && playlistId) {
      fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setPlaylistName(data.name);
          setTracks(data.tracks.items);
        })
        .catch((error) => {
          console.error('Error fetching playlist details:', error);
        });
    }
  }, [token, playlistId]);

  return (
    <div>
      <button onClick={goBack} style={{ marginBottom: '20px' }}>
        &larr; Back to Playlists
      </button>
      <h2>{playlistName}</h2>
      {tracks.length > 0 ? (
        <ul>
          {tracks.map((item, index) => {
            const track = item.track;
            if (!track) return null;
            return (
              <li key={track.id || index}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onTrackClick(track);
                  }}
                  style={{ textDecoration: 'none', color: '#1DB954' }}
                >
                  {track.name} — {track.artists.map((artist) => artist.name).join(', ')}
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No tracks found.</p>
      )}
    </div>
  );
}
