import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import SoundCloudPlaylists from './SoundCloudPlaylists';
import SoundCloudPlaylistDetail from './SoundCloudPlaylistDetail';
import SoundCloudSongPlaylists from './SoundCloudSongPlaylists';

export default function SoundCloudMainView({ onBack }) {
  const { soundcloudToken } = useContext(AuthContext);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Fetch SoundCloud playlists using the Authorization header
  useEffect(() => {
    if (soundcloudToken && !selectedPlaylist && !selectedTrack) {
      fetch(`https://api.soundcloud.com/me/playlists`, {
        headers: {
          Authorization: `OAuth ${soundcloudToken}`
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch SoundCloud playlists");
          }
          return response.json();
        })
        .then((data) => {
          setPlaylists(data);
        })
        .catch((error) =>
          console.error("Error fetching SoundCloud playlists:", error)
        );
    }
  }, [soundcloudToken, selectedPlaylist, selectedTrack]);

  // Handle play/pause for a SoundCloud track
  const handlePlayPause = (track, action) => {
    // Construct the stream URL using track.stream_url.
    // Ensure it uses HTTPS.
    let streamUrl = track.stream_url;
    if (streamUrl.startsWith('http://')) {
      streamUrl = 'https://' + streamUrl.substring(7);
    }

    if (action === 'play') {
      // If the same track is already playing and paused, resume it.
      if (audioRef.current && playingTrackId === track.id) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error("Error resuming SoundCloud track:", err);
          });
      } else {
        // Pause any currently playing track.
        if (audioRef.current) {
          audioRef.current.pause();
        }
        // Fetch the track using the Authorization header.
        fetch(streamUrl, {
          headers: {
            Authorization: `OAuth ${soundcloudToken}`,
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
          })
          .then((blob) => {
            // Create an object URL from the blob.
            const objectUrl = URL.createObjectURL(blob);
            const audio = new Audio();
            audio.src = objectUrl;
            audio.crossOrigin = "anonymous";
            audioRef.current = audio;
            return audio.play();
          })
          .then(() => {
            setPlayingTrackId(track.id);
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error("Error playing SoundCloud track:", err);
          });
      }
    } else if (action === 'pause') {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
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
        <h2 style={{ margin: 0, color: '#fff' }}>SoundCloud Playlists</h2>
      </header>
      {selectedPlaylist && !selectedTrack ? (
        <SoundCloudPlaylistDetail
          playlist={selectedPlaylist}
          onBack={() => setSelectedPlaylist(null)}
          onTrackClick={(track) => setSelectedTrack(track)}
          onPlayPause={handlePlayPause}
          playingTrackId={playingTrackId}
          isPlaying={isPlaying}
        />
      ) : selectedTrack ? (
        <SoundCloudSongPlaylists
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
        <SoundCloudPlaylists onPlaylistClick={(pl) => setSelectedPlaylist(pl)} />
      )}
    </div>
  );
}
