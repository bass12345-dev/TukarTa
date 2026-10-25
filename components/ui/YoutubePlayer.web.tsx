import type YoutubeIframe from 'react-native-youtube-iframe';

// Web renders the YouTube embed as an <iframe>, so the native player is never mounted here.
const YoutubePlayer = (() => null) as unknown as typeof YoutubeIframe;

export default YoutubePlayer;
export type { YoutubeIframeRef } from 'react-native-youtube-iframe';
