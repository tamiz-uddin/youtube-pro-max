import { DeviceVideo } from '../types';

// expo-media-library has no web implementation and throws when imported on web,
// so web gets this stub and the Device tab shows an "app only" message.
export const isDeviceLibrarySupported = false;

export type DevicePermission = 'granted' | 'limited' | 'denied' | 'undetermined';

export const deviceMediaService = {
  async getPermission(): Promise<DevicePermission> {
    return 'denied';
  },

  async requestPermission(): Promise<DevicePermission> {
    return 'denied';
  },

  async listVideos(_offset: number): Promise<{ videos: DeviceVideo[]; hasMore: boolean }> {
    return { videos: [], hasMore: false };
  },

  async getPlayableUri(_id: string): Promise<string> {
    throw new Error('Device videos are not available on web.');
  },
};
