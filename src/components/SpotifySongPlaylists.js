import React, { useState, useEffect, useRef } from 'react';

export default function SpotifySongPlaylists({
  token,
  track,
  userPlaylists,
  onPlaylistSelect,
  onBack,
  onPlayPause,
  playingTrackId,
  isPlaying
}) {
  const [matchingPlaylists, setMatchingPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  // Use a ref to store the ID of the track we already fetched results for
  const fetchedTrackId = useRef(null);

  useEffect(() => {
    // Only fetch if we have a valid token, track, userPlaylists and we haven't already fetched for this track
    if (token && track && userPlaylists && userPlaylists.length > 0 && fetchedTrackId.current !== track.id) {
      setLoading(true);
      // Update the ref so that subsequent re-renders (for the same track) don’t re-trigger the fetch
      fetchedTrackId.current = track.id;

      async function fetchMatchingPlaylists() {
        const promises = userPlaylists.map((playlist) => {
          return fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=100`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
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
      fetchMatchingPlaylists();
    }
    // If the track changes (i.e. user selects a different track), reset the ref so we fetch again.
    // (Alternatively, you could clear matchingPlaylists here if desired.)
  }, [token, track, userPlaylists]);

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
        &larr; Back
      </button>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#fff', marginRight: '10px' }}>
          Playlists including "{track.name}"
        </h2>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (playingTrackId === track.id && isPlaying) {
              // TODO - MAKE SURE THIS WORKS
              onPlayPause(track, 'pause', 0);
            } else {
              // TODO - MAKE SURE THIS WORKS
              onPlayPause(track, 'play', 0);
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#1DB954',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {(playingTrackId === track.id && isPlaying) ? 'Pause' : 'Play'}
        </button>
      </div>
      {loading ? (
        <p style={{ color: '#bbb' }}>Loading playlists...</p>
      ) : matchingPlaylists.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {matchingPlaylists.map((pl) => (
            <li key={pl.id} style={{ marginBottom: '12px' }}>
              <button
                onClick={() => onPlaylistSelect(pl)}
                style={{
                  textDecoration: 'none',
                  color: '#1DB954',
                  fontSize: '18px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left'
                }}
              >
                {pl.name} — {pl.tracks.total} tracks
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#bbb' }}>No playlists found that include this song.</p>
      )}
    </div>
  );
}
