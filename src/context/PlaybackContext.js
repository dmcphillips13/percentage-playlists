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
  // Store playback offsets in ms for Spotify
  const [spotifyOffset, setSpotifyOffset] = useState(0);
  // Store playback offsets in sec for SoundCloud
  const [soundcloudOffset, setSoundcloudOffset] = useState(0);
  // Track the currently playing track's ID
  const [playingTrackId, setPlayingTrackId] = useState(null);

  // For SoundCloud, we use an HTMLAudio element.
  const audioRef = useRef(null);

  const playTrack = (playlist, index, source, track) => {
    setCurrentPlaylist(playlist);
    setCurrentTrackIndex(index);
    setCurrentSource(source);
    if (source === 'spotify') {
      const body = { uris: [track.uri] };
      if (
        currentPlaylist &&
        currentPlaylist.id === playlist.id &&
        currentTrackIndex === index &&
        spotifyOffset > 0
      ) {
        body.position_ms = spotifyOffset;
      }
      fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
        .then(() => {
          setIsPlaying(true);
          setPlayingTrackId(track.id);
          setSpotifyOffset(0);
        })
        .catch((err) => console.error('Error playing Spotify track:', err));
    } else if (source === 'soundcloud') {
      if (audioRef.current && playingTrackId === track.id) {
        audioRef.current.currentTime = soundcloudOffset;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setSoundcloudOffset(0);
            setPlayingTrackId(track.id);
          })
          .catch((err) => console.error('Error resuming SoundCloud track:', err));
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        let streamUrl = track.stream_url;
        if (streamUrl.startsWith('http://')) {
          streamUrl = 'https://' + streamUrl.substring(7);
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
            setSoundcloudOffset(0);
            setPlayingTrackId(track.id);
          })
          .catch((err) => console.error('Error playing SoundCloud track:', err));
      }
    }
  };

  const pauseTrack = () => {
    if (currentSource === 'spotify') {
      fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.progress_ms === 'number') {
            setSpotifyOffset(data.progress_ms);
          }
          return fetch('https://api.spotify.com/v1/me/player/pause', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${spotifyToken}` },
          });
        })
        .then(() => setIsPlaying(false))
        .catch((err) => console.error('Error pausing Spotify track:', err));
    } else if (currentSource === 'soundcloud') {
      if (audioRef.current) {
        setSoundcloudOffset(audioRef.current.currentTime);
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
        playingTrackId,
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
