import React, { useContext } from 'react';
import { PlaybackContext } from '../context/PlaybackContext';

export default function PlaybackBar() {
  const {
    currentPlaylist,
    currentTrackIndex,
    currentSource,
    isPlaying,
    pauseTrack,
    playTrack,
    skipForward,
    skipBackward,
  } = useContext(PlaybackContext);

  // If nothing is playing, show a minimal placeholder.
  if (!currentPlaylist || currentTrackIndex === null) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          width: '100%',
          background: '#222',
          color: '#fff',
          padding: '10px',
          textAlign: 'center',
        }}
      >
        No track is playing.
      </div>
    );
  }

  const currentTrack = currentPlaylist.tracks[currentTrackIndex];
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        width: '97%',
        background: '#222',
        color: '#fff',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div>{currentTrack.name || currentTrack.title}</div>
        <div style={{ fontSize: '12px' }}>{currentPlaylist.title}</div>
      </div>
      <div>
        <button onClick={skipBackward} style={{ marginRight: '10px' }}>
          ⏮
        </button>
        <button
          onClick={() => {
            if (isPlaying) {
              pauseTrack();
            } else {
              playTrack(currentPlaylist, currentTrackIndex, currentSource, currentTrack);
            }
          }}
          style={{ marginRight: '10px' }}
        >
          {isPlaying ? '⏸' : '▶️'}
        </button>
        <button onClick={skipForward}>⏭</button>
      </div>
    </div>
  );
}
