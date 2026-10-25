// Native YouTube player. Kept behind this module so web never bundles react-native-youtube-iframe
// (its web entry needs react-native-web-webview); web uses a plain <iframe> instead.
export { default } from 'react-native-youtube-iframe';
export type { YoutubeIframeRef } from 'react-native-youtube-iframe';
