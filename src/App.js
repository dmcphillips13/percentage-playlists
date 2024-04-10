import axios from 'axios';
import { useEffect, useState } from 'react';

import './App.css';

function App() {
  const REDIRECT_URI = 'http://localhost:3000';
  const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
  const RESPONSE_TYPE = 'token';

  const [playlists, setPlaylists] = useState([]);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem('token');

    if (!token && hash) {
      token = hash
        .substring(1)
        .split('&')
        .find((elem) => elem.startsWith('access_token'))
        .split('=')[1];

      window.location.hash = '';
      window.localStorage.setItem('token', token);
    }

    setToken(token);

    async function getUserId() {
      const { data } = await axios.get(`https://api.spotify.com/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUserId(data.id);
    }

    if (token) {
      getUserId();
    }

    const getPlaylists = async () => {
      const { data } = await axios.get(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPlaylists(data.items);
    };

    if (userId) {
      getPlaylists();
    }
  }, [userId]);

  const logout = () => {
    setToken('');
    window.localStorage.removeItem('token');
  };

  const renderPlaylists = () => {
    if (!playlists.length) {
      return;
    }

    return playlists.map((playlist) => (
      <option key={playlist.id} value={playlist.id}>
        {playlist.name}
      </option>
    ));
  };

  return (
    <div className="App">
      <h1>Percentage Playlists</h1>
      {!token ? (
        <a
          href={`${AUTH_ENDPOINT}?client_id=${process.env.REACT_APP_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}
        >
          Login to Spotify
        </a>
      ) : (
        <button onClick={logout}>Logout</button>
      )}
      {userId ? <select>{renderPlaylists()}</select> : null}
    </div>
  );
}

export default App;
