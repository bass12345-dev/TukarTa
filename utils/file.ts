import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';

/**
 * Reads a file from a URI and returns it as an ArrayBuffer.
 * Works across Web, Android, and iOS.
 */
export async function readAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    // 1. Web: Use fetch + blob
    const response = await fetch(uri);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } else {
    // 2. Native: Use expo-file-system/legacy + base64 decoding
    // We import dynamically to avoid loading native-only modules on web
    const FileSystem = require('expo-file-system/legacy');
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    return decode(base64);
  }
}
