import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import MainView from './components/MainView';

function AppContent() {
  const { token } = useContext(AuthContext);
  // landingMode controls whether the landing page is shown.
  const [landingMode, setLandingMode] = useState(true);

  const handleEnter = () => setLandingMode(false);

  const handleLogout = () => {
    // Reset landing mode on logout.
    setLandingMode(true);
    // Clear token from localStorage.
    window.localStorage.removeItem('token');
    // Reload the app to reinitialize authentication.
    window.location.reload();
  };

  if (!token) {
    return (
      <div
        style={{
          background: '#191414',
          color: '#fff',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'Helvetica, Arial, sans-serif'
        }}
      >
        <Login />
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#191414',
        color: '#fff',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Helvetica, Arial, sans-serif'
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h1 style={{ margin: 0, color: '#fff' }}>My Spotify Playlists</h1>
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
      {landingMode ? (
        <LandingPage onEnter={handleEnter} />
      ) : (
        <MainView />
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
