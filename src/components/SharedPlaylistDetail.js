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

  // When a user clicks a play/pause button, determine the track's index and call global functions.
  const handlePlayPause = (track, index) => {
    // If the same track is already playing, pause it.
    if (
      currentPlaylist &&
      currentPlaylist.id === normalizedPlaylist.id &&
      currentTrackIndex === index &&
      isPlaying
    ) {
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
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {normalizedPlaylist.tracks.map((track, index) => (
            <li
              key={index}
              style={{
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#fff', marginRight: '10px' }}>
                {track.name || track.title} [{track.source}]
              </span>
              <button
                onClick={() => handlePlayPause(track, index)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1DB954',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                {currentPlaylist &&
                  currentPlaylist.id === normalizedPlaylist.id &&
                  currentTrackIndex === index &&
                  isPlaying
                  ? 'Pause'
                  : 'Play'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#bbb' }}>No tracks found.</p>
      )}
    </div>
  );
}
