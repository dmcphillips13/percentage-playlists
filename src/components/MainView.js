import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Playlists from './Playlists';
import PlaylistDetail from './PlaylistDetail';
import SongPlaylists from './SongPlaylists';

export default function MainView() {
  const { token, user } = useContext(AuthContext);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  // Playback state: which track is playing and whether it is playing.
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch playlists when token is available and no specific view is active.
  useEffect(() => {
    if (token && !selectedPlaylist && !selectedTrack) {
      fetch('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.items) {
            setPlaylists(data.items);
          } else {
            console.error('Unexpected response data:', data);
          }
        })
        .catch((error) => console.error('Error fetching playlists:', error));
    }
  }, [token, selectedPlaylist, selectedTrack]);

  // Filter playlists to only those owned by the logged-in user.
  const userOwnedPlaylists = user
    ? playlists.filter((pl) => pl.owner && pl.owner.id === user.id)
    : playlists;

  // Playback control function.
  const handlePlayPause = (track, action) => {
    if (action === 'play') {
      fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [track.uri] })
      })
        .then(() => {
          setPlayingTrackId(track.id);
          setIsPlaying(true);
        })
        .catch((err) => console.error('Error playing track:', err));
    } else if (action === 'pause') {
      fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => setIsPlaying(false))
        .catch((err) => console.error('Error pausing track:', err));
    }
  };

  // Navigation handlers.
  const handlePlaylistClick = (playlist) => setSelectedPlaylist(playlist);
  const handleTrackClick = (track) => setSelectedTrack(track);
  const handleBackFromPlaylistDetail = () => setSelectedPlaylist(null);
  const handleBackFromSongPlaylists = () => setSelectedTrack(null);
  const handleSongPlaylistSelect = (playlist) => {
    setSelectedTrack(null);
    setSelectedPlaylist(playlist);
  };

  return (
    <>
      {selectedPlaylist && !selectedTrack ? (
        <PlaylistDetail
          token={token}
          playlistId={selectedPlaylist.id}
          goBack={handleBackFromPlaylistDetail}
          onTrackClick={handleTrackClick}
          onPlayPause={handlePlayPause}
          playingTrackId={playingTrackId}
          isPlaying={isPlaying}
        />
      ) : selectedTrack ? (
        <SongPlaylists
          token={token}
          track={selectedTrack}
          userPlaylists={userOwnedPlaylists}
          onPlaylistSelect={handleSongPlaylistSelect}
          onBack={handleBackFromSongPlaylists}
          onPlayPause={handlePlayPause}
          playingTrackId={playingTrackId}
          isPlaying={isPlaying}
        />
      ) : (
        <Playlists playlists={playlists} onPlaylistClick={handlePlaylistClick} />
      )}
    </>
  );
}
