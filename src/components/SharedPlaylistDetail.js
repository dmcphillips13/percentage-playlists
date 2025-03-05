import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PlaybackContext } from '../context/PlaybackContext';

// Helper to normalize the shared playlist into a flat playlist object.
function normalizeSharedPlaylist(sharedPlaylist, effectiveSpotifyPlaylist) {
  const spotifyTracks =
    effectiveSpotifyPlaylist &&
      effectiveSpotifyPlaylist.tracks &&
      effectiveSpotifyPlaylist.tracks.items
      ? effectiveSpotifyPlaylist.tracks.items.map((item) => ({
        ...item.track,
        source: 'spotify',
      }))
      : [];
  const soundcloudTracks =
    sharedPlaylist.soundcloud && sharedPlaylist.soundcloud.tracks
      ? sharedPlaylist.soundcloud.tracks.map((track) => ({
        ...track,
        source: 'soundcloud',
        // Ensure we have a valid stream_url:
        stream_url: track.stream_url || `${track.uri}/stream`,
      }))
      : [];
  return {
    id: sharedPlaylist.id || sharedPlaylist.title, // Use an ID if available; else use title.
    title: sharedPlaylist.title,
    tracks: [...spotifyTracks, ...soundcloudTracks],
  };
}

export default function SharedPlaylistDetail({ sharedPlaylist, onBack }) {
  const { spotifyToken } = useContext(AuthContext);
  const {
    playTrack,
    pauseTrack,
    currentPlaylist,
    currentTrackIndex,
    isPlaying,
    currentSource,
  } = useContext(PlaybackContext);
  const [spotifyPlaylistFull, setSpotifyPlaylistFull] = useState(null);

  // If the sharedPlaylist.spotify object is only a summary, fetch full details.
  useEffect(() => {
    if (
      sharedPlaylist.spotify &&
      (!sharedPlaylist.spotify.tracks || !sharedPlaylist.spotify.tracks.items) &&
      spotifyToken
    ) {
      fetch(sharedPlaylist.spotify.href, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
        .then((response) => response.json())
        .then((data) => setSpotifyPlaylistFull(data))
        .catch((error) =>
          console.error('Error fetching full Spotify playlist:', error)
        );
    }
  }, [sharedPlaylist.spotify, spotifyToken]);

  const effectiveSpotifyPlaylist = spotifyPlaylistFull
    ? spotifyPlaylistFull
    : sharedPlaylist.spotify;

  // Normalize the shared playlist so that it has a flat tracks array.
  const normalizedPlaylist = normalizeSharedPlaylist(sharedPlaylist, effectiveSpotifyPlaylist);

  // Helper function to format track duration (ms to MM:SS)
  const formatDuration = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Determine if a specific track is currently playing
  const isTrackPlaying = (index) => {
    return currentPlaylist && 
           currentPlaylist.id === normalizedPlaylist.id && 
           currentTrackIndex === index && 
           isPlaying;
  };

  // When a user clicks a play/pause button, determine the track's index and call global functions.
  const handlePlayPause = (track, index) => {
    // If the same track is already playing, pause it.
    if (isTrackPlaying(index)) {
      pauseTrack();
    } else {
      // If a track from a different source is playing, pause it first.
      if (isPlaying && currentSource && currentSource !== track.source) {
        pauseTrack();
      }
      // Then, play the selected track.
      playTrack(normalizedPlaylist, index, track.source, track);
    }
  };

  // Get track name based on source
  const getTrackName = (track) => {
    return track.name || track.title || 'Unknown Track';
  };

  // Get artist name based on source
  const getArtistName = (track) => {
    if (track.source === 'spotify') {
      return track.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist';
    } else {
      return track.user?.username || track.artist || 'Unknown Artist';
    }
  };

  // Get track duration based on source
  const getTrackDuration = (track) => {
    if (track.source === 'spotify') {
      return formatDuration(track.duration_ms);
    } else {
      return formatDuration(track.duration);
    }
  };

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
          marginBottom: '20px',
        }}
      >
        &larr; Back
      </button>
      <h2 style={{ color: '#fff' }}>{sharedPlaylist.title} (Shared)</h2>
      
      {normalizedPlaylist.tracks.length > 0 ? (
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
            {normalizedPlaylist.tracks.map((track, index) => (
              <tr 
                key={index} 
                style={{ 
                  borderBottom: '1px solid #333',
                  backgroundColor: isTrackPlaying(index) ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                  cursor: 'pointer'
                }}
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
                <td style={{ padding: '10px' }}>
                  {getTrackName(track)}
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#aaa', 
                    marginLeft: '10px',
                    backgroundColor: track.source === 'spotify' ? '#1DB954' : '#ff8800',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {track.source === 'spotify' ? 'Spotify' : 'SoundCloud'}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{getArtistName(track)}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{getTrackDuration(track)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#bbb' }}>No tracks found.</p>
      )}
    </div>
  );
}
