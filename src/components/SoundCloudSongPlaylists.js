import React, { useState, useEffect } from 'react';

export default function SoundCloudSongPlaylists({
  track,
  userPlaylists, // This should be the list of SoundCloud playlists you fetched earlier.
  onPlaylistSelect,
  onBack,
  onPlayPause,
  playingTrackId,
  isPlaying
}) {
  const [matchingPlaylists, setMatchingPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function findMatchingPlaylists() {
      setLoading(true);
      // Filter the playlists: check if the track appears in the playlist's tracks.
      const matches = userPlaylists.filter((playlist) =>
        playlist.tracks && playlist.tracks.some((t) => t.id === track.id)
      );
      setMatchingPlaylists(matches);
      setLoading(false);
    }

    if (userPlaylists && track) {
      findMatchingPlaylists();
    }
  }, [userPlaylists, track]);

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
      <h2 style={{ color: "#fff" }}>
        Playlists including &quot;{track.title}&quot;
      </h2>
      {loading ? (
        <p style={{ color: "#bbb" }}>Loading playlists...</p>
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
                {pl.title} – {pl.track_count} tracks
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "#bbb" }}>No playlists include this track.</p>
      )}
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
  );
}
