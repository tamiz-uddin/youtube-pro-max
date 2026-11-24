import { Innertube, Platform, Constants, Log, YT } from 'youtubei.js';
import type { Types } from 'youtubei.js';
import { SponsorSegment, VideoChapter } from '../types';

// Video data is fetched by the phone itself with YouTube.js (https://ytjs.dev), the same
// approach NewPipe uses. Public Piped servers were dropped because YouTube blocks them.

// Deciphering stream URLs runs YouTube's player code, which YouTube.js asks the host to evaluate.
Platform.shim.eval = async (data: Types.BuildScriptResult) => new Function(data.output)();
Log.setLevel(Log.Level.NONE);

// Clients that return combined audio+video files a plain HTTP download can fetch.
// Each URL only works when downloaded with the same client's User-Agent.
const STREAM_CLIENTS = ['ANDROID', 'ANDROID_VR'] as const;
type StreamClient = (typeof STREAM_CLIENTS)[number];

export interface YouTubeSearchResult {
  youtubeId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  channelVerified: boolean;
  durationSeconds: number;
  views: number | null;
  uploadedDate: string;
}

export interface DownloadFormat {
  id: string;
  label: string;
  url: string;
  headers: Record<string, string>;
  mimeType: string;
  extension: string;
  isAudioOnly: boolean;
  sizeBytes: number | null;
}

export interface YouTubeVideoInfo {
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  channelAvatar: string;
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
  formats: DownloadFormat[];
}

const ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

let clientPromise: Promise<Innertube> | null = null;

