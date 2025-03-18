import React, { useState, useContext, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PlaybackProvider } from './context/PlaybackContext';
import Login from './components/Login';
import SpotifyMainView from './components/SpotifyMainView';               // Spotify SpotifyMainView
import SoundCloudMainView from './components/SoundCloudMainView';
import SharedPlaylistsMainView from './components/SharedPlaylistsMainView';
import SharedPlaylistDetail from './components/SharedPlaylistDetail';
import PlaybackBar from './components/PlaybackBar';
import { parseGitHubPagesUrl } from './utils/urlHelpers';

function AppContent() {
  const {
    spotifyToken,
    soundcloudToken,
    validateSpotifyToken,
    validateSoundCloudToken,
    appVersion
  } = useContext(AuthContext);

  // view can be: "landing", "spotify", "soundcloud", "shared", "sharedDetail"
  const [view, setView] = useState('landing');
  // For shared detail view, store the selected shared playlist.
  const [selectedSharedPlaylist, setSelectedSharedPlaylist] = useState(null);
  // Track token validation state
  const [tokensValid, setTokensValid] = useState({ spotify: !!spotifyToken, soundcloud: !!soundcloudToken });

  // Validate tokens whenever they change or app version changes
  useEffect(() => {
    const validateTokens = async () => {
      // Only validate if we have tokens
      if (spotifyToken) {
        const spotifyValid = await validateSpotifyToken(spotifyToken);
        setTokensValid(prev => ({ ...prev, spotify: spotifyValid }));
      } else {
        setTokensValid(prev => ({ ...prev, spotify: false }));
      }

      if (soundcloudToken) {
        const soundcloudValid = await validateSoundCloudToken(soundcloudToken);
        setTokensValid(prev => ({ ...prev, soundcloud: soundcloudValid }));
      } else {
        setTokensValid(prev => ({ ...prev, soundcloud: false }));
      }
    };

    validateTokens();

    // Add a periodic validation (every 5 minutes)
    const intervalId = setInterval(validateTokens, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [spotifyToken, soundcloudToken, validateSpotifyToken, validateSoundCloudToken, appVersion]);

  // Handle GitHub Pages routing
  useEffect(() => {
    // Check if we need to handle GitHub Pages SPA routing
    const { search } = parseGitHubPagesUrl();

    // If we have a callback parameter, we're in the OAuth flow, ignore
    if (search.includes('provider=')) {
      return;
    }

    // If we have a GitHub Pages redirect pattern, try to extract the view
    const routeMatch = search.match(/^\?\/(spotify|soundcloud|shared)/i);
    if (routeMatch) {
      const newView = routeMatch[1].toLowerCase();
      setView(newView);
    }
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem('spotify_token');
    window.localStorage.removeItem('soundcloud_token');
    window.location.reload();
  };

  // Are we able to view shared playlists? (requires both tokens)
  const canViewSharedPlaylists = tokensValid.spotify && tokensValid.soundcloud;

  // Helper to handle service selection
  const handleServiceSelection = (serviceType) => {
    if (serviceType === 'spotify' && tokensValid.spotify) {
      setView('spotify');
    } else if (serviceType === 'soundcloud' && tokensValid.soundcloud) {
      setView('soundcloud');
    } else if (serviceType === 'shared' && canViewSharedPlaylists) {
      setView('shared');
    }
  };

  return (
    <div style={{ background: '#191414', color: '#fff', minHeight: '100vh', paddingBottom: '60px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
        <h1 style={{ margin: 0 }}>My Playlists</h1>
        {(tokensValid.spotify || tokensValid.soundcloud) && (
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #1DB954',
              borderRadius: '4px',
              color: '#1DB954',
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        )}
      </header>

      {/* Always show login section for not-yet-authenticated providers */}
      <div style={{ marginBottom: '30px' }}>
        <Login
          spotifyNeeded={!tokensValid.spotify}
          soundcloudNeeded={!tokensValid.soundcloud}
        />
      </div>

      {/* Show available service buttons when at least one provider is authenticated */}
      {(tokensValid.spotify || tokensValid.soundcloud) && (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {tokensValid.spotify && (
            <button
              onClick={() => handleServiceSelection('spotify')}
              style={{
                padding: '12px 24px',
                margin: '10px',
                backgroundColor: '#1DB954',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Spotify Playlists
            </button>
          )}

          {tokensValid.soundcloud && (
            <button
              onClick={() => handleServiceSelection('soundcloud')}
              style={{
                padding: '12px 24px',
                margin: '10px',
                backgroundColor: '#ff5500',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              SoundCloud Playlists
            </button>
          )}

          <button
            onClick={() => handleServiceSelection('shared')}
            disabled={!canViewSharedPlaylists}
            style={{
              padding: '12px 24px',
              margin: '10px',
              backgroundColor: canViewSharedPlaylists ? '#333' : '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: canViewSharedPlaylists ? 'pointer' : 'not-allowed',
              opacity: canViewSharedPlaylists ? 1 : 0.6
            }}
          >
            Shared Playlists
          </button>
        </div>
      )}

      {/* Main content views */}
      {view === 'spotify' && tokensValid.spotify && (
        <SpotifyMainView onBack={() => setView('landing')} />
      )}

      {view === 'soundcloud' && tokensValid.soundcloud && (
        <SoundCloudMainView onBack={() => setView('landing')} />
      )}

      {view === 'shared' && canViewSharedPlaylists && (
        selectedSharedPlaylist ? (
          <SharedPlaylistDetail
            sharedPlaylist={selectedSharedPlaylist}
            onBack={() => setSelectedSharedPlaylist(null)}
            onPlayPauseCombined={(track, action, source) => {
              // This callback can be used if you want to override global playback for shared view.
              console.log(`${source}: ${action} track ${track.name || track.title}`);
            }}
          />
        ) : (
          <SharedPlaylistsMainView
            onBack={() => setView('landing')}
            onSelectSharedPlaylist={(pl) => setSelectedSharedPlaylist(pl)}
          />
        )
      )}

      {/* The PlaybackBar is always visible */}
      <PlaybackBar />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PlaybackProvider>
        <AppContent />
      </PlaybackProvider>
    </AuthProvider>
  );
}

export default App;
