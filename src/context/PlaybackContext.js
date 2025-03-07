import React, { createContext, useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';

export const PlaybackContext = createContext();

// Browser detection helper functions
const isMobileSafari = () => {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && !window.MSStream && /Safari/.test(ua) && !/Chrome/.test(ua);
};

const isMobile = () => {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isIOS = () => {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
};

const isSpotifyWebPlaybackSupported = () => {
  // Spotify Web Playback SDK doesn't work on iOS/Safari or most mobile browsers
  return !isMobileSafari() && !isMobile();
};

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
  // Original track order for when shuffle is turned off - keeping for potential future use
  const [, setOriginalTrackOrder] = useState([]);
  // Shuffled track indices
  const [shuffledIndices, setShuffledIndices] = useState([]);
  // Current track position in the shuffled array
  const [currentShufflePosition, setCurrentShufflePosition] = useState(0);
  // Device detection
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);
  // Playback error state
  const [playbackError, setPlaybackError] = useState(null);

  // Spotify Web Playback SDK state
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  // Store Spotify device ID for seeking
  const [spotifyDeviceId, setSpotifyDeviceId] = useState(null);

  // For SoundCloud, we use an HTMLAudio element.
  const audioRef = useRef(null);
  
  // Check device capabilities on component mount
  useEffect(() => {
    setIsMobileBrowser(isMobile());
  // We only want this to run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Initialize Spotify SDK when spotifyToken is available and browser supports it ---
  useEffect(() => {
    // Only try to use Spotify SDK on supported browsers
    if (spotifyToken && isSpotifyWebPlaybackSupported()) {
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
          setPlaybackError({ type: 'spotify', message: 'Failed to initialize Spotify player' });
        });
        player.addListener('authentication_error', ({ message }) => {
          console.error('Spotify Authentication Error:', message);
          setPlaybackError({ type: 'spotify', message: 'Authentication error with Spotify' });
        });
        player.addListener('account_error', ({ message }) => {
          console.error('Spotify Account Error:', message);
          setPlaybackError({ type: 'spotify', message: 'Account error with Spotify' });
        });
        player.addListener('playback_error', ({ message }) => {
          console.error('Spotify Playback Error:', message);
          setPlaybackError({ type: 'spotify', message: 'Playback error with Spotify' });
        });

        player.connect().then(success => {
          if (success) {
            console.log('Spotify Web Playback SDK connected successfully');
          } else {
            console.error('Failed to connect to Spotify Web Playback SDK');
            setPlaybackError({ type: 'spotify', message: 'Failed to connect to Spotify player' });
          }
        });
        setSpotifyPlayer(player);
      };
    } else if (spotifyToken && isMobileBrowser) {
      // On mobile devices, we'll use Spotify Connect instead
      console.log('Spotify Web Playback SDK not supported on this device. Using Spotify Connect instead.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyToken, isMobileBrowser]);

  // Global function to play a track.
  const playTrack = (playlist, index, source, track) => {
    // Clear any previous playback errors
    setPlaybackError(null);
    
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
      
      // For mobile devices, we need to handle Spotify differently since the SDK isn't supported
      if (isMobileBrowser || isMobileSafari()) {
        // Get track info to update duration (still useful for display)
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
            
            // For iOS, we need to handle Spotify links specially
            if (isIOS()) {
              // Add a message about opening in Spotify
              setPlaybackError({
                type: 'spotify_ios',
                message: 'Tap to open this track in the Spotify app'
              });
              
              // iOS doesn't always support the spotify: protocol handler directly
              setIsPlaying(true); // Pretend we're playing for UI purposes
              setPlayingTrackId(track.id);
              
              // On iOS, we need to give the user a button to tap
              // The actual app opening will be handled by the PlaybackBar component
            } else {
              // For other mobile devices, try direct protocol
              const spotifyAppUrl = `spotify:track:${track.id}`;
              window.open(spotifyAppUrl, '_blank');
              
              setPlaybackError({
                type: 'spotify_mobile',
                message: 'Opening track in the Spotify app...'
              });
            }
          })
          .catch(err => {
            console.error('Error fetching Spotify track:', err);
            setPlaybackError({
              type: 'spotify_error',
              message: 'Error fetching track information from Spotify'
            });
          });
          
        return;
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
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch player state: ${res.status}`);
          }
          return res.json();
        })
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
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to play track: ${res.status}`);
          }
          setIsPlaying(true);
          setPlayingTrackId(track.id);
          setSpotifyOffset(0);
          
          // Get track info to update duration
          return fetch(`https://api.spotify.com/v1/tracks/${track.id}`, {
            headers: {
              Authorization: `Bearer ${spotifyToken}`,
            },
          });
        })
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch track info: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data && data.duration_ms) {
            setTrackDuration(data.duration_ms);
          }
        })
        .catch((err) => {
          console.error('Error playing Spotify track:', err);
          setPlaybackError({
            type: 'spotify_error',
            message: 'Error playing track. Try opening Spotify app.'
          });
        });
    } else if (source === 'soundcloud') {
      // Set duration if available from track metadata
      if (track.duration) {
        setTrackDuration(track.duration);
      }
      
      // Simplified handling for iOS/Safari
      if (isIOS()) {
        // On iOS, we need to handle audio specially
        if (audioRef.current) {
          audioRef.current.pause();
          // Safari sometimes needs a moment to release the previous audio
          setTimeout(() => {
            // Create a simpler audio element for iOS
            setupIOSAudio(track, soundcloudToken);
          }, 100);
        } else {
          setupIOSAudio(track, soundcloudToken);
        }
      } else {
        // For non-iOS browsers
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
            .catch((err) => {
              console.error('Error resuming SoundCloud track:', err);
              setPlaybackError({
                type: 'soundcloud_error',
                message: 'Error resuming playback. Try tapping play again.'
              });
            });
        } else {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          
          try {
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
                
                // Set up error handling
                audio.onerror = (e) => {
                  console.error('Audio element error:', e);
                  setPlaybackError({
                    type: 'soundcloud_error',
                    message: 'Error loading audio. Please try again.'
                  });
                };
                
                audio.preload = 'auto';
                audio.crossOrigin = 'anonymous';
                
                // Listen for metadata loaded to get duration
                audio.addEventListener('loadedmetadata', () => {
                  setTrackDuration(audio.duration * 1000); // Convert to ms
                });
                
                audio.src = objectUrl;
                audioRef.current = audio;
                
                return audio.play();
              })
              .then(() => {
                setIsPlaying(true);
                setSoundcloudOffset(0);
                setPlayingTrackId(track.id);
              })
              .catch((err) => {
                console.error('Error playing SoundCloud track:', err);
                setPlaybackError({
                  type: 'soundcloud_error',
                  message: 'Error playing track. Please try again.'
                });
              });
          } catch (err) {
            console.error('Exception in SoundCloud playback:', err);
            setPlaybackError({
              type: 'soundcloud_error',
              message: 'Error setting up playback. Please try again.'
            });
          }
        }
      }
    }
  };
  
  // Special function for iOS audio setup
  const setupIOSAudio = (track, soundcloudToken) => {
    try {
      let streamUrl = track.stream_url;
      if (streamUrl.startsWith('http://')) {
        streamUrl = 'https://' + streamUrl.substring(7);
      }
      
      // For iOS, we'll use a direct audio URL approach rather than blob
      const fullStreamUrl = `${streamUrl}?oauth_token=${soundcloudToken}`;
      
      const audio = new Audio();
      audio.src = fullStreamUrl; 
      audio.preload = 'auto';
      
      // Set up all event listeners before attempting to play
      audio.addEventListener('loadedmetadata', () => {
        // We've successfully loaded metadata
        setTrackDuration(audio.duration * 1000); // Convert to ms
      });
      
      audio.addEventListener('playing', () => {
        setIsPlaying(true);
        setPlayingTrackId(track.id);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('iOS Audio error:', e);
        
        // Check error code - code 4 often means autoplay restriction
        if (audio.error && audio.error.code === 4) {
          setPlaybackError({
            type: 'ios_autoplay',
            message: 'Tap play again to start audio (iOS requires user activation)'
          });
        } else {
          setPlaybackError({
            type: 'ios_audio_error',
            message: 'Error playing audio. Please try again.'
          });
        }
      });
      
      // Store the audio element for future reference
      audioRef.current = audio;
      
      // Try to play - this will likely fail on first try on iOS
      audio.play().catch(err => {
        console.warn('iOS initial play failed as expected:', err.name);
        // This is normal on iOS - we'll let the user tap play again
        setPlaybackError({
          type: 'ios_first_play',
          message: 'Tap play again to start audio'
        });
      });
    } catch (err) {
      console.error('Error setting up iOS audio:', err);
      setPlaybackError({
        type: 'ios_setup_error',
        message: 'Error setting up audio. Please try again.'
      });
    }
  };

  // Update pauseTrack to return a promise.
  const pauseTrack = () => {
    if (currentSource === 'spotify') {
      // For iOS, we don't actually control Spotify playback
      if (isIOS()) {
        setIsPlaying(false);
        return Promise.resolve();
      }
      
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
          setIsPlaying(false); // Still update UI even if API call fails
          return Promise.resolve();
        });
    } else if (currentSource === 'soundcloud') {
      if (audioRef.current) {
        try {
          setSoundcloudOffset(audioRef.current.currentTime);
          audioRef.current.pause();
        } catch (e) {
          console.warn('Error pausing audio:', e);
        }
        setIsPlaying(false);
      }
      return Promise.resolve();
    }
    
    // Default case if no source
    setIsPlaying(false);
    return Promise.resolve();
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
      // For iOS, we don't attempt to track Spotify position
      if (isIOS()) {
        // On iOS with Spotify, we just increment a fake position for UI
        let fakePosition = currentPosition;
        intervalId = setInterval(() => {
          fakePosition += 1000; // Add 1 second
          if (fakePosition < trackDuration) {
            setCurrentPosition(fakePosition);
          } else {
            // When we reach the end, simulate skip to next track
            skipForward();
          }
        }, 1000);
      } else {
        // On desktop, use the Spotify API to track position
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
      }
    } else if (currentSource === 'soundcloud' && audioRef.current) {
      // Update position and duration for SoundCloud tracks
      intervalId = setInterval(() => {
        if (audioRef.current) {
          // Make sure audio element is still valid
          try {
            setCurrentPosition(audioRef.current.currentTime * 1000); // Convert to ms
            if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
              setTrackDuration(audioRef.current.duration * 1000 || 0); // Convert to ms
            }
            
            // Check if we've reached the end
            if (audioRef.current.ended || 
               (audioRef.current.currentTime > 0 && 
                audioRef.current.duration > 0 && 
                audioRef.current.currentTime >= audioRef.current.duration - 0.5)) {
              // Track finished - go to next
              skipForward();
            }
          } catch (e) {
            console.warn('Error updating audio position:', e);
          }
        }
      }, 1000);
    }
    
    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentSource, spotifyToken, currentPosition, trackDuration]);

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
        shuffledIndices,
        isMobileBrowser,
        playbackError,
        setPlaybackError
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};
