import React from 'react';

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = 'http://localhost:3000/callback';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
// Updated scopes to include playback control
const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-playback-state',
  'user-modify-playback-state'
];

export default function Login() {
  const loginUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES.join(
    '%20'
  )}&response_type=${RESPONSE_TYPE}`;

  return (
    <a
      href={loginUrl}
      style={{
        padding: '12px 24px',
        backgroundColor: '#1DB954',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '25px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}
    >
      Login with Spotify
    </a>
  );
}
