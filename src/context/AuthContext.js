import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  // Extract token from localStorage or URL hash on app load.
  useEffect(() => {
    let tokenFromStorage = window.localStorage.getItem('token');
    const hash = window.location.hash;
    if (!tokenFromStorage && hash) {
      const tokenFromUrl = hash
        .substring(1)
        .split('&')
        .find((elem) => elem.startsWith('access_token'))
        .split('=')[1];
      window.location.hash = '';
      window.localStorage.setItem('token', tokenFromUrl);
      tokenFromStorage = tokenFromUrl;
    }
    setToken(tokenFromStorage);
  }, []);

  // Fetch user profile when token changes.
  useEffect(() => {
    if (token) {
      fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((response) => response.json())
        .then((data) => setUser(data))
        .catch((err) => console.error('Error fetching user profile:', err));
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, setToken, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
