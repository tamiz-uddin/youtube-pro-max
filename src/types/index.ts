export type QualityOption = '1080p' | '720p' | '480p' | 'audio_only';

export type AppTheme = 'oled-black' | 'cyber-neon' | 'pro-gold';

export interface VideoChapter {
  title: string;
  timestamp: number; // in seconds
  timeFormatted: string;
}

export interface VideoComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  likes: number;
  timeAgo: string;
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
  comments?: VideoComment[];
  isShort?: boolean;
  sponsorSegments?: { start: number; end: number }[];
}

export interface ShortItem {
  id: string;
  title: string;
  videoUrl: string;
  channelTitle: string;
  channelAvatar: string;
  likes: string;
  commentsCount: string;
  soundTitle: string;
  soundArtist: string;
  tags: string[];
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

export interface OfflineDownload {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  quality: QualityOption;
  fileSizeMb: number;
  downloadedAt: string;
  isPermanent: boolean; // GUARANTEE: Never auto-deletes!
  channelTitle: string;
  duration: string;
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

export interface StudioAnalytics {
  views28d: number;
  viewsGrowth: number;
  watchTimeHours: number;
  subscribers: number;
  subscribersGrowth: number;
  estimatedRevenue: number;
  ctrPercent: number;
  viewsHistory: { day: string; views: number }[];
}
