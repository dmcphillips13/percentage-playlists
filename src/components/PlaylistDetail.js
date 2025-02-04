import React, { useState, useEffect } from 'react';

export default function PlaylistDetail({
  token,
  playlistId,
  goBack,
  onTrackClick,
  onPlayPause,
  playingTrackId,
  isPlaying
}) {
  const [tracks, setTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState('');

  useEffect(() => {
    if (token && playlistId) {
      fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
      <button
        onClick={goBack}
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
      <h2 style={{ color: '#fff' }}>{playlistName}</h2>
      {tracks.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tracks.map((item, index) => {
            const track = item.track;
            if (!track) return null;
            return (
              <li key={track.id || index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onTrackClick(track);
                  }}
                  style={{
                    textDecoration: 'none',
                    color: '#1DB954',
                    fontSize: '16px'
                  }}
                >
                  {track.name} — {track.artists.map((artist) => artist.name).join(', ')}
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
            );
          })}
        </ul>
      ) : (
        <p style={{ color: '#bbb' }}>No tracks found.</p>
      )}
    </div>
  );
}
