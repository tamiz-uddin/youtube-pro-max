import { requireOptionalNativeModule } from 'expo';
import { DeviceVideo } from '../types';

type MediaLibraryModule = typeof import('expo-media-library');

// expo-media-library throws at import time when its native code is missing (Expo Go, or a
// development build made before the library was added). Load it only when it is present so
// the rest of the app keeps working and the Device tab can explain what is needed.
const MediaLibrary: MediaLibraryModule | null = requireOptionalNativeModule('ExpoMediaLibraryNext')
  ? (require('expo-media-library') as MediaLibraryModule)
  : null;

export const isDeviceLibrarySupported = MediaLibrary !== null;

const getLibrary = (): MediaLibraryModule => {
  if (!MediaLibrary) throw new Error('expo-media-library is not available in this build.');
  return MediaLibrary;
};

const PAGE_SIZE = 60;

export type DevicePermission = 'granted' | 'limited' | 'denied' | 'undetermined';

const toPermission = (res: { granted: boolean; canAskAgain: boolean; accessPrivileges?: string }): DevicePermission => {
  if (res.granted) return res.accessPrivileges === 'limited' ? 'limited' : 'granted';
  return res.canAskAgain ? 'undetermined' : 'denied';
};

export const deviceMediaService = {
  async getPermission(): Promise<DevicePermission> {
    if (!MediaLibrary) return 'denied';
    return toPermission(await MediaLibrary.getPermissionsAsync(false, ['video']));
  },

  async requestPermission(): Promise<DevicePermission> {
    if (!MediaLibrary) return 'denied';
    return toPermission(await MediaLibrary.requestPermissionsAsync(false, ['video']));
  },

  /** One page of device videos, newest first. */
  async listVideos(offset: number): Promise<{ videos: DeviceVideo[]; hasMore: boolean }> {
    const { Query, AssetField, MediaType } = getLibrary();
    const rows = await new Query()
      .eq(AssetField.MEDIA_TYPE, MediaType.VIDEO)
      .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
      .limit(PAGE_SIZE)
      .offset(offset)
      .exeForMetadata();

    const videos = rows.map((row) => ({
      id: row.id,
      filename: row.filename || 'Video',
      // Media library durations are in milliseconds.
      durationSeconds: row.duration ? Math.round(row.duration / 1000) : 0,
      width: row.width,
      height: row.height,
      createdAt: row.creationTime,
    }));
    return { videos, hasMore: rows.length === PAGE_SIZE };
  },

  /** Playable URI for a device video (content:// on Android, ph:// or file:// on iOS). */
  async getPlayableUri(id: string): Promise<string> {
    const { Asset } = getLibrary();
    return new Asset(id).getUri();
  },
};
