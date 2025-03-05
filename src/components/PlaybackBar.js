import React, { useContext, useState, useEffect } from 'react';
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
    currentPosition,
    trackDuration,
    seekToPosition,
    shuffleMode,
    toggleShuffle
  } = useContext(PlaybackContext);

  // State for the slider input value
  const [sliderValue, setSliderValue] = useState(0);
  // State to track whether user is currently dragging the slider
  const [isDragging, setIsDragging] = useState(false);

  // Format time in MM:SS format
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Effect to update slider value when currentPosition changes
  useEffect(() => {
    if (!isDragging && currentPosition >= 0) {
      setSliderValue(currentPosition);
    }
  }, [currentPosition, isDragging]);

  // Handle slider change events
  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setSliderValue(value);
  };

  // Handle slider interaction events
  const handleSliderMouseDown = () => setIsDragging(true);
  const handleSliderMouseUp = () => {
    setIsDragging(false);
    seekToPosition(sliderValue);
  };
  const handleSliderTouchStart = () => setIsDragging(true);
  const handleSliderTouchEnd = () => {
    setIsDragging(false);
    seekToPosition(sliderValue);
  };

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
        flexDirection: 'column',
      }}
    >
      {/* Timeline slider */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', width: '100%' }}>
        <span style={{ marginRight: '10px', fontSize: '12px' }}>
          {formatTime(currentPosition)}
        </span>
        <input
          type="range"
          min={0}
          max={trackDuration || 100} // Fallback to 100 if duration not available
          value={sliderValue}
          onChange={handleSliderChange}
          onMouseDown={handleSliderMouseDown}
          onMouseUp={handleSliderMouseUp}
          onTouchStart={handleSliderTouchStart}
          onTouchEnd={handleSliderTouchEnd}
          style={{ flex: 1, height: '4px', accentColor: '#1DB954' }}
        />
        <span style={{ marginLeft: '10px', fontSize: '12px' }}>
          {formatTime(trackDuration)}
        </span>
      </div>

      {/* Track info and controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div>{currentTrack.name || currentTrack.title}</div>
          <div style={{ fontSize: '12px' }}>{currentPlaylist.title || currentPlaylist.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Shuffle button */}
          <button
            onClick={toggleShuffle}
            style={{
              marginRight: '15px',
              background: 'transparent',
              border: 'none',
              color: shuffleMode ? '#1DB954' : '#888',
              fontSize: '16px',
              cursor: 'pointer',
              position: 'relative'
            }}
            title={shuffleMode ? "Shuffle on (intelligent shuffle)" : "Shuffle off"}
          >
            🔀
            {shuffleMode &&
              <span style={{
                position: 'absolute',
                bottom: '-5px',
                right: '-8px',
                backgroundColor: '#1DB954',
                borderRadius: '50%',
                width: '8px',
                height: '8px'
              }}></span>
            }
          </button>

          {/* Playback controls */}
          <button
            onClick={skipBackward}
            style={{ marginRight: '10px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
          >
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
            style={{ marginRight: '10px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>
          <button
            onClick={skipForward}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
          >
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}
