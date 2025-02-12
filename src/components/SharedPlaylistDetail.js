import React, { useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function SharedPlaylistDetail({ sharedPlaylist, onBack, onPlayPauseCombined }) {
  const { soundcloudToken, spotifyToken } = useContext(AuthContext);

  // State to hold the full Spotify playlist details (if needed)
  const [spotifyPlaylistFull, setSpotifyPlaylistFull] = useState(null);
  // State to track which source is currently playing ("spotify" or "soundcloud")
  const [currentSource, setCurrentSource] = useState(null);

  // If the provided sharedPlaylist.spotify does not have full track details,
  // fetch them using the href provided.
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
          console.error("Error fetching full Spotify playlist:", error)
        );
    }
  }, [sharedPlaylist.spotify, spotifyToken]);

  // Use the full Spotify playlist if we fetched it; otherwise, use the provided object.
  const effectiveSpotifyPlaylist = spotifyPlaylistFull ? spotifyPlaylistFull : sharedPlaylist.spotify;

  // Extract Spotify tracks (if available) and tag with a source.
  const spotifyTracks =
    effectiveSpotifyPlaylist &&
      effectiveSpotifyPlaylist.tracks &&
      effectiveSpotifyPlaylist.tracks.items
      ? effectiveSpotifyPlaylist.tracks.items.map((item) => ({ ...item.track, source: 'spotify' }))
      : [];

  // Extract SoundCloud tracks (if available) and tag with a source.
  const soundcloudTracks =
    sharedPlaylist.soundcloud && sharedPlaylist.soundcloud.tracks
      ? sharedPlaylist.soundcloud.tracks.map((track) => ({ ...track, source: 'soundcloud' }))
      : [];

  // Merge tracks from both sources.
  const mergedTracks = [...spotifyTracks, ...soundcloudTracks];

  // Manage local playback for both SoundCloud and Spotify tracks using a single HTMLAudio element.
  const audioRef = useRef(null);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTrackPlayPause = (track, action) => {
    if (track.source === 'soundcloud') {
      // SoundCloud playback
      let streamUrl = track.stream_url;
      if (streamUrl.startsWith('http://')) {
        streamUrl = 'https://' + streamUrl.substring(7);
      }
      if (action === 'play') {
        if (audioRef.current && playingTrackId === track.id && currentSource === 'soundcloud') {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => console.error("Error resuming SoundCloud track:", err));
        } else {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          // Fetch the track stream as a blob using the Authorization header.
          fetch(streamUrl, {
            headers: {
              Authorization: `OAuth ${soundcloudToken}`,
            },
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Failed to fetch stream: ${response.status}`);
              }
              return response.blob();
            })
            .then((blob) => {
              const objectUrl = URL.createObjectURL(blob);
              const audio = new Audio();
              audio.src = objectUrl;
              audio.crossOrigin = "anonymous";
              audioRef.current = audio;
              return audio.play();
            })
            .then(() => {
              setPlayingTrackId(track.id);
              setIsPlaying(true);
              setCurrentSource('soundcloud');
            })
            .catch((err) => {
              console.error("Error playing SoundCloud track:", err);
            });
        }
      } else if (action === 'pause') {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    } else if (track.source === 'spotify') {
      if (action === 'play') {
        fetch('https://api.spotify.com/v1/me/player/play', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: [track.uri] })
        })
          .then(() => {
            setPlayingTrackId(track.id);
            setIsPlaying(true);
          })
          .catch((err) => console.error('Error playing track:', err));
      } else if (action === 'pause') {
        fetch('https://api.spotify.com/v1/me/player/pause', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${spotifyToken}` }
        })
          .then(() => setIsPlaying(false))
          .catch((err) => console.error('Error pausing track:', err));
      }
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
      {mergedTracks.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {mergedTracks.map((track, index) => (
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
                onClick={() =>
                  handleTrackPlayPause(
                    track,
                    playingTrackId === track.id && isPlaying ? 'pause' : 'play'
                  )
                }
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1DB954',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                {playingTrackId === track.id && isPlaying ? 'Pause' : 'Play'}
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
