// src/App.js
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
          Authorization: `Bearer ${token}`,
        },
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
          Authorization: `Bearer ${token}`,
        },
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>My Spotify Playlists</h1>
      {!token ? (
        <Login />
      ) : (
        <>
          <button onClick={logout} style={{ marginBottom: '20px' }}>
            Logout
          </button>
          {selectedTrack ? (
            <SongPlaylists
              token={token}
              track={selectedTrack}
              userPlaylists={userOwnedPlaylists}
              onPlaylistSelect={handleSongPlaylistSelect}
              onBack={handleBackFromSongPlaylists}
            />
          ) : selectedPlaylist ? (
            <PlaylistDetail
              token={token}
              playlistId={selectedPlaylist.id}
              goBack={handleBackFromPlaylistDetail}
              onTrackClick={handleTrackClick}
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
