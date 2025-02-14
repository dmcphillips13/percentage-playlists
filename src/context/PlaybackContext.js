import React, { createContext, useState, useRef, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const PlaybackContext = createContext();

export const PlaybackProvider = ({ children }) => {
  const { spotifyToken, soundcloudToken } = useContext(AuthContext);

  // The currently playing playlist (should have a "tracks" array)
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  // Index of the currently playing track in that playlist
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  // Which service: 'spotify' or 'soundcloud'
  const [currentSource, setCurrentSource] = useState(null);
  // Whether playback is active
  const [isPlaying, setIsPlaying] = useState(false);

  // For SoundCloud, we use an HTMLAudio element.
  const audioRef = useRef(null);

  // Global function to play a track from a given playlist.
  // `playlist` is an object with a "tracks" array.
  // `index` is the track index, and `source` indicates the service.
  const playTrack = (playlist, index, source, track) => {
    setCurrentPlaylist(playlist);
    setCurrentTrackIndex(index);
    setCurrentSource(source);
    if (source === 'spotify') {
      // For Spotify, call the Spotify API to start playback.
      fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [track.uri] }),
      })
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => console.error('Error playing Spotify track:', err));
    } else if (source === 'soundcloud') {
      // For SoundCloud, we need to fetch the stream as a blob.
      // Ensure the stream URL uses HTTPS.
      let streamUrl = track.stream_url;
      if (streamUrl.startsWith('http://')) {
        streamUrl = 'https://' + streamUrl.substring(7);
      }
      // Pause any currently playing track.
      if (audioRef.current) {
        audioRef.current.pause();
      }
      fetch(streamUrl, {
        headers: {
          Authorization: `OAuth ${soundcloudToken}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch SoundCloud stream: ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          const audio = new Audio();
          audio.src = objectUrl;
          audio.crossOrigin = 'anonymous';
          audioRef.current = audio;
          return audio.play();
        })
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => console.error('Error playing SoundCloud track:', err));
    }
  };

  // Function to pause the current track.
  const pauseTrack = () => {
    if (currentSource === 'spotify') {
      fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
        .then(() => setIsPlaying(false))
        .catch((err) => console.error('Error pausing Spotify track:', err));
    } else if (currentSource === 'soundcloud') {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Function to skip to the next track.
  const skipForward = () => {
    if (currentPlaylist && currentTrackIndex !== null) {
      let nextIndex = currentTrackIndex + 1;
      if (nextIndex >= currentPlaylist.tracks.length) {
        nextIndex = 0; // Loop around
      }
      playTrack(currentPlaylist, nextIndex, currentSource, currentPlaylist.tracks[nextIndex]);
      setCurrentTrackIndex(nextIndex);
    }
  };

  // Function to skip to the previous track.
  const skipBackward = () => {
    if (currentPlaylist && currentTrackIndex !== null) {
      let prevIndex = currentTrackIndex - 1;
      if (prevIndex < 0) {
        prevIndex = currentPlaylist.tracks.length - 1;
      }
      playTrack(currentPlaylist, prevIndex, currentSource, currentPlaylist.tracks[prevIndex]);
      setCurrentTrackIndex(prevIndex);
    }
  };

  return (
    <PlaybackContext.Provider
      value={{
        currentPlaylist,
        currentTrackIndex,
        currentSource,
        isPlaying,
        playTrack,
        pauseTrack,
        skipForward,
        skipBackward,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};
