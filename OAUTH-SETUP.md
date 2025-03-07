# OAuth Provider Setup Guide

## Spotify Developer Dashboard Setup

### Development Environment Setup

1. Log in to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Select your app (or create a new one) for development
3. Click "Edit Settings"
4. Under "Redirect URIs", add the following URL:
   ```
   http://localhost:3000/callback?provider=spotify
   ```
5. Click "Save"
6. Copy the Client ID to your `.env` file:
   ```
   REACT_APP_SPOTIFY_CLIENT_ID=your_development_client_id
   ```

### Production Environment Setup

For production, you have two options:

#### Option 1: Use the same app with multiple redirect URIs

1. Using the same Spotify app, add additional redirect URIs:
   - For Vercel deployment:
     ```
     https://your-vercel-app-name.vercel.app/callback?provider=spotify
     ```
   - If you have a custom domain:
     ```
     https://your-custom-domain.com/callback?provider=spotify
     ```
2. Add this value to your production environment variables:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   ```

#### Option 2: Create a separate app for production (recommended)

1. Create a new app in the Spotify Developer Dashboard specifically for production
2. Set the redirect URI to your production URL:
   ```
   https://your-production-domain.com/callback/spotify
   ```
   Note: This can be a custom path different from the development URL format
3. Add these values to your production environment variables:
   ```
   SPOTIFY_CLIENT_ID=your_production_client_id
   SPOTIFY_REDIRECT_URI=https://your-production-domain.com/callback/spotify
   ```

The application will automatically use the correct configuration based on the environment.

## SoundCloud Developer Dashboard Setup

### Development Environment Setup

1. Log in to the [SoundCloud Developer Portal](https://developers.soundcloud.com/)
2. Create a new app or select your existing app for development
3. Under "Redirect URIs", add the following URL:
   ```
   http://localhost:3000/callback?provider=soundcloud
   ```
4. Make sure your app is set to use "Authorization Code Flow with PKCE"
5. Save your changes
6. Copy the Client ID and Client Secret to your `.env` file:
   ```
   REACT_APP_SOUNDCLOUD_CLIENT_ID=your_development_client_id
   REACT_APP_SOUNDCLOUD_CLIENT_SECRET=your_development_client_secret
   ```

### Production Environment Setup

For production, you have two options:

#### Option 1: Use the same app with multiple redirect URIs

1. Using the same SoundCloud app, add additional redirect URIs:
   - For Vercel deployment:
     ```
     https://your-vercel-app-name.vercel.app/callback?provider=soundcloud
     ```
   - If you have a custom domain:
     ```
     https://your-custom-domain.com/callback?provider=soundcloud
     ```
2. Add these values to your production environment variables:
   ```
   SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
   SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret
   ```

#### Option 2: Create a separate app for production (recommended)

1. Create a new app in the SoundCloud Developer Portal specifically for production
2. Set the redirect URI to your production URL:
   ```
   https://your-production-domain.com/callback/soundcloud
   ```
   Note: This can be a custom path different from the development URL format
3. Add these values to your production environment variables:
   ```
   SOUNDCLOUD_CLIENT_ID=your_production_client_id
   SOUNDCLOUD_CLIENT_SECRET=your_production_client_secret
   SOUNDCLOUD_REDIRECT_URI=https://your-production-domain.com/callback/soundcloud
   ```

The application will automatically use the correct configuration based on the environment.

## Troubleshooting OAuth Errors

### "Invalid redirect URI" error

This error means the redirect URI in your login request doesn't match any of the URIs registered in the developer dashboard.

To fix this:
1. Double-check the registered redirect URIs in your Spotify/SoundCloud developer dashboards
2. Make sure they match **exactly** with what's being used in your application
3. For Vercel deployments, you may need to add the Vercel preview URLs as well
4. Remember that URIs are case-sensitive and must include the full path

### "Invalid client" error

This error might occur if:
1. Your client ID is incorrect
2. Your app is not properly registered
3. The OAuth provider's API is having issues

To fix this:
1. Verify your client ID and client secret
2. Regenerate the client secret if necessary
3. Make sure your app is approved and active in the developer dashboard