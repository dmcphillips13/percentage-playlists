import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function SharedPlaylistsMainView({ onBack, onSelectSharedPlaylist }) {
  const { spotifyToken, soundcloudToken } = useContext(AuthContext);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [soundcloudPlaylists, setSoundcloudPlaylists] = useState([]);
  const [sharedPlaylists, setSharedPlaylists] = useState([]);

  useEffect(() => {
    // Fetch Spotify playlists
    if (spotifyToken) {
      fetch('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.items) setSpotifyPlaylists(data.items);
        })
        .catch((err) => console.error("Error fetching Spotify playlists:", err));
    }
  }, [spotifyToken]);

  useEffect(() => {
    // Fetch SoundCloud playlists (using Authorization header)
    if (soundcloudToken) {
      fetch('https://api.soundcloud.com/me/playlists', {
        headers: { Authorization: `OAuth ${soundcloudToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          setSoundcloudPlaylists(data);
        })
        .catch((err) => console.error("Error fetching SoundCloud playlists:", err));
    }
  }, [soundcloudToken]);

  useEffect(() => {
    // Group playlists by normalized title and take the intersection.
    const normalize = (str) => str.toLowerCase().trim();
    const spotifyMap = {};
    spotifyPlaylists.forEach((pl) => {
      spotifyMap[normalize(pl.name)] = pl;
    });
    const soundcloudMap = {};
    soundcloudPlaylists.forEach((pl) => {
      soundcloudMap[normalize(pl.title)] = pl;
    });
    const shared = [];
    Object.keys(spotifyMap).forEach((title) => {
      if (soundcloudMap[title]) {
        shared.push({
          title: spotifyMap[title].name, // use Spotify's name
          spotify: spotifyMap[title],
          soundcloud: soundcloudMap[title]
        });
      }
    });
    setSharedPlaylists(shared);
  }, [spotifyPlaylists, soundcloudPlaylists]);

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#1DB954',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        &larr; Back
      </button>
      <h2 style={{ color: '#fff' }}>Shared Playlists</h2>
      {sharedPlaylists.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sharedPlaylists.map((pl, index) => (
            <li key={index} style={{ marginBottom: '12px' }}>
              <button
                onClick={() => onSelectSharedPlaylist(pl)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1DB954',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                {pl.title}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#bbb' }}>No shared playlists found.</p>
      )}
    </div>
  );
}
