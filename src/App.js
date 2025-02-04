import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Playlists from './components/Playlists';

function App() {
  const [token, setToken] = useState('');
  const [playlists, setPlaylists] = useState([]);

  // Extract token from URL hash or localStorage on component mount
  useEffect(() => {
    let tokenFromStorage = window.localStorage.getItem('token');

    const hash = window.location.hash;
    if (!tokenFromStorage && hash) {
      const tokenFromUrl = hash
        .substring(1)
        .split('&')
        .find((elem) => elem.startsWith('access_token'))
        .split('=')[1];

      window.location.hash = ''; // Clean the URL
      window.localStorage.setItem('token', tokenFromUrl);
      tokenFromStorage = tokenFromUrl;
    }

    setToken(tokenFromStorage);
  }, []);

  // Fetch the user's playlists when token is available
  useEffect(() => {
    if (token) {
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
            console.error('Unexpected response data', data);
          }
        })
        .catch((error) => {
          console.error('Error fetching playlists:', error);
        });
    }
  }, [token]);

  // Logout clears the token and updates state
  const logout = () => {
    setToken('');
    window.localStorage.removeItem('token');
  };

  return (
    <div
      className="App"
      style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}
    >
      <h1>My Spotify Playlists</h1>
      {!token ? (
        <Login />
      ) : (
        <>
          <button onClick={logout} style={{ marginBottom: '20px' }}>
            Logout
          </button>
          <Playlists playlists={playlists} />
        </>
      )}
    </div>
  );
}

export default App;
