import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PlaybackContext } from '../context/PlaybackContext';

export default function SoundCloudPlaylistDetail({ playlist, onBack, onTrackClick }) {
  const { soundcloudToken } = useContext(AuthContext);
  const { playTrack, pauseTrack, currentSource, isPlaying } = useContext(PlaybackContext);
  // Assume that the playlist object here already contains full track details in playlist.tracks

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: 'transparent', border: 'none', color: '#1DB954', fontSize: '16px', cursor: 'pointer', marginBottom: '20px' }}
      >
        &larr; Back
      </button>
      <h2 style={{ color: '#fff' }}>{playlist.title}</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {playlist.tracks.map((track, index) => (
          <li key={track.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onTrackClick(track);
              }}
              style={{ textDecoration: 'none', color: '#1DB954', fontSize: '16px' }}
            >
              {track.title}
            </a>
            <button
              onClick={() => {
                if (isPlaying && currentSource && currentSource !== 'soundcloud') {
                  pauseTrack();
                }
                playTrack(playlist, index, 'soundcloud', track);
              }}
              style={{ background: 'transparent', border: 'none', color: '#1DB954', fontSize: '16px', cursor: 'pointer', marginRight: '10px' }}
            >
              Play
            </button>
            <button
              onClick={pauseTrack}
              style={{ background: 'transparent', border: 'none', color: '#1DB954', fontSize: '16px', cursor: 'pointer' }}
            >
              Pause
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
