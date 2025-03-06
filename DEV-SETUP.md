# Development Setup Guide

## Environment Variables

For development mode with `npm run dev`, create a `.env` file at the root of your project with the following variables:

```
# React development environment variables - MUST be prefixed with REACT_APP_
REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
REACT_APP_SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id_here
REACT_APP_SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret_here
```

Important notes:
1. The `REACT_APP_` prefix is required for Create React App to expose these variables to the client-side code
2. No quotes are needed around the values
3. There should be no spaces around the equals sign

## For Production Testing

If you want to test the production mode with the Express server locally:

1. Create a `.env` file with both sets of variables:
```
# Server-side environment variables (for production)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id_here
SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret_here

# Client-side environment variables (for development)
REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
REACT_APP_SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id_here
REACT_APP_SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret_here

# Optional port for the Express server
PORT=3001
```

2. Build the React app:
```
npm run build
```

3. Start the Express server:
```
npm start
```

4. Open http://localhost:3001 in your browser

## Troubleshooting

If you're having issues with the client IDs not being recognized:

1. Make sure your `.env` file is in the root directory of the project (same level as package.json)
2. Verify there are no typos in variable names
3. Restart the development server after changing environment variables
4. Clear your browser cache and local storage