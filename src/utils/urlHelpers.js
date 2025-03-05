/**
 * Utility functions for handling URLs in both development and production (GitHub Pages) environments
 */

// Get the base URL for the app based on environment
export const getBaseUrl = () => {
  return process.env.NODE_ENV === 'production'
    ? '/percentage-playlists'
    : '';
};

// Generate a full app URL with the correct base path
export const getAppUrl = (path = '/') => {
  const basePath = getBaseUrl();
  // Make sure path starts with a slash, but don't duplicate slashes
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
};

// Create a callback URL for OAuth providers
export const getCallbackUrl = (provider) => {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://dmcphillips13.github.io/percentage-playlists'
    : 'http://localhost:3000';
    
  return `${baseUrl}/callback?provider=${provider}`;
};

// Parse the URL to handle GitHub Pages SPA routing
export const parseGitHubPagesUrl = () => {
  const search = window.location.search;
  const hash = window.location.hash;
  
  // Handle GitHub Pages SPA routing format
  // Check if this is a GitHub Pages redirect with '?/callback' pattern
  const ghPagesMatch = search.match(/^\?\/(callback.*)$/);
  let effectiveSearch = search;
  
  if (ghPagesMatch) {
    // Convert GitHub Pages format to normal format
    effectiveSearch = `?${ghPagesMatch[1]}`;
  }
  
  return {
    search: effectiveSearch,
    hash: hash
  };
};