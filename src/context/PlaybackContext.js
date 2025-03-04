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
  // Current position in ms (for timeline display)
  const [currentPosition, setCurrentPosition] = useState(0);
  // Track duration in ms (for timeline display)
  const [trackDuration, setTrackDuration] = useState(0);

  // Spotify Web Playback SDK state
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  // Store Spotify device ID for seeking
  const [spotifyDeviceId, setSpotifyDeviceId] = useState(null);

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
          // Save the device ID for future use
          setSpotifyDeviceId(device_id);
          console.log("Spotify device ready with ID:", device_id);
          
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
          }).catch((err) => { 
            console.error("Error transferring playback:", err);
          });
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
    setCurrentPosition(0); // Reset position for new track
    
    if (source === 'spotify') {
      // Set duration if available from track metadata
      if (track.duration_ms) {
        setTrackDuration(track.duration_ms);
      }
      
      const body = { uris: [track.uri] };
      if (
        currentPlaylist &&
        currentPlaylist.id === playlist.id &&
        currentTrackIndex === index &&
        spotifyOffset > 0
      ) {
        body.position_ms = spotifyOffset;
        setCurrentPosition(spotifyOffset);
      }
      
      // Check current player state to get active device ID
      fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.device && data.device.id) {
            // Update our stored device ID
            setSpotifyDeviceId(data.device.id);
            console.log("Updated device ID during playTrack:", data.device.id);
          }
          
          // Now play the track
          return fetch(`https://api.spotify.com/v1/me/player/play${spotifyDeviceId ? `?device_id=${spotifyDeviceId}` : ''}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${spotifyToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });
        })
        .then(() => {
          setIsPlaying(true);
          setPlayingTrackId(track.id);
          setSpotifyOffset(0);
          
          // Get track info to update duration
          fetch(`https://api.spotify.com/v1/tracks/${track.id}`, {
            headers: {
              Authorization: `Bearer ${spotifyToken}`,
            },
          })
            .then(res => res.json())
            .then(data => {
              if (data && data.duration_ms) {
                setTrackDuration(data.duration_ms);
              }
            })
            .catch(err => console.error('Error fetching track duration:', err));
        })
        .catch((err) => console.error('Error playing Spotify track:', err));
    } else if (source === 'soundcloud') {
      // Set duration if available from track metadata
      if (track.duration) {
        setTrackDuration(track.duration);
      }
      
      if (audioRef.current && playingTrackId === track.id) {
        // If same track was paused, resume from saved offset.
        audioRef.current.currentTime = soundcloudOffset;
        setCurrentPosition(soundcloudOffset * 1000); // Convert to ms
        
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setSoundcloudOffset(0);
            setPlayingTrackId(track.id);
            
            // Update duration once audio is loaded
            if (audioRef.current.duration) {
              setTrackDuration(audioRef.current.duration * 1000); // Convert to ms
            }
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
            
            // Listen for metadata loaded to get duration
            audio.addEventListener('loadedmetadata', () => {
              setTrackDuration(audio.duration * 1000); // Convert to ms
            });
            
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
          
          // Update device ID if available
          if (data && data.device && data.device.id) {
            setSpotifyDeviceId(data.device.id);
          }
          
          return fetch(`https://api.spotify.com/v1/me/player/pause${spotifyDeviceId ? `?device_id=${spotifyDeviceId}` : ''}`, {
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

  // Add function to seek to a specific position
  const seekToPosition = (positionMs) => {
    if (currentSource === 'spotify') {
      // Use stored device ID if available
      if (spotifyDeviceId) {
        console.log("Seeking Spotify track with device ID:", spotifyDeviceId);
        fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}&device_id=${spotifyDeviceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
            'Content-Type': 'application/json',
          },
        })
          .then(() => {
            setCurrentPosition(positionMs);
          })
          .catch((err) => {
            console.error('Error seeking Spotify track with stored device ID:', err);
            
            // Fallback to getting current device if our stored ID failed
            fetch('https://api.spotify.com/v1/me/player', {
              headers: { 
                Authorization: `Bearer ${spotifyToken}` 
              },
            })
              .then(res => res.json())
              .then(data => {
                if (data && data.device && data.device.id) {
                  // Save this device ID for future use
                  setSpotifyDeviceId(data.device.id);
                  console.log("Updated Spotify device ID:", data.device.id);
                  
                  // Try seeking with the new device ID
                  return fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}&device_id=${data.device.id}`, {
                    method: 'PUT',
                    headers: {
                      Authorization: `Bearer ${spotifyToken}`,
                      'Content-Type': 'application/json',
                    },
                  });
                } else {
                  throw new Error('No active Spotify device found');
                }
              })
              .then(() => {
                setCurrentPosition(positionMs);
              })
              .catch(secondErr => console.error('Error in fallback seeking:', secondErr));
          });
      } else {
        // No stored device ID, try to get the current one
        fetch('https://api.spotify.com/v1/me/player', {
          headers: { 
            Authorization: `Bearer ${spotifyToken}` 
          },
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.device && data.device.id) {
              // Save this device ID for future use
              setSpotifyDeviceId(data.device.id);
              console.log("Got new Spotify device ID:", data.device.id);
              
              // Seek with the device ID
              return fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}&device_id=${data.device.id}`, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${spotifyToken}`,
                  'Content-Type': 'application/json',
                },
              });
            } else {
              throw new Error('No active Spotify device found');
            }
          })
          .then(() => {
            setCurrentPosition(positionMs);
          })
          .catch((err) => console.error('Error seeking Spotify track:', err));
      }
    } else if (currentSource === 'soundcloud' && audioRef.current) {
      // SoundCloud uses seconds, so convert ms to seconds
      audioRef.current.currentTime = positionMs / 1000;
      setCurrentPosition(positionMs);
    }
  };

  // Add effect to periodically update position and duration
  useEffect(() => {
    if (!isPlaying) return;
    
    let intervalId;
    
    if (currentSource === 'spotify') {
      // Update position and duration for Spotify tracks
      intervalId = setInterval(() => {
        fetch('https://api.spotify.com/v1/me/player', {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.progress_ms !== undefined) {
              setCurrentPosition(data.progress_ms);
              if (data.item && data.item.duration_ms) {
                setTrackDuration(data.item.duration_ms);
              }
            }
          })
          .catch((err) => console.error('Error getting Spotify position:', err));
      }, 1000);
    } else if (currentSource === 'soundcloud' && audioRef.current) {
      // Update position and duration for SoundCloud tracks
      intervalId = setInterval(() => {
        setCurrentPosition(audioRef.current.currentTime * 1000); // Convert to ms
        setTrackDuration(audioRef.current.duration * 1000 || 0); // Convert to ms
      }, 1000);
    }
    
    return () => clearInterval(intervalId);
  }, [isPlaying, currentSource, spotifyToken]);

  return (
    <PlaybackContext.Provider
      value={{
        currentPlaylist,
        currentTrackIndex,
        currentSource,
        isPlaying,
        playingTrackId,
        currentPosition,
        trackDuration,
        playTrack,
        pauseTrack,
        skipForward,
        skipBackward,
        seekToPosition,
        spotifyPlayer,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};
