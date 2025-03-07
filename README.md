# Percentage Playlists

A web application for managing and playing music playlists from Spotify and SoundCloud. Includes features like intelligent shuffle, cross-platform playlist sharing, and custom playback controls.

This project can be deployed to Vercel or GitHub Pages.

## Features

- Integration with Spotify and SoundCloud APIs
- Create and manage shared playlists with tracks from both platforms
- Intelligent shuffle algorithm that prevents consecutive tracks from the same artist and minimizes album repetition
- Custom audio playback controls with timeline display
- Mobile-friendly responsive design

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the React app in development mode without the Express server.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

**Note:** When using `npm run dev`, you need to set the REACT_APP_* environment variables in your .env file.

### `npm start`

Runs the Express server with the production build of the React app.\
Open [http://localhost:3001](http://localhost:3001) to view it in your browser.

This is the recommended way to test the production setup locally.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

The project is set up to be deployed to either Vercel or GitHub Pages.

#### Vercel Deployment

To deploy the project to Vercel:

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Sign up or log in to [Vercel](https://vercel.com)
3. Click "New Project" and import your repository
4. Add the required environment variables in the "Environment Variables" section:
   - `SPOTIFY_CLIENT_ID`
   - `SOUNDCLOUD_CLIENT_ID`
   - `SOUNDCLOUD_CLIENT_SECRET`
   - `SOUNDCLOUD_REDIRECT_URI` (optional, for custom redirect path)
5. Click "Deploy"

The project includes a `vercel.json` configuration file that handles:
- Node.js server deployment
- Build settings for React frontend
- Routing configuration for the Express API and SPA
- Secure server-side handling of sensitive credentials

For setting up OAuth providers with different development and production environments, see [OAUTH-SETUP.md](OAUTH-SETUP.md).

#### GitHub Pages Deployment

Alternatively, the project can be deployed to GitHub Pages:

1. Ensure the `homepage` field in `package.json` is set to your GitHub Pages URL
2. Go to your repository's Settings tab
3. Navigate to "Pages" section
4. Under "Build and deployment", select "GitHub Actions" as the source
5. The site will be published at: https://[username].github.io/percentage-playlists/

### Environment Variables

The project supports two modes of operation, each with different environment variable requirements:

#### Production Mode (Express Server)

When running in production or with `npm start`, the application uses server-side environment variables that are not exposed to client-side JavaScript:

- `SPOTIFY_CLIENT_ID`: Your Spotify API client ID
- `SOUNDCLOUD_CLIENT_ID`: Your SoundCloud API client ID
- `SOUNDCLOUD_CLIENT_SECRET`: Your SoundCloud API client secret
- `SOUNDCLOUD_REDIRECT_URI`: (Optional) Custom redirect URI for SoundCloud in production
- `PORT`: (Optional) Port for the Express server (defaults to 3001)

#### Development Mode

When running with `npm run dev`, the React development server requires client-side environment variables:

- `REACT_APP_SPOTIFY_CLIENT_ID`: Your Spotify API client ID
- `REACT_APP_SOUNDCLOUD_CLIENT_ID`: Your SoundCloud API client ID
- `REACT_APP_SOUNDCLOUD_CLIENT_SECRET`: Your SoundCloud API client secret

A `.env.example` file is included in the project to show the required variables for both modes.

**Separate Development and Production SoundCloud Apps**: You can use different SoundCloud apps for development and production environments. See [OAUTH-SETUP.md](OAUTH-SETUP.md) for detailed instructions.

**Security Note:** In production, the Express server keeps your credentials secure. In development mode, credentials are embedded in the client-side code for convenience but should not be used in a production environment.
