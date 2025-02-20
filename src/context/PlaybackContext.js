// src/context/PlaybackContext.js
import React, { createContext, useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';

export const PlaybackContext = createContext();

export const PlaybackProvider = ({ children }) => {
  const { spotifyToken, soundcloudToken } = useContext(AuthContext);

  // Global playback state
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [currentSource, setCurrentSource] = useState(null); // 'spotify' or 'soundcloud'
  const [isPlaying, setIsPlaying] = useState(false);
  const [spotifyOffset, setSpotifyOffset] = useState(0); // in ms
  const [soundcloudOffset, setSoundcloudOffset] = useState(0); // in sec
  const [playingTrackId, setPlayingTrackId] = useState(null);

  // Spotify Web Playback SDK state
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  const [spotifyDeviceId, setSpotifyDeviceId] = useState(null);

  // For SoundCloud playback
  const audioRef = useRef(null);

  // --- Initialize Spotify SDK when spotifyToken is available ---
  useEffect(() => {
    if (spotifyToken) {
      console.log('[DEBUG] Spotify token:', spotifyToken);
      let script = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
      }

      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: 'Percentage Playlists Player',
          getOAuthToken: cb => {
            console.log('[DEBUG] getOAuthToken called with token:', spotifyToken);
            cb(spotifyToken);
          },
          volume: 0.5,
        });

        player.addListener('ready', ({ device_id }) => {
          console.log('[DEBUG] Spotify Player ready with Device ID:', device_id);
          setSpotifyDeviceId(device_id);
          // Transfer playback to this device
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
          })
            .then(response => {
              console.log('[DEBUG] Transfer Playback Response Status:', response.status);
              if (response.status !== 204) {
                console.error('[DEBUG] Transfer Playback failed with status:', response.status);
              }
            })
            .catch(err => console.error('[DEBUG] Transfer Playback Error:', err));
        });

        player.addListener('initialization_error', ({ message }) => {
          console.error('[DEBUG] Initialization Error:', message);
        });
        player.addListener('authentication_error', ({ message }) => {
          console.error('[DEBUG] Authentication Error:', message);
        });
        player.addListener('account_error', ({ message }) => {
          console.error('[DEBUG] Account Error:', message);
        });
        player.addListener('playback_error', ({ message }) => {
          console.error('[DEBUG] Playback Error:', message);
        });

        player.connect().then(success => {
          console.log('[DEBUG] Spotify player connect success:', success);
        });
        setSpotifyPlayer(player);
      };
    }
  }, [spotifyToken]);

  // --- Helper for Spotify playback: Transfer playback and start the track with a retry mechanism ---
  const transferAndPlaySpotify = (track, retries = 3) => {
    if (!spotifyDeviceId) {
      console.error('[DEBUG] transferAndPlaySpotify: Spotify device ID not set');
      return;
    }
    // Ensure the play method is available; if not, retry after a short delay
    if (!spotifyPlayer || typeof spotifyPlayer.play !== 'function') {
      if (retries > 0) {
        console.warn('[DEBUG] spotifyPlayer.play not available, retrying in 300ms');
        setTimeout(() => transferAndPlaySpotify(track, retries - 1), 300);
      } else {
        console.error('[DEBUG] spotifyPlayer.play still not available after retries');
      }
      return;
    }
    console.log('[DEBUG] Transferring playback to device', spotifyDeviceId, 'for track URI:', track.uri);
    fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [spotifyDeviceId],
        play: true,
      }),
    })
      .then(response => {
        console.log('[DEBUG] Transfer Playback Response Status:', response.status);
        if (response.status !== 204) {
          console.error('[DEBUG] Transfer Playback failed with status:', response.status);
        }
        return response.json().catch(() => ({}));
      })
      .then(data => {
        if (data.error) {
          console.error('[DEBUG] Transfer Playback error:', data.error);
        }
        setTimeout(() => {
          console.log('[DEBUG] Calling spotifyPlayer.play() with URI:', track.uri);
          spotifyPlayer.play({ uris: [track.uri] })
            .then(() => {
              console.log('[DEBUG] Spotify track started successfully');
              setIsPlaying(true);
              setPlayingTrackId(track.id);
              setSpotifyOffset(0);
            })
            .catch(err => {
              console.error('[DEBUG] Error playing Spotify track:', err);
            });
        }, 300);
      })
      .catch(err => {
        console.error('[DEBUG] Error transferring playback:', err);
      });
  };

  // --- Global function to play a track ---
  const playTrack = (playlist, index, source, track) => {
    setCurrentPlaylist(playlist);
    setCurrentTrackIndex(index);
    // If switching sources while something is playing, pause current playback first
    if (isPlaying && currentSource && currentSource !== source) {
      pauseTrack().then(() => {
        setCurrentSource(source);
        if (source === 'spotify') {
          transferAndPlaySpotify(track);
        } else if (source === 'soundcloud') {
          playSoundCloudTrack(track);
        }
      });
    } else {
      setCurrentSource(source);
      if (source === 'spotify') {
        // If a different Spotify track is playing, pause first
        if (isPlaying && currentSource === 'spotify' && playingTrackId !== track.id) {
          spotifyPlayer.pause().then(() => {
            setCurrentSource('spotify');
            transferAndPlaySpotify(track);
          }).catch(err => {
            console.error('[DEBUG] Error pausing current Spotify track:', err);
            transferAndPlaySpotify(track);
          });
        } else {
          transferAndPlaySpotify(track);
        }
      } else if (source === 'soundcloud') {
        playSoundCloudTrack(track);
        setCurrentSource('soundcloud');
      }
    }
  };

  // --- Helper for SoundCloud playback ---
  const playSoundCloudTrack = (track) => {
    if (audioRef.current && playingTrackId === track.id) {
      audioRef.current.currentTime = soundcloudOffset;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setSoundcloudOffset(0);
          setPlayingTrackId(track.id);
        })
        .catch(err => {
          console.error('[DEBUG] Error resuming SoundCloud track:', err);
        });
    } else {
      if (audioRef.current) audioRef.current.pause();
      let streamUrl = track.stream_url;
      if (streamUrl.startsWith('http://')) {
        streamUrl = 'https://' + streamUrl.substring(7);
      }
      fetch(streamUrl, {
        headers: {
          Authorization: `OAuth ${soundcloudToken}`,
        },
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch SoundCloud stream: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
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
        .catch(err => {
          console.error('[DEBUG] Error playing SoundCloud track:', err);
        });
    }
  };

  // --- Global function to pause the current track; returns a promise ---
  const pauseTrack = () => {
    if (currentSource === 'spotify') {
      return fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
        .then(res => res.json())
        .then(data => {
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
        .catch(err => Promise.resolve());
    } else if (currentSource === 'soundcloud') {
      if (audioRef.current) {
        setSoundcloudOffset(audioRef.current.currentTime);
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return Promise.resolve();
    }
  };

  // --- Skip functions ---
  const skipForward = async () => {
    if (currentPlaylist && currentTrackIndex !== null) {
      let nextIndex = currentTrackIndex + 1;
      if (nextIndex >= currentPlaylist.tracks.length) nextIndex = 0;
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
      if (prevIndex < 0) prevIndex = currentPlaylist.tracks.length - 1;
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
