import React, { useState, useContext, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PlaybackProvider } from './context/PlaybackContext';
import Login from './components/Login';
import SpotifyMainView from './components/SpotifyMainView';
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

  // Improved button styles with hover effects
  const buttonStyle = (color, isDisabled = false) => ({
    padding: '12px 24px',
    margin: '10px',
    backgroundColor: isDisabled ? '#666' : color,
    color: '#fff',
    border: 'none',
    borderRadius: '30px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    fontWeight: '600',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    fontSize: '0.9rem',
    letterSpacing: '0.5px'
  });

  return (
    <div style={{
      background: 'linear-gradient(to bottom, #191414, #121212)',
      color: '#fff',
      minHeight: '100vh',
      paddingBottom: '80px',
      fontFamily: 'Helvetica, Arial, sans-serif',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          margin: 0,
          fontWeight: 700,
          letterSpacing: '0.5px',
          background: 'linear-gradient(to right, #1DB954, #1ED760)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>My Playlists</h1>

        {(tokensValid.spotify || tokensValid.soundcloud) && (
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #1DB954',
              borderRadius: '24px',
              color: '#1DB954',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Logout
          </button>
        )}
      </header>

      {/* Card-like container for main content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
      }}>
        {/* Always show login section for not-yet-authenticated providers */}
        <div style={{
          marginBottom: '30px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <Login
            spotifyNeeded={!tokensValid.spotify}
            soundcloudNeeded={!tokensValid.soundcloud}
          />
        </div>

        {/* Show available service buttons when at least one provider is authenticated */}
        {(tokensValid.spotify || tokensValid.soundcloud) && (
          <div style={{
            textAlign: 'center',
            marginBottom: '30px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ marginTop: 0 }}>Your Music Services</h2>
            <div>
              {tokensValid.spotify && (
                <button
                  onClick={() => handleServiceSelection('spotify')}
                  style={buttonStyle('#1DB954')}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 185, 84, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Spotify Playlists
                </button>
              )}

              {tokensValid.soundcloud && (
                <button
                  onClick={() => handleServiceSelection('soundcloud')}
                  style={buttonStyle('#ff5500')}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 85, 0, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  SoundCloud Playlists
                </button>
              )}

              <button
                onClick={() => handleServiceSelection('shared')}
                disabled={!canViewSharedPlaylists}
                style={buttonStyle('#333', !canViewSharedPlaylists)}
                onMouseOver={(e) => {
                  if (canViewSharedPlaylists) {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 100, 100, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (canViewSharedPlaylists) {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                Shared Playlists
              </button>
            </div>
          </div>
        )}

        {/* Main content views */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '10px',
          padding: view !== 'landing' ? '20px' : '0',
          boxShadow: view !== 'landing' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
          display: view !== 'landing' ? 'block' : 'none'
        }}>
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
        </div>
      </div>

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
