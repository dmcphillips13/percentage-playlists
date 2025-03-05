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
  // Toggle for shuffle mode
  const [shuffleMode, setShuffleMode] = useState(false);
  // Original track order for when shuffle is turned off
  const [originalTrackOrder, setOriginalTrackOrder] = useState([]);
  // Shuffled track indices
  const [shuffledIndices, setShuffledIndices] = useState([]);
  // Current track position in the shuffled array
  const [currentShufflePosition, setCurrentShufflePosition] = useState(0);

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
    // When playing a new playlist, check if shuffle is enabled
    if (!currentPlaylist || currentPlaylist.id !== playlist.id) {
      // If this is a new playlist and shuffle is on, create shuffled indices
      if (shuffleMode) {
        const shuffled = intelligentShuffle(playlist);
        setShuffledIndices(shuffled);
        // Find where the selected track is in the shuffled order
        const shufflePosition = shuffled.indexOf(index);
        if (shufflePosition !== -1) {
          setCurrentShufflePosition(shufflePosition);
        }
      } else {
        // If shuffle is off, store the original order for later use
        const originalOrder = Array.from({ length: playlist.tracks.length }, (_, i) => i);
        setOriginalTrackOrder(originalOrder);
      }
    }
    
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
      let nextIndex;
        
      if (shuffleMode) {
        // In shuffle mode, get the next track from shuffled indices
        let nextShufflePosition = currentShufflePosition + 1;
        if (nextShufflePosition >= shuffledIndices.length) {
          nextShufflePosition = 0;
        }
        nextIndex = shuffledIndices[nextShufflePosition];
        setCurrentShufflePosition(nextShufflePosition);
      } else {
        // In normal mode, just get the next sequential track
        nextIndex = currentTrackIndex + 1;
        if (nextIndex >= currentPlaylist.tracks.length) {
          nextIndex = 0;
        }
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
      let prevIndex;
      
      if (shuffleMode) {
        // In shuffle mode, get the previous track from shuffled indices
        let prevShufflePosition = currentShufflePosition - 1;
        if (prevShufflePosition < 0) {
          prevShufflePosition = shuffledIndices.length - 1;
        }
        prevIndex = shuffledIndices[prevShufflePosition];
        setCurrentShufflePosition(prevShufflePosition);
      } else {
        // In normal mode, just get the previous sequential track
        prevIndex = currentTrackIndex - 1;
        if (prevIndex < 0) {
          prevIndex = currentPlaylist.tracks.length - 1;
        }
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

  // Intelligent shuffle function
  const intelligentShuffle = (playlist) => {
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
      return [];
    }
    
    const tracks = playlist.tracks;
    const trackCount = tracks.length;
    
    // Create array of indices
    const indices = Array.from({ length: trackCount }, (_, i) => i);
    
    // Store original order
    setOriginalTrackOrder(indices);
    
    // Modified Fisher-Yates shuffle with intelligent constraints
    const shuffled = [...indices];
    
    // First pass: standard Fisher-Yates shuffle to get a random base
    for (let i = trackCount - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Second pass: apply intelligent constraints
    for (let i = 1; i < trackCount; i++) {
      const currentTrack = tracks[shuffled[i]];
      const prevTrack = tracks[shuffled[i - 1]];
      
      // Check if consecutive tracks have the same artist
      const sameArtist = hasSameArtist(currentTrack, prevTrack);
      
      // Check if tracks are from the same album (for Spotify)
      const sameAlbum = hasSameAlbum(currentTrack, prevTrack);
      
      // If constraints violated, find a better position
      if (sameArtist || sameAlbum) {
        // Look for a swap candidate that doesn't violate constraints
        for (let j = i + 1; j < Math.min(trackCount, i + 10); j++) {
          if (j >= trackCount) break;
          
          const candidateTrack = tracks[shuffled[j]];
          
          // Check if swapping would resolve the artist constraint
          const wouldResolveSameArtist = !hasSameArtist(candidateTrack, prevTrack);
          
          // Check if swapping would resolve the album constraint
          const wouldResolveSameAlbum = !hasSameAlbum(candidateTrack, prevTrack);
          
          // Only swap if it improves the situation
          if (wouldResolveSameArtist && wouldResolveSameAlbum) {
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            break;
          }
        }
      }
    }
    
    return shuffled;
  };
  
  // Helper to check if two tracks have the same artist
  const hasSameArtist = (track1, track2) => {
    if (!track1 || !track2) return false;
    
    if (track1.source === 'spotify' && track2.source === 'spotify') {
      // For Spotify tracks, compare artist IDs
      const track1Artists = track1.artists?.map(a => a.id) || [];
      const track2Artists = track2.artists?.map(a => a.id) || [];
      return track1Artists.some(id => track2Artists.includes(id));
    }
    
    if (track1.source === 'soundcloud' && track2.source === 'soundcloud') {
      // For SoundCloud tracks, compare user IDs
      return track1.user?.id === track2.user?.id;
    }
    
    return false; // Different sources can't have the same artist
  };
  
  // Helper to check if two tracks have the same album (Spotify only)
  const hasSameAlbum = (track1, track2) => {
    if (!track1 || !track2) return false;
    
    if (track1.source === 'spotify' && track2.source === 'spotify') {
      return track1.album?.id === track2.album?.id;
    }
    
    return false; // SoundCloud doesn't have album concept
  };
  
  // Toggle shuffle mode
  const toggleShuffle = () => {
    const newShuffleMode = !shuffleMode;
    setShuffleMode(newShuffleMode);
    
    if (newShuffleMode) {
      // If turning on shuffle, generate new shuffled indices
      const shuffled = intelligentShuffle(currentPlaylist);
      setShuffledIndices(shuffled);
      
      // Find current track in shuffled array
      const currentPosition = shuffled.findIndex(idx => idx === currentTrackIndex);
      setCurrentShufflePosition(currentPosition !== -1 ? currentPosition : 0);
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
        currentPosition,
        trackDuration,
        playTrack,
        pauseTrack,
        skipForward,
        skipBackward,
        seekToPosition,
        spotifyPlayer,
        shuffleMode,
        toggleShuffle,
        shuffledIndices
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};
