import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// SoundCloud configuration — update these with your actual credentials
const SOUNDCLOUD_CLIENT_ID = process.env.REACT_APP_SOUNDCLOUD_CLIENT_ID;
const SOUNDCLOUD_CLIENT_SECRET = process.env.REACT_APP_SOUNDCLOUD_CLIENT_SECRET;
const SOUNDCLOUD_REDIRECT_URI = 'http://localhost:3000/callback?provider=soundcloud';
// Use the endpoint as per the docs that require the client secret:
const SOUNDCLOUD_TOKEN_ENDPOINT = 'https://secure.soundcloud.com/oauth/token';

export const AuthProvider = ({ children }) => {
  const [spotifyToken, setSpotifyToken] = useState('');
  const [soundcloudToken, setSoundcloudToken] = useState('');
  const [user, setUser] = useState(null); // For example, you might fetch Spotify user data here

  useEffect(() => {
    // Check local storage for tokens
    let storedSpotifyToken = window.localStorage.getItem('spotify_token');
    let storedSoundcloudToken = window.localStorage.getItem('soundcloud_token');

    // Use URLSearchParams to check for provider information in the URL
    const searchParams = new URLSearchParams(window.location.search);
    const provider = searchParams.get('provider'); // expected values: "spotify" or "soundcloud"

    // --- Spotify: (using implicit flow) ---
    if (provider === 'spotify' && window.location.hash) {
      const hash = window.location.hash.substring(1); // remove the '#' character
      const params = new URLSearchParams(hash);
      const tokenFromUrl = params.get('access_token');
      if (tokenFromUrl) {
        storedSpotifyToken = tokenFromUrl;
        window.localStorage.setItem('spotify_token', tokenFromUrl);
      }
      // Clean URL
      window.history.pushState("", document.title, window.location.pathname);
    }

    // --- SoundCloud: using PKCE Authorization Code Flow with client secret ---
    if (provider === 'soundcloud') {
      // Check if the URL has a "code" parameter (authorization code)
      const code = searchParams.get('code');
      if (code) {
        // Retrieve the code verifier that was stored before redirection.
        const codeVerifier = window.localStorage.getItem('soundcloud_code_verifier');
        if (!codeVerifier) {
          console.error("No code verifier found for SoundCloud.");
        }
        // Prepare a request body to exchange the authorization code for an access token.
        const body = new URLSearchParams();
        body.append('client_id', SOUNDCLOUD_CLIENT_ID);
        body.append('client_secret', SOUNDCLOUD_CLIENT_SECRET);
        // Use the exact registered redirect URI:
        body.append('redirect_uri', SOUNDCLOUD_REDIRECT_URI);
        body.append('grant_type', 'authorization_code');
        body.append('code', code);
        body.append('code_verifier', codeVerifier);

        // POST to SoundCloud's token endpoint (which now requires the client secret)
        fetch(SOUNDCLOUD_TOKEN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.access_token) {
              storedSoundcloudToken = data.access_token;
              window.localStorage.setItem('soundcloud_token', data.access_token);
              setSoundcloudToken(data.access_token);
            } else {
              console.error("Token exchange error:", data);
            }
            // Clean URL so that the code parameter is removed.
            window.history.pushState("", document.title, window.location.pathname);
          })
          .catch((err) =>
            console.error('Error exchanging SoundCloud code for token:', err)
          );
      }
    }

    setSpotifyToken(storedSpotifyToken);
    setSoundcloudToken(storedSoundcloudToken);
  }, []);

  // Optional: Fetch Spotify user profile if needed.
  useEffect(() => {
    if (spotifyToken) {
      fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      })
        .then((response) => response.json())
        .then((data) => setUser(data))
        .catch((err) =>
          console.error('Error fetching Spotify user profile:', err)
        );
    }
  }, [spotifyToken]);

  return (
    <AuthContext.Provider
      value={{
        spotifyToken,
        soundcloudToken,
        user,
        setSpotifyToken,
        setSoundcloudToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
