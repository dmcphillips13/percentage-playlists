import React from 'react';

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = 'http://localhost:3000/callback';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = ['playlist-read-private', 'playlist-read-collaborative'];

export default function Login() {
  const loginUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES.join('%20')}&response_type=${RESPONSE_TYPE}`;

  return (
    <a
      href={loginUrl}
      style={{
        padding: '10px 20px',
        backgroundColor: '#1DB954',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '25px',
      }}
    >
      Login with Spotify
    </a>
  );
}
