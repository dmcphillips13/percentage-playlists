/**
 * Utility functions for handling URLs in both development and production environments
 */

// Get the base URL for the app (empty for Vercel deployment)
export const getBaseUrl = () => {
  return '';
};

// Generate a full app URL with the correct base path
export const getAppUrl = (path = '/') => {
  const basePath = getBaseUrl();
  // Make sure path starts with a slash, but don't duplicate slashes
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
};

// Create a callback URL for OAuth providers
export const getCallbackUrl = (provider, config = null) => {
  // In development, use localhost directly
  // In production with server, use the BASE_URL provided by the server API
  // Otherwise fallback to window.location.origin
  let baseUrl;

  if (process.env.NODE_ENV === 'development') {
    baseUrl = 'http://localhost:3000';
  } else if (config && config.BASE_URL) {
    baseUrl = config.BASE_URL;
  } else {
    baseUrl = window.location.origin;
  }

  // For SoundCloud in production, use the custom redirect URI if available
  if (
    provider === 'soundcloud' &&
    process.env.NODE_ENV !== 'development' &&
    config && config.SOUNDCLOUD_REDIRECT_URI
  ) {
    return config.SOUNDCLOUD_REDIRECT_URI;
  }

  return `${baseUrl}/callback?provider=${provider}`;
};

// Parse the URL for callback handling
export const parseGitHubPagesUrl = () => {
  // Just return the search and hash as is - no special handling needed for Vercel
  return {
    search: window.location.search,
    hash: window.location.hash
  };
};
