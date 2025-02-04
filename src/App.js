import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Playlists from './components/Playlists';
import PlaylistDetail from './components/PlaylistDetail';
import SongPlaylists from './components/SongPlaylists';

function App() {
  const [token, setToken] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  // Playback state: which track is playing and whether it is playing
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract token from localStorage or URL hash on app load
  useEffect(() => {
    let tokenFromStorage = window.localStorage.getItem('token');
    const hash = window.location.hash;
    if (!tokenFromStorage && hash) {
      const tokenFromUrl = hash
        .substring(1)
        .split('&')
        .find((elem) => elem.startsWith('access_token'))
        .split('=')[1];
      window.location.hash = '';
      window.localStorage.setItem('token', tokenFromUrl);
      tokenFromStorage = tokenFromUrl;
    }
    setToken(tokenFromStorage);
  }, []);

  // Fetch user profile to obtain the logged-in user's ID
  useEffect(() => {
    if (token) {
      fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((response) => response.json())
        .then((data) => {
          setUser(data);
        })
        .catch((err) => console.error('Error fetching user profile:', err));
    }
  }, [token]);

  // Fetch playlists (only when no specific view is selected)
  useEffect(() => {
    if (token && !selectedPlaylist && !selectedTrack) {
      fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.items) {
            setPlaylists(data.items);
          } else {
            console.error('Unexpected response data:', data);
          }
        })
        .catch((error) => {
          console.error('Error fetching playlists:', error);
        });
    }
  }, [token, selectedPlaylist, selectedTrack]);

  // Function to control playback via Spotify API
  const handlePlayPause = (track, action) => {
    if (action === 'play') {
      fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [track.uri]
        })
      })
        .then(() => {
          setPlayingTrackId(track.id);
          setIsPlaying(true);
        })
        .catch((err) => console.error('Error playing track:', err));
    } else if (action === 'pause') {
      fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(() => {
          setIsPlaying(false);
        })
        .catch((err) => console.error('Error pausing track:', err));
    }
  };

  // Logout clears all view states
  const logout = () => {
    setToken('');
    window.localStorage.removeItem('token');
    setSelectedPlaylist(null);
    setSelectedTrack(null);
  };

  const handlePlaylistClick = (playlist) => {
    setSelectedPlaylist(playlist);
  };

  const handleTrackClick = (track) => {
    setSelectedTrack(track);
  };

  const handleBackFromPlaylistDetail = () => {
    setSelectedPlaylist(null);
  };

  const handleBackFromSongPlaylists = () => {
    setSelectedTrack(null);
  };

  const handleSongPlaylistSelect = (playlist) => {
    // When a playlist is selected from the song view, clear the selected track and show its details.
    setSelectedTrack(null);
    setSelectedPlaylist(playlist);
  };

  // Filter playlists to only those created (owned) by the logged-in user.
  const userOwnedPlaylists = user
    ? playlists.filter((pl) => pl.owner && pl.owner.id === user.id)
    : playlists;

  return (
    <div
      style={{
        background: '#191414',
        color: '#fff',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Helvetica, Arial, sans-serif'
      }}
    >
      <h1 style={{ marginBottom: '20px', color: '#fff' }}>My Spotify Playlists</h1>
      {!token ? (
        <Login />
      ) : (
        <>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid #1DB954',
              borderRadius: '4px',
              color: '#1DB954',
              padding: '8px 12px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Logout
          </button>
          {selectedTrack ? (
            <SongPlaylists
              token={token}
              track={selectedTrack}
              userPlaylists={userOwnedPlaylists}
              onPlaylistSelect={handleSongPlaylistSelect}
              onBack={handleBackFromSongPlaylists}
              onPlayPause={handlePlayPause}
              playingTrackId={playingTrackId}
              isPlaying={isPlaying}
            />
          ) : selectedPlaylist ? (
            <PlaylistDetail
              token={token}
              playlistId={selectedPlaylist.id}
              goBack={handleBackFromPlaylistDetail}
              onTrackClick={handleTrackClick}
              onPlayPause={handlePlayPause}
              playingTrackId={playingTrackId}
              isPlaying={isPlaying}
            />
          ) : (
            <Playlists playlists={playlists} onPlaylistClick={handlePlaylistClick} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
