import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Login';
import LoggedInLandingPage from './components/LoggedInLandingPage';
import SpotifyMainView from './components/SpotifyMainView';               // Spotify view
import SoundCloudMainView from './components/SoundCloudMainView';
import SharedPlaylistsMainView from './components/SharedPlaylistsMainView';
import SharedPlaylistDetail from './components/SharedPlaylistDetail';

function AppContent() {
  const { spotifyToken, soundcloudToken } = useContext(AuthContext);
  // view can be: "landing", "spotify", "soundcloud", "shared"
  const [view, setView] = useState('landing');
  const [selectedSharedPlaylist, setSelectedSharedPlaylist] = useState(null);

  const handleLogout = () => {
    window.localStorage.removeItem('spotify_token');
    window.localStorage.removeItem('soundcloud_token');
    window.location.reload();
  };

  if (!spotifyToken || !soundcloudToken) {
    return (
      <div style={{ background: '#191414', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <Login />
      </div>
    );
  }

  return (
    <div style={{ background: '#191414', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>My Playlists</h1>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid #1DB954',
            borderRadius: '4px',
            color: '#1DB954',
            padding: '8px 12px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>
      {view === 'landing' && <LoggedInLandingPage onSelectView={setView} />}
      {view === 'spotify' && <SpotifyMainView onBack={() => setView('landing')} />}
      {view === 'soundcloud' && <SoundCloudMainView onBack={() => setView('landing')} />}
      {view === 'shared' && (
        selectedSharedPlaylist ? (
          <SharedPlaylistDetail
            sharedPlaylist={selectedSharedPlaylist}
            onBack={() => setSelectedSharedPlaylist(null)}
            onPlayPauseCombined={(track, action, source) => {
              // For Spotify, call your Spotify playback; for SoundCloud, you might call a function passed down.
              if (source === 'spotify') {
                console.log(`Spotify: ${action} track ${track.name || track.title}`);
              } else if (source === 'soundcloud') {
                // You can either call a dedicated function or let SharedPlaylistDetail handle SoundCloud playback internally.
                // Here we leave it to SharedPlaylistDetail.
              }
            }}
          />
        ) : (
          <SharedPlaylistsMainView
            onBack={() => setView('landing')}
            onSelectSharedPlaylist={(pl) => {
              setSelectedSharedPlaylist(pl);
            }}
          />
        )
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
