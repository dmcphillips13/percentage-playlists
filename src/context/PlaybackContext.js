import React, { createContext, useState, useRef, useContext, useEffect } from 'react';
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

  // Spotify Web Playback SDK state
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);

  // For SoundCloud, we use an HTMLAudio element.
  const audioRef = useRef(null);

  // --- Initialize Spotify SDK when spotifyToken is available ---
  useEffect(() => {
    if (spotifyToken) {
      // Load the Spotify SDK if not already present.
      let script = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
      }
      // Set up the global callback
      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: 'Percentage Playlists Player',
          getOAuthToken: cb => { cb(spotifyToken); },
          volume: 0.5,
        });

        player.addListener('ready', ({ device_id }) => {
          // Transfer playback to our SDK device.
          fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${spotifyToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              device_ids: [device_id],
              play: false,
            }),
          }).catch(() => { });
        });

        player.addListener('initialization_error', ({ message }) => {
          console.error('Spotify Initialization Error:', message);
        });
        player.addListener('authentication_error', ({ message }) => {
          console.error('Spotify Authentication Error:', message);
        });
        player.addListener('account_error', ({ message }) => {
          console.error('Spotify Account Error:', message);
        });
        player.addListener('playback_error', ({ message }) => {
          console.error('Spotify Playback Error:', message);
        });

        player.connect().then(success => {
          // Player connected successfully.
        });
        setSpotifyPlayer(player);
      };
    }
  }, [spotifyToken]);

  // Global function to play a track.
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
        // If same track was paused, resume from saved offset.
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

  // Update pauseTrack to return a promise.
  const pauseTrack = () => {
    if (currentSource === 'spotify') {
      return fetch('https://api.spotify.com/v1/me/player', {
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
        .then(() => {
          setIsPlaying(false);
        })
        .catch((err) => {
          console.error('Error pausing Spotify track:', err);
          return Promise.resolve();
        });
    } else if (currentSource === 'soundcloud') {
      if (audioRef.current) {
        setSoundcloudOffset(audioRef.current.currentTime);
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return Promise.resolve();
    }
  };

  // Update skip functions to pause current playback if switching sources.
  const skipForward = async () => {
    if (currentPlaylist && currentTrackIndex !== null) {
      let nextIndex = currentTrackIndex + 1;
      if (nextIndex >= currentPlaylist.tracks.length) {
        nextIndex = 0;
      }
      const nextTrack = currentPlaylist.tracks[nextIndex];
      if (isPlaying && currentSource && currentSource !== nextTrack.source) {
        await pauseTrack();
      }
      playTrack(currentPlaylist, nextIndex, nextTrack.source, nextTrack);
      setCurrentTrackIndex(nextIndex);
    }
  };

  const skipBackward = async () => {
    if (currentPlaylist && currentTrackIndex !== null) {
      let prevIndex = currentTrackIndex - 1;
      if (prevIndex < 0) {
        prevIndex = currentPlaylist.tracks.length - 1;
      }
      const prevTrack = currentPlaylist.tracks[prevIndex];
      if (isPlaying && currentSource && currentSource !== prevTrack.source) {
        await pauseTrack();
      }
      playTrack(currentPlaylist, prevIndex, prevTrack.source, prevTrack);
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
        spotifyPlayer,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};
