export type AppTheme = 'oled-black' | 'cyber-neon' | 'pro-gold';

export interface VideoChapter {
  title: string;
  timestamp: number; // in seconds
  timeFormatted: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  channelTitle: string;
  channelAvatar: string;
  channelSubscribers: string;
  channelVerified: boolean;
  views: string;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
  category: string;
  likes: string;
  dislikes?: string;
  chapters?: VideoChapter[];
  sponsorSegments?: { start: number; end: number }[];
  // Where the video came from: a downloaded YouTube video or a file already on the device.
  source?: 'download' | 'device';
}

export interface TimestampNote {
  id: string;
  videoId: string;
  videoTitle: string;
  timestamp: number;
  timeFormatted: string;
  noteText: string;
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  videoCount: number;
  videoIds: string[];
  thumbnail: string;
  createdAt: string;
}

export interface VideoFilterSettings {
  brightness: number; // 50 to 150 % (default 100)
  contrast: number; // 50 to 150 % (default 100)
  saturation: number; // 0 to 200 % (default 100)
  sepia: number; // 0 to 100 % (default 0)
  invert: boolean; // default false
  bassBoost: boolean; // default false
  vocalEnhance: boolean; // default false
}


export interface SponsorSegment {
  start: number;
  end: number;
}

// A YouTube video saved to app storage, with the metadata collected at download time.
export interface DownloadedVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelVerified: boolean;
  channelSubscribers: number | null;
  views: number | null;
  likes: number | null;
  dislikes: number | null;
  uploadDate: string;
  durationSeconds: number;
  category: string;
  tags: string[];
  chapters: VideoChapter[];
  sponsorSegments: SponsorSegment[];
  fileUri: string;
  thumbnailUri: string;
  channelAvatarUri: string;
  fileSizeBytes: number;
  quality: string;
  mimeType: string;
  isAudioOnly: boolean;
  downloadedAt: string;
}

// A video found on the device's media library.
export interface DeviceVideo {
  id: string;
  filename: string;
  durationSeconds: number;
  width: number | null;
  height: number | null;
  createdAt: number | null;
}
