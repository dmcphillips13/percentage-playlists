import React, { useState, useEffect, useContext } from 'react';
import { PlaybackContext } from '../context/PlaybackContext';

export default function SpotifyPlaylistDetail({ token, playlistId, onBack, onTrackClick }) {
  const [playlist, setPlaylist] = useState(null);
  const { playTrack, pauseTrack, currentSource, isPlaying } = useContext(PlaybackContext);

  // Fetch full playlist details from Spotify.
  useEffect(() => {
    fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => response.json())
      .then(data => setPlaylist(data))
      .catch(error => console.error('Error fetching Spotify playlist:', error));
  }, [playlistId, token]);

  if (!playlist) return <div style={{ color: '#fff' }}>Loading...</div>;

  // Flatten the track items.
  const formattedPlaylist = {
    ...playlist,
    tracks: playlist.tracks.items.map(item => item.track),
  };

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: 'transparent', border: 'none', color: '#1DB954', fontSize: '16px', cursor: 'pointer', marginBottom: '20px' }}
      >
        &larr; Back
      </button>
      <h2 style={{ color: '#fff' }}>{playlist.name}</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {formattedPlaylist.tracks.map((track, index) => (
          <li key={track.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
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
              onClick={() => {
                // If a track from a different source is playing, pause it first.
                if (isPlaying && currentSource && currentSource !== 'spotify') {
                  pauseTrack();
                }
                playTrack(formattedPlaylist, index, 'spotify', track);
              }}
              style={{ background: 'transparent', border: 'none', color: '#1DB954', fontSize: '16px', cursor: 'pointer', marginRight: '10px' }}
            >
              Play
            </button>
            <button
              onClick={pauseTrack}
              style={{ background: 'transparent', border: 'none', color: '#1DB954', fontSize: '16px', cursor: 'pointer', marginRight: '10px' }}
            >
              Pause
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