/** One shared session. retrieve_player loads the player code needed to decipher URLs. */
const getClient = (): Promise<Innertube> => {
  if (!clientPromise) {
    clientPromise = Innertube.create({ retrieve_player: true }).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
};

const formatClock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/** "275,983 views" → 275983, "15.8M subscribers" → 15800000 */
const parseCount = (text: unknown): number | null => {
  if (typeof text === 'number') return Number.isFinite(text) ? text : null;
  if (typeof text !== 'string') return null;
  const match = text.replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return null;
  const n = parseFloat(match[1]);
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[(match[2] || '').toUpperCase() as 'K' | 'M' | 'B'] ?? 1;
  return Number.isFinite(n) ? Math.round(n * mult) : null;
};

const textOf = (value: unknown): string => (value ? String(value) : '');

const describeError = (err: unknown): string => {
  const message = err instanceof Error ? err.message : String(err);
  if (/not a bot|LOGIN_REQUIRED|Sign in to confirm/i.test(message)) {
    return 'YouTube asked to confirm you are not a bot. Wait a while and try again, or try another network.';
  }
  if (/Network request failed|fetch failed|timed? ?out/i.test(message)) {
    return 'Could not reach YouTube. Check your internet connection.';
  }
  return message || 'Something went wrong while contacting YouTube.';
};

async function collectFormats(info: YT.VideoInfo, yt: Innertube, client: StreamClient): Promise<DownloadFormat[]> {
  const headers = { 'User-Agent': Constants.CLIENTS[client].USER_AGENT };
  const streaming = info.streaming_data;
  if (!streaming) return [];

  const muxed = streaming.formats.filter((f) => f.mime_type.startsWith('video/mp4'));
  // Best AAC track; M4A plays on Android and iOS, WebM/Opus does not play on iOS.
  const audio = streaming.adaptive_formats
    .filter((f) => f.has_audio && !f.has_video && f.mime_type.startsWith('audio/mp4'))
    .filter((f) => !f.audio_track || f.audio_track.audio_is_default)
    .sort((a, b) => b.bitrate - a.bitrate)
    .slice(0, 1);

  const formats: DownloadFormat[] = [];
  for (const f of [...muxed, ...audio]) {
    let url: string;
    try {
      url = await f.decipher(yt.session.player);
    } catch {
      continue; // Some clients return formats without a usable URL
    }
    const isAudioOnly = !f.has_video;
    formats.push({
      id: `${client}-${f.itag}`,
      label: isAudioOnly ? `Audio only ${Math.round(f.bitrate / 1000)} kbps` : `${f.quality_label || f.quality} video`,
      url,
      headers,
      mimeType: f.mime_type,
      extension: isAudioOnly ? 'm4a' : 'mp4',
      isAudioOnly,
      sizeBytes: f.content_length && f.content_length > 0 ? f.content_length : null,
    });
  }
  return formats;
}

export const youtubeService = {
  /**
   * Extract the 11-character video ID from a YouTube link or a bare ID:
   * youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/, m.youtube.com, music.youtube.com
   */
  extractVideoId(input: string): string | null {
    if (!input) return null;
    const clean = input.trim();
    if (ID_PATTERN.test(clean)) return clean;
    const match = clean.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  },

  async searchVideos(query: string): Promise<YouTubeSearchResult[]> {
    const q = query.trim();
    if (!q) return [];
    try {
      const yt = await getClient();
      const results = await yt.search(q, { type: 'video' });
      return results.videos
        .filter((node): node is YT.Search['videos'][number] & { type: 'Video' } => node.type === 'Video')
        .map((node) => {
          const v = node as any;
          return {
            youtubeId: v.video_id ?? v.id,
            title: textOf(v.title) || 'Untitled video',
            thumbnail: v.thumbnails?.[0]?.url ?? '',
            channelTitle: v.author?.name ?? '',
            channelVerified: !!(v.author?.is_verified || v.author?.is_verified_artist),
            durationSeconds: v.duration?.seconds ?? 0,
            views: parseCount(textOf(v.view_count)),
            uploadedDate: textOf(v.published),
          };
        })
        .filter((item) => ID_PATTERN.test(item.youtubeId));
    } catch (err) {
      throw new Error(describeError(err));
    }
  },

  /**
   * Full metadata plus the formats that can be saved as a single playable file.
   * YouTube only serves combined audio+video files at low resolutions (usually 360p);
   * higher resolutions are video-only and would need merging with a separate audio track.
   */
  async getVideoInfo(youtubeId: string): Promise<YouTubeVideoInfo> {
    let yt: Innertube;
    try {
      yt = await getClient();
    } catch (err) {
      throw new Error(describeError(err));
    }

    // Likes, upload date, subscribers, chapters and the full description come from the web watch page.
    // Best-effort: the download still works if this part fails.
    let full: YT.VideoInfo | null = null;
    try {
      full = await yt.getInfo(youtubeId);
    } catch {
      full = null;
    }

    let lastProblem = 'No downloadable format was offered for this video.';
    for (const client of STREAM_CLIENTS) {
      let basic: YT.VideoInfo;
      try {
        basic = await yt.getBasicInfo(youtubeId, { client });
      } catch (err) {
        lastProblem = describeError(err);
        continue;
      }
      const playability = basic.playability_status;
      if (playability?.status !== 'OK') {
        lastProblem = describeError(playability?.reason || `Video is ${playability?.status?.toLowerCase()}`);
        continue;
      }
      const formats = await collectFormats(basic, yt, client);
      if (formats.length === 0) continue;

      const b = basic.basic_info;
      const owner = full?.secondary_info?.owner;
      const markers = (full?.player_overlays as any)?.decorated_player_bar?.player_bar?.markers_map ?? [];
      const rawChapters: any[] = markers.find((m: any) => m?.value?.chapters)?.value?.chapters ?? [];

      return {
        youtubeId,
        title: b.title || youtubeId,
        description: textOf(full?.secondary_info?.description) || b.short_description || '',
        thumbnail: b.thumbnail?.[0]?.url ?? '',
        channelTitle: b.author || owner?.author?.name || '',
        channelAvatar: owner?.author?.thumbnails?.[0]?.url ?? '',
        channelVerified: !!(owner?.author?.is_verified || owner?.author?.is_verified_artist),
        channelSubscribers: parseCount(textOf(owner?.subscriber_count)),
        views: b.view_count ?? null,
        likes: full?.basic_info.like_count ?? null,
        // YouTube no longer publishes dislike counts
        dislikes: null,
        uploadDate: textOf(full?.primary_info?.published),
        durationSeconds: b.duration ?? 0,
        category: full?.basic_info.category ?? b.category ?? '',
        tags: b.keywords ?? full?.basic_info.keywords ?? [],
        chapters: rawChapters.map((c) => {
          const start = Math.floor((c.time_range_start_millis ?? 0) / 1000);
          return { title: textOf(c.title), timestamp: start, timeFormatted: formatClock(start) };
        }),
        formats,
      };
    }
    throw new Error(lastProblem);
  },

  /** SponsorBlock segments, saved with the download so skipping works offline. */
  async getSponsorSegments(youtubeId: string): Promise<SponsorSegment[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const categories = encodeURIComponent('["sponsor","intro","outro","selfpromo"]');
      const res = await fetch(
        `https://sponsor.ajay.app/api/skipSegments?videoID=${youtubeId}&categories=${categories}`,
        { signal: controller.signal }
      );
      // 404 means no segments for this video.
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((seg: any) => ({
        start: Math.floor(seg.segment[0]),
        end: Math.ceil(seg.segment[1]),
      }));
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  },
};
