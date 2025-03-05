import React, { useState, useEffect, useContext } from 'react';
import { PlaybackContext } from '../context/PlaybackContext';

export default function SpotifyPlaylistDetail({ token, playlistId, onBack, onTrackClick }) {
  const [playlist, setPlaylist] = useState(null);
  const { playTrack, pauseTrack, currentSource, isPlaying, currentPlaylist, currentTrackIndex } = useContext(PlaybackContext);

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

  // Helper function to format track duration (ms to MM:SS)
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Flatten the track items and add source property to each track.
  const formattedPlaylist = {
    ...playlist,
    tracks: playlist.tracks.items.map(item => ({
      ...item.track,
      source: 'spotify'
    })),
  };

  // Determine if a specific track is currently playing
  const isTrackPlaying = (index) => {
    return currentPlaylist && 
           currentPlaylist.id === playlist.id && 
           currentTrackIndex === index && 
           isPlaying;
  };

  // Handle play/pause for a track
  const handlePlayPause = (track, index) => {
    if (isTrackPlaying(index)) {
      pauseTrack();
    } else {
      // If a track from a different source is playing, pause it first.
      if (isPlaying && currentSource && currentSource !== 'spotify') {
        pauseTrack();
      }
      playTrack(formattedPlaylist, index, 'spotify', track);
    }
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
      
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
            <th style={{ padding: '10px', width: '50px' }}></th>
            <th style={{ padding: '10px' }}>Title</th>
            <th style={{ padding: '10px' }}>Artist</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>Length</th>
          </tr>
        </thead>
        <tbody>
          {formattedPlaylist.tracks.map((track, index) => (
            <tr 
              key={track.id} 
              style={{ 
                borderBottom: '1px solid #333',
                backgroundColor: isTrackPlaying(index) ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => onTrackClick && onTrackClick(track)}
            >
              <td style={{ padding: '10px', textAlign: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click event
                    handlePlayPause(track, index);
                  }}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#1DB954', 
                    fontSize: '18px', 
                    cursor: 'pointer',
                    width: '30px',
                    height: '30px'
                  }}
                >
                  {isTrackPlaying(index) ? '⏸' : '▶️'}
                </button>
              </td>
              <td style={{ padding: '10px' }}>{track.name}</td>
              <td style={{ padding: '10px' }}>{track.artists.map(artist => artist.name).join(', ')}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{formatDuration(track.duration_ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
