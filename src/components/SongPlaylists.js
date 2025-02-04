// src/components/SongPlaylists.js
import React, { useState, useEffect } from 'react';

export default function SongPlaylists({ token, track, userPlaylists, onPlaylistSelect, onBack }) {
  const [matchingPlaylists, setMatchingPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatchingPlaylists() {
      setLoading(true);
      // For each user-owned playlist, fetch its tracks and check for the song
      const promises = userPlaylists.map((playlist) => {
        return fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.items) {
              // Check if any item has a track matching the selected track id
              const containsTrack = data.items.some(
                (item) => item.track && item.track.id === track.id
              );
              return containsTrack ? playlist : null;
            }
            return null;
          })
          .catch((err) => {
            console.error('Error fetching tracks for playlist', playlist.id, err);
            return null;
          });
      });
      const results = await Promise.all(promises);
      const filtered = results.filter((playlist) => playlist !== null);
      setMatchingPlaylists(filtered);
      setLoading(false);
    }

    if (token && track && userPlaylists && userPlaylists.length > 0) {
      fetchMatchingPlaylists();
    }
  }, [token, track, userPlaylists]);

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '20px' }}>
        &larr; Back
      </button>
      <h2>Playlists including "{track.name}"</h2>
      {loading ? (
        <p>Loading playlists...</p>
      ) : matchingPlaylists.length > 0 ? (
        <ul>
          {matchingPlaylists.map((pl) => (
            <li key={pl.id}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPlaylistSelect(pl);
                }}
                style={{ textDecoration: 'none', color: '#1DB954' }}
              >
                {pl.name} — {pl.tracks.total} tracks
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No playlists found that include this song.</p>
      )}
    </div>
  );
}
