import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getCallbackUrl } from '../utils/urlHelpers';

// Authentication endpoints
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_RESPONSE_TYPE = 'token';
const SPOTIFY_SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-private',
  "user-read-email",
  'streaming'
];

const SOUNDCLOUD_AUTH_ENDPOINT = 'https://secure.soundcloud.com/authorize';
const SOUNDCLOUD_RESPONSE_TYPE = 'code'; // Using authorization code flow

// --- Helper functions for PKCE ---
function generateCodeVerifier() {
  // Generate a random string (length between 43 and 128 characters)
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  // Convert array to hex string
  return Array.from(array, (dec) =>
    ('0' + dec.toString(16)).substr(-2)
  ).join('');
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  let base64String = btoa(String.fromCharCode(...new Uint8Array(digest)));
  // Convert base64 to base64url format:
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default function Login({ spotifyNeeded = true, soundcloudNeeded = true }) {
  const { spotifyToken, soundcloudToken, config } = useContext(AuthContext);
  const SPOTIFY_REDIRECT_URI = getCallbackUrl('spotify', config);
  const SOUNDCLOUD_REDIRECT_URI = getCallbackUrl('soundcloud', config);

  // Build Spotify login URL (implicit flow)
  const spotifyLoginUrl = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${config.SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    SPOTIFY_REDIRECT_URI
  )}&scope=${encodeURIComponent(SPOTIFY_SCOPES.join(' '))}&response_type=${SPOTIFY_RESPONSE_TYPE}`;

  // Handler for SoundCloud login using PKCE
  const handleSoundCloudLogin = async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    // Save the code verifier for later use in exchanging the code for a token.
    window.localStorage.setItem('soundcloud_code_verifier', codeVerifier);
    // Build the SoundCloud login URL with PKCE parameters.
    const soundcloudLoginUrl = `${SOUNDCLOUD_AUTH_ENDPOINT}?client_id=${config.SOUNDCLOUD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      SOUNDCLOUD_REDIRECT_URI
    )}&response_type=${SOUNDCLOUD_RESPONSE_TYPE}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    // Redirect the browser to SoundCloud's login page.
    window.location.href = soundcloudLoginUrl;
  };

  // Button styling with improved appearance
  const loggedInStyle = {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#191414',
    textDecoration: 'none',
    borderRadius: '30px',
    fontWeight: 'bold',
    margin: '10px',
    border: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    fontSize: '0.9rem',
    letterSpacing: '0.5px'
  };

  const spotifyButtonStyle = {
    display: 'inline-block',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #1DB954, #1ED760)',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '30px',
    fontWeight: 'bold',
    margin: '10px',
    boxShadow: '0 2px 4px rgba(29, 185, 84, 0.3)',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    fontSize: '0.9rem',
    letterSpacing: '0.5px'
  };

  const soundcloudButtonStyle = {
    display: 'inline-block',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #ff5500, #ff7700)',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '30px',
    fontWeight: 'bold',
    margin: '10px',
    boxShadow: '0 2px 4px rgba(255, 85, 0, 0.3)',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    fontSize: '0.9rem',
    letterSpacing: '0.5px'
  };

  // Generate welcome message
  let headerMessage = "Login to Access Music Services";
  let subMessage = "";

  // Generate appropriate sub-message based on login state
  if (spotifyNeeded && soundcloudNeeded) {
    subMessage = "Log in to either service to start using the app";
  } else if (spotifyNeeded) {
    subMessage = "Log in with Spotify to access more features";
  } else if (soundcloudNeeded) {
    subMessage = "Log in with SoundCloud to access more features";
  } else {
    subMessage = "You're fully logged in!";
  }

  // No login needed, handle differently
  if (!spotifyNeeded && !soundcloudNeeded) {
    headerMessage = "You're ready to go!";
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ color: '#fff' }}>
        {headerMessage}
      </h2>

      <p style={{ color: '#ddd', marginBottom: '20px' }}>
        {subMessage}
      </p>

      {/* Spotify login button - only show if needed */}
      {spotifyNeeded ? (
        spotifyToken ? (
          <button style={loggedInStyle} disabled>
            Logged into Spotify
          </button>
        ) : (
          <a
            href={spotifyLoginUrl}
            style={spotifyButtonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 185, 84, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(29, 185, 84, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Login with Spotify
          </a>
        )
      ) : (
        <button style={loggedInStyle} disabled>
          Logged into Spotify
        </button>
      )}

      {/* SoundCloud login button - only show if needed */}
      {soundcloudNeeded ? (
        soundcloudToken ? (
          <button style={loggedInStyle} disabled>
            Logged into SoundCloud
          </button>
        ) : (
          // Use a button with an onClick handler because we need to perform async PKCE steps.
          <button
            onClick={handleSoundCloudLogin}
            style={soundcloudButtonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 85, 0, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(255, 85, 0, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Login with SoundCloud
          </button>
        )
      ) : (
        <button style={loggedInStyle} disabled>
          Logged into SoundCloud
        </button>
      )}

      {/* Clear storage hint */}
      <p style={{
        color: 'rgba(255,255,255,0.5)',
        fontSize: '12px',
        marginTop: '40px',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '4px',
        display: 'inline-block'
      }}>
        <span style={{ opacity: 0.8 }}>⚠️</span> If you're having trouble logging in, try clearing your browser cache.
      </p>
    </div>
  );
}
