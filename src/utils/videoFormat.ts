import { DeviceVideo, DownloadedVideo, VideoItem } from '../types';

export const formatClock = (totalSeconds: number) => {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h > 0 ? m.toString().padStart(2, '0') : m.toString();
  return `${h > 0 ? `${h}:` : ''}${mm}:${s.toString().padStart(2, '0')}`;
};

export const formatCount = (value: number | null) => {
  if (value === null) return '–';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
};

export const formatBytes = (bytes: number | null) => {
  if (bytes === null || bytes <= 0) return '–';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
};

export const formatDate = (isoOrMs: string | number | null) => {
  if (isoOrMs === null) return '';
  const d = new Date(isoOrMs);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Shape a downloaded video for the player. */
export const downloadedToVideoItem = (d: DownloadedVideo): VideoItem => ({
  id: d.id,
  title: d.title,
  description: d.description,
  thumbnail: d.thumbnailUri,
  videoUrl: d.fileUri,
  channelTitle: d.channelTitle,
  channelAvatar: d.channelAvatarUri,
  channelSubscribers: d.channelSubscribers !== null ? `${formatCount(d.channelSubscribers)} subscribers` : '',
  channelVerified: d.channelVerified,
  views: formatCount(d.views),
  publishedAt: d.uploadDate,
  duration: formatClock(d.durationSeconds),
  durationSeconds: d.durationSeconds,
  category: d.category,
  likes: formatCount(d.likes),
  dislikes: d.dislikes !== null ? formatCount(d.dislikes) : undefined,
  chapters: d.chapters,
  sponsorSegments: d.sponsorSegments,
  source: 'download',
});

/** Shape a device video for the player once its playable URI is known. */
export const deviceToVideoItem = (v: DeviceVideo, uri: string): VideoItem => ({
  id: `device-${v.id}`,
  title: v.filename.replace(/\.[^/.]+$/, ''),
  description: '',
  thumbnail: '',
  videoUrl: uri,
  channelTitle: 'On this device',
  channelAvatar: '',
  channelSubscribers: '',
  channelVerified: false,
  views: '',
  publishedAt: formatDate(v.createdAt),
  duration: formatClock(v.durationSeconds),
  durationSeconds: v.durationSeconds,
  category: 'Device',
  likes: '',
  source: 'device',
});
