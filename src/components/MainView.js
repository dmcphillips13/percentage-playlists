import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Playlists from './Playlists';
import PlaylistDetail from './PlaylistDetail';
import SongPlaylists from './SongPlaylists';

export default function MainView({ onBack }) {
  const { spotifyToken } = useContext(AuthContext);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handlePlayPause = (track, action) => {
    // Stub: Implement Spotify playback control with the Web Playback SDK as needed.
    console.log(`Spotify: ${action} track ${track.name}`);
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
        <PlaylistDetail
          token={spotifyToken}
          playlistId={selectedPlaylist.id}
          goBack={() => setSelectedPlaylist(null)}
          onTrackClick={(track) => setSelectedTrack(track)}
          onPlayPause={handlePlayPause}
          playingTrackId={playingTrackId}
          isPlaying={isPlaying}
        />
      ) : selectedTrack ? (
        <SongPlaylists
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
        <Playlists playlists={playlists} onPlaylistClick={(pl) => setSelectedPlaylist(pl)} />
      )}
    </div>
  );
}
