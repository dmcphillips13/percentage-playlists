const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
require('dotenv').config();

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// SoundCloud token exchange endpoint
app.post('/api/soundcloud/token', async (req, res) => {
  try {
    const { code, code_verifier, redirect_uri } = req.body;
    
    const tokenResponse = await axios.post('https://secure.soundcloud.com/oauth/token', 
      new URLSearchParams({
        client_id: process.env.SOUNDCLOUD_CLIENT_ID,
        client_secret: process.env.SOUNDCLOUD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        code_verifier,
        redirect_uri
      }), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    res.json(tokenResponse.data);
  } catch (error) {
    console.error('Error exchanging SoundCloud code for token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// API endpoint to get client IDs securely
app.get('/api/config', (req, res) => {
  // Get the host from the request
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const baseUrl = `${protocol}://${host}`;
  
  res.json({
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SOUNDCLOUD_CLIENT_ID: process.env.SOUNDCLOUD_CLIENT_ID,
    SOUNDCLOUD_REDIRECT_URI: process.env.SOUNDCLOUD_REDIRECT_URI,
    SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI,
    BASE_URL: baseUrl
  });
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});