# Percentage Playlists

A web application for managing and playing music playlists from Spotify and SoundCloud. Includes features like intelligent shuffle, cross-platform playlist sharing, and custom playback controls.

This project is deployed at: [https://dmcphillips13.github.io/percentage-playlists](https://dmcphillips13.github.io/percentage-playlists)

## Features

- Integration with Spotify and SoundCloud APIs
- Create and manage shared playlists with tracks from both platforms
- Intelligent shuffle algorithm that prevents consecutive tracks from the same artist and minimizes album repetition
- Custom audio playback controls with timeline display
- Mobile-friendly responsive design

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

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

The project is set up for GitHub Pages deployment using GitHub Actions.

#### Automated Deployment

The repository is configured with a GitHub Actions workflow that automatically deploys the app to GitHub Pages when changes are pushed to the main branch. The workflow:

1. Builds the React application
2. Uploads the build artifacts to GitHub Pages
3. Deploys the application automatically

To enable GitHub Pages deployment:

1. Go to your repository's Settings tab
2. Navigate to "Pages" section
3. Under "Build and deployment", select "GitHub Actions" as the source
4. The site will be published at: https://dmcphillips13.github.io/percentage-playlists/

### Environment Variables

The application requires the following environment variables for API access:

- `REACT_APP_SPOTIFY_CLIENT_ID`: Your Spotify API client ID
- `REACT_APP_SOUNDCLOUD_CLIENT_ID`: Your SoundCloud API client ID
