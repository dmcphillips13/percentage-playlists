import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import SpotifyPlaylists from './SpotifyPlaylists';
import SpotifyPlaylistDetail from './SpotifyPlaylistDetail';
import SpotifySongPlaylists from './SpotifySongPlaylists';
import { PlaybackContext } from '../context/PlaybackContext';

export default function SpotifyMainView({ onBack }) {
  const { spotifyToken } = useContext(AuthContext);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  // Track IDs managed by PlaybackContext now, these remain for backwards compatibility
  const [playingTrackId] = useState(null);
  const [isPlaying] = useState(false);

  const { pauseTrack, playTrack } = useContext(PlaybackContext);

  // Fetch Spotify playlists when needed
  useEffect(() => {
    if (spotifyToken && !selectedPlaylist && !selectedTrack) {
      fetch('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.items) {
            setPlaylists(data.items);
          }
        })
        .catch((error) =>
          console.error("Error fetching Spotify playlists:", error)
        );
    }
  }, [spotifyToken, selectedPlaylist, selectedTrack]);

  const handlePlayPause = (track, action, index) => {
    if (action === 'play') {
      playTrack(selectedPlaylist, index, 'spotify', track);
    } else if (action === 'pause') {
      pauseTrack();
    }
  };

  return (
    <div>
      {/* Header with back button */}
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#1DB954',
            fontSize: '16px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          &larr; Back
        </button>
        <h2 style={{ margin: 0, color: '#fff' }}>Spotify Playlists</h2>
      </header>
      {selectedPlaylist && !selectedTrack ? (
        <SpotifyPlaylistDetail
          token={spotifyToken}
          playlistId={selectedPlaylist.id}
          goBack={() => setSelectedPlaylist(null)}
          onTrackClick={(track) => setSelectedTrack(track)}
          onPlayPause={handlePlayPause}
          playingTrackId={playingTrackId}
          isPlaying={isPlaying}
        />
      ) : selectedTrack ? (
        <SpotifySongPlaylists
          token={spotifyToken}
          track={selectedTrack}
          userPlaylists={playlists}
          onPlaylistSelect={(pl) => {
            setSelectedTrack(null);
            setSelectedPlaylist(pl);
          }}
          onBack={() => setSelectedTrack(null)}
          onPlayPause={handlePlayPause}
          playingTrackId={playingTrackId}
          isPlaying={isPlaying}
        />
      ) : (
        <SpotifyPlaylists playlists={playlists} onPlaylistClick={(pl) => setSelectedPlaylist(pl)} />
      )}
    </div>
  );
}
