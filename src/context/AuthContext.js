import React, { createContext, useState, useEffect } from 'react';
import { getCallbackUrl, parseGitHubPagesUrl, getBaseUrl } from '../utils/urlHelpers';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [spotifyToken, setSpotifyToken] = useState('');
  const [soundcloudToken, setSoundcloudToken] = useState('');
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState({
    SOUNDCLOUD_CLIENT_ID: '',
    SPOTIFY_CLIENT_ID: ''
  });

  // First, fetch config from server or use environment variables in dev mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // In development mode with npm run dev, use React environment variables directly
      setConfig({
        SPOTIFY_CLIENT_ID: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
        SOUNDCLOUD_CLIENT_ID: process.env.REACT_APP_SOUNDCLOUD_CLIENT_ID
      });
    } else {
      // In production or when using the Express server, fetch from API
      axios.get('/api/config')
        .then(response => {
          setConfig(response.data);
        })
        .catch(error => {
          console.error('Error fetching config:', error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store a deployment version in localStorage to handle redeployments
  const [appVersion, setAppVersion] = useState('1.0');

  // Check if we need to clear tokens due to a deployment
  useEffect(() => {
    // Initialize or retrieve the current app version
    axios.get('/api/version')
      .then(response => {
        const serverVersion = response.data.version || '1.0';
        const storedVersion = window.localStorage.getItem('app_version');

        if (!storedVersion || storedVersion !== serverVersion) {
          // Clear tokens when version changes (new deployment)
          console.log('App version changed, clearing authentication tokens');
          window.localStorage.removeItem('spotify_token');
          window.localStorage.removeItem('soundcloud_token');
          window.localStorage.setItem('app_version', serverVersion);
          setAppVersion(serverVersion);
        } else {
          setAppVersion(storedVersion);
        }
      })
      .catch(error => {
        console.error('Error fetching app version:', error);
        // Default to current stored version, or set a new one if none exists
        const storedVersion = window.localStorage.getItem('app_version') || '1.0';
        window.localStorage.setItem('app_version', storedVersion);
        setAppVersion(storedVersion);
      });
  }, []);

  useEffect(() => {
    // Only proceed if we have config loaded
    if (!config.SPOTIFY_CLIENT_ID || !config.SOUNDCLOUD_CLIENT_ID) return;

    // Check local storage for tokens
    let storedSpotifyToken = window.localStorage.getItem('spotify_token');
    let storedSoundcloudToken = window.localStorage.getItem('soundcloud_token');

    // Parse URL, handling GitHub Pages SPA routing as needed
    const { search: effectiveSearch, hash } = parseGitHubPagesUrl();

    // Use URLSearchParams to check for provider information in the URL
    const searchParams = new URLSearchParams(effectiveSearch);
    const provider = searchParams.get('provider'); // expected values: "spotify" or "soundcloud"

    // --- Spotify: (using implicit flow) ---
    if (provider === 'spotify' && hash) {
      const hashContent = hash.substring(1); // remove the '#' character
      const params = new URLSearchParams(hashContent);
      const tokenFromUrl = params.get('access_token');
      if (tokenFromUrl) {
        storedSpotifyToken = tokenFromUrl;
        window.localStorage.setItem('spotify_token', tokenFromUrl);
      }
      // Clean URL - ensure we keep the correct base path
      const basePath = getBaseUrl();
      window.history.pushState("", document.title, `${basePath}/`);
    }

    // --- SoundCloud: using PKCE Authorization Code Flow with server-side token exchange ---
    if (provider === 'soundcloud') {
      // Check if the URL has a "code" parameter (authorization code)
      const code = searchParams.get('code');
      if (code) {
        // Retrieve the code verifier that was stored before redirection.
        const codeVerifier = window.localStorage.getItem('soundcloud_code_verifier');
        if (!codeVerifier) {
          console.error("No code verifier found for SoundCloud.");
        } else {
          // Handle token exchange based on environment
          if (process.env.NODE_ENV === 'development') {
            // In development mode, handle the token exchange directly using environment variables
            const body = new URLSearchParams();
            body.append('client_id', process.env.REACT_APP_SOUNDCLOUD_CLIENT_ID);
            body.append('client_secret', process.env.REACT_APP_SOUNDCLOUD_CLIENT_SECRET);
            body.append('redirect_uri', getCallbackUrl('soundcloud', config));
            body.append('grant_type', 'authorization_code');
            body.append('code', code);
            body.append('code_verifier', codeVerifier);

            fetch('https://secure.soundcloud.com/oauth/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: body.toString()
            })
              .then(response => response.json())
              .then(data => {
                if (data.access_token) {
                  storedSoundcloudToken = data.access_token;
                  window.localStorage.setItem('soundcloud_token', data.access_token);
                  setSoundcloudToken(data.access_token);
                } else {
                  console.error("Token exchange error:", data);
                }
                // Clean URL
                const basePath = getBaseUrl();
                window.history.pushState("", document.title, `${basePath}/`);
              })
              .catch(err => console.error('Error exchanging SoundCloud code for token:', err));
          } else {
            // In production, use our server API to exchange the code for a token
            // Use the redirect URI from config which can be custom in production
            const redirectUri = getCallbackUrl('soundcloud', config);
            axios.post('/api/soundcloud/token', {
              code,
              code_verifier: codeVerifier,
              redirect_uri: redirectUri
            })
              .then((response) => {
                if (response.data.access_token) {
                  storedSoundcloudToken = response.data.access_token;
                  window.localStorage.setItem('soundcloud_token', response.data.access_token);
                  setSoundcloudToken(response.data.access_token);
                } else {
                  console.error("Token exchange error:", response.data);
                }
                // Clean URL so that the code parameter is removed, maintain correct base path
                const basePath = getBaseUrl();
                window.history.pushState("", document.title, `${basePath}/`);
              })
              .catch((err) =>
                console.error('Error exchanging SoundCloud code for token:', err)
              );
          }
        }
      }
    }

    // Validate tokens before setting them
    if (storedSpotifyToken) {
      validateSpotifyToken(storedSpotifyToken).then(isValid => {
        if (isValid) {
          setSpotifyToken(storedSpotifyToken);
        } else {
          // Clear invalid token
          window.localStorage.removeItem('spotify_token');
          setSpotifyToken('');
        }
      });
    } else {
      setSpotifyToken('');
    }

    if (storedSoundcloudToken) {
      validateSoundCloudToken(storedSoundcloudToken).then(isValid => {
        if (isValid) {
          setSoundcloudToken(storedSoundcloudToken);
        } else {
          // Clear invalid token
          window.localStorage.removeItem('soundcloud_token');
          setSoundcloudToken('');
        }
      });
    } else {
      setSoundcloudToken('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Function to validate Spotify token
  const validateSpotifyToken = async (token) => {
    if (!token) return false;

    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.status === 200;
    } catch (error) {
      console.error('Error validating Spotify token:', error);
      return false;
    }
  };

  // Function to validate SoundCloud token
  const validateSoundCloudToken = async (token) => {
    if (!token) return false;

    try {
      const response = await fetch('https://api.soundcloud.com/me', {
        headers: { Authorization: `OAuth ${token}` }
      });

      return response.status === 200;
    } catch (error) {
      console.error('Error validating SoundCloud token:', error);
      return false;
    }
  };

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
        config,
        appVersion,
        setSpotifyToken,
        setSoundcloudToken,
        validateSpotifyToken,
        validateSoundCloudToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
