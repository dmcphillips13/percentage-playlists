# OAuth Provider Setup Guide

## Spotify Developer Dashboard Setup

1. Log in to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Select your app (or create a new one)
3. Click "Edit Settings"
4. Under "Redirect URIs", add **all** of these URLs:
   - For local development:
     ```
     http://localhost:3000/callback?provider=spotify
     ```
   - For Vercel deployment:
     ```
     https://your-vercel-app-name.vercel.app/callback?provider=spotify
     ```
   - If you have a custom domain:
     ```
     https://your-custom-domain.com/callback?provider=spotify
     ```
5. Click "Save"

## SoundCloud Developer Dashboard Setup

1. Log in to the [SoundCloud Developer Portal](https://developers.soundcloud.com/)
2. Go to your app settings
3. Under "Redirect URIs", add **all** of these URLs:
   - For local development:
     ```
     http://localhost:3000/callback?provider=soundcloud
     ```
   - For Vercel deployment:
     ```
     https://your-vercel-app-name.vercel.app/callback?provider=soundcloud
     ```
   - If you have a custom domain:
     ```
     https://your-custom-domain.com/callback?provider=soundcloud
     ```
4. Make sure your app is set to use "Authorization Code Flow with PKCE"
5. Save your changes

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