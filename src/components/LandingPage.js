import React from 'react';

export default function LandingPage({ onEnter }) {
  return (
    <div>
      <p>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onEnter();
          }}
          style={{
            color: '#1DB954',
            fontSize: '18px',
            textDecoration: 'none'
          }}
        >
          Playlists Finder
        </a>
      </p>
    </div>
  );
}
