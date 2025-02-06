import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Login';
import LoggedInLandingPage from './components/LoggedInLandingPage';
import MainView from './components/MainView'; // Spotify view (assumed to already work)
import SoundCloudMainView from './components/SoundCloudMainView';

function AppContent() {
  const { spotifyToken, soundcloudToken } = useContext(AuthContext);
  const [view, setView] = useState('landing'); // "landing", "spotify", or "soundcloud"

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
      {view === 'spotify' && <MainView onBack={() => setView('landing')} />}
      {view === 'soundcloud' && <SoundCloudMainView onBack={() => setView('landing')} />}
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
