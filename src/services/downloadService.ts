import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { DownloadedVideo, SponsorSegment } from '../types';
import { DownloadFormat, YouTubeVideoInfo } from './youtubeService';

// Files live in the app's document directory, which the OS does not clear like the cache.
// They are removed only when the user deletes them or uninstalls the app.
const videosDir = () => new Directory(Paths.document, 'videos');
const imagesDir = () => new Directory(Paths.document, 'thumbnails');

export class DownloadCancelledError extends Error {
  constructor() {
    super('Download cancelled');
    this.name = 'DownloadCancelledError';
  }
}

export interface DownloadProgressInfo {
  bytesWritten: number;
  // null when the server does not send Content-Length
  totalBytes: number | null;
}

export interface ActiveDownload {
  promise: Promise<DownloadedVideo>;
  cancel: () => void;
}

export const isDownloadSupported = Platform.OS !== 'web';

const ensureDirs = () => {
  videosDir().create({ idempotent: true, intermediates: true });
  imagesDir().create({ idempotent: true, intermediates: true });
};

// Images are best-effort: keep the remote URL if saving fails so the item still shows something online.
const saveImage = async (url: string, name: string): Promise<string> => {
  if (!url) return '';
  try {
    const file = await File.downloadFileAsync(url, new File(imagesDir(), name), { idempotent: true });
    return file.uri;
  } catch {
    return url;
  }
};

const deleteIfExists = (uri: string) => {
  try {
    if (!uri.startsWith('file:')) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Already gone
  }
};

export const downloadService = {
  start(
    info: YouTubeVideoInfo,
    format: DownloadFormat,
    sponsorSegments: SponsorSegment[],
    onProgress: (progress: DownloadProgressInfo) => void
  ): ActiveDownload {
    if (!isDownloadSupported) {
      return {
        promise: Promise.reject(new Error('Downloading is only available in the Android and iOS apps.')),
        cancel: () => {},
      };
    }

    ensureDirs();
    const stamp = Date.now();
    const destination = new File(videosDir(), `${info.youtubeId}-${stamp}.${format.extension}`);
    let cancelled = false;

    const task = File.createDownloadTask(format.url, destination, {
      headers: format.headers,
      onProgress: ({ bytesWritten, totalBytes }) => {
        onProgress({
          bytesWritten,
          totalBytes: totalBytes > 0 ? totalBytes : format.sizeBytes,
        });
      },
    });

    const promise = (async () => {
      let file: File | null;
      try {
        file = await task.downloadAsync();
      } catch (err) {
        deleteIfExists(destination.uri);
        if (cancelled) throw new DownloadCancelledError();
        throw err;
      }
      if (!file || cancelled) {
        deleteIfExists(destination.uri);
        throw new DownloadCancelledError();
      }
      if (file.size === 0) {
        deleteIfExists(file.uri);
        throw new Error('The server returned an empty file.');
      }

      const [thumbnailUri, channelAvatarUri] = await Promise.all([
        saveImage(info.thumbnail, `${info.youtubeId}-${stamp}.jpg`),
        saveImage(info.channelAvatar, `${info.youtubeId}-${stamp}-channel.jpg`),
      ]);

      const video: DownloadedVideo = {
        id: `dl-${info.youtubeId}-${stamp}`,
        youtubeId: info.youtubeId,
        title: info.title,
        description: info.description,
        channelTitle: info.channelTitle,
        channelVerified: info.channelVerified,
        channelSubscribers: info.channelSubscribers,
        views: info.views,
        likes: info.likes,
        dislikes: info.dislikes,
        uploadDate: info.uploadDate,
        durationSeconds: info.durationSeconds,
        category: info.category,
        tags: info.tags,
        chapters: info.chapters,
        sponsorSegments,
        fileUri: file.uri,
        thumbnailUri,
        channelAvatarUri,
        fileSizeBytes: file.size,
        quality: format.label,
        mimeType: format.mimeType,
        isAudioOnly: format.isAudioOnly,
        downloadedAt: new Date().toISOString(),
      };
      return video;
    })();

    return {
      promise,
      cancel: () => {
        cancelled = true;
        task.cancel();
      },
    };
  },

  /** Remove a downloaded video's file and its saved images. */
  deleteFiles(video: DownloadedVideo) {
    deleteIfExists(video.fileUri);
    deleteIfExists(video.thumbnailUri);
    deleteIfExists(video.channelAvatarUri);
  },

  /** True if the video file is still present (it can be missing after a restore or manual cleanup). */
  fileExists(video: DownloadedVideo): boolean {
    if (!isDownloadSupported) return false;
    try {
      return new File(video.fileUri).exists;
    } catch {
      return false;
    }
  },
};
