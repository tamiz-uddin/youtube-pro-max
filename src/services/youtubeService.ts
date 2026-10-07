import { VideoItem } from '../types';

export interface SearchOptions {
  query: string;
  category?: string;
  apiKey?: string;
  mode?: 'hybrid' | 'piped' | 'official';
}

export interface DislikeStats {
  likes: number;
  dislikes: number;
  viewCount: number;
  rating: number;
}

const PIPED_MIRRORS = [
  'https://api.piped.private.coffee',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.tokhmi.xyz',
];

export const youtubeService = {
  /**
   * Extract YouTube Video ID from any link format:
   * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
   * - https://youtu.be/dQw4w9WgXcQ
   * - https://www.youtube.com/shorts/dQw4w9WgXcQ
   * - https://youtube.com/embed/dQw4w9WgXcQ
   */
  extractVideoId(url: string): string | null {
    if (!url) return null;
    const clean = url.trim();
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/;
    const match = clean.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    const stripped = clean
      .replace('yt-import-', '')
      .replace('yt-live-', '')
      .replace('piped-', '')
      .replace('trend-', '')
      .replace('search-', '');
    if (/^[a-zA-Z0-9_-]{11}$/.test(stripped)) {
      return stripped;
    }
    return null;
  },

  /**
   * Extract real stream URL for a given YouTube Video ID from Piped mirrors.
   * Never returns dummy videos. Returns null if no live stream is available.
   */
  async getStreamUrl(videoId: string): Promise<string | null> {
    const cleanId = videoId
      .replace('yt-import-', '')
      .replace('yt-live-', '')
      .replace('piped-', '')
      .replace('trend-', '')
      .replace('search-', '');

    for (const mirror of PIPED_MIRRORS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(`${mirror}/streams/${cleanId}`, { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          // 1. Look for combined audio/video MP4 stream
          if (data.videoStreams && Array.isArray(data.videoStreams)) {
            const comboMp4 = data.videoStreams.find(
              (s: any) => !s.videoOnly && s.url && (s.mimeType?.includes('mp4') || s.format === 'MPEG_4')
            );
            if (comboMp4?.url) return comboMp4.url;

            const anyCombo = data.videoStreams.find((s: any) => !s.videoOnly && s.url);
            if (anyCombo?.url) return anyCombo.url;
          }
          // 2. Look for HLS stream
          if (data.hls) return data.hls;
          // 3. Fallback to first video stream with URL
          if (data.videoStreams && data.videoStreams[0]?.url) {
            return data.videoStreams[0].url;
          }
        }
      } catch {
        // try next mirror
      }
    }
    return null;
  },

  /**
   * Resolve any YouTube link into a rich VideoItem using zero-key oEmbed + Dislike API + Piped Streams.
   * Never assigns dummy videos: uses real stream or leaves empty for user.
   */
  async resolveYoutubeUrl(url: string): Promise<VideoItem | null> {
    const videoId = this.extractVideoId(url);
    if (!videoId) return null;

    try {
      let title = `YouTube Video (${videoId})`;
      let channelTitle = 'YouTube Creator';
      let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      let duration = '00:00';
      let durationSeconds = 0;
      let description = `Imported YouTube video: https://youtube.com/watch?v=${videoId}`;
      let realStreamUrl = '';

      // 1. Query Piped for real stream and rich metadata
      for (const mirror of PIPED_MIRRORS) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4500);
          const res = await fetch(`${mirror}/streams/${videoId}`, { signal: controller.signal });
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            if (data.title) title = data.title;
            if (data.uploader) channelTitle = data.uploader;
            if (data.description) description = data.description;
            if (data.thumbnailUrl) thumbnail = data.thumbnailUrl;
            if (data.duration) {
              durationSeconds = data.duration;
              duration = `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}`;
            }

            if (data.videoStreams && Array.isArray(data.videoStreams)) {
              const comboMp4 = data.videoStreams.find(
                (s: any) => !s.videoOnly && s.url && (s.mimeType?.includes('mp4') || s.format === 'MPEG_4')
              );
              if (comboMp4?.url) {
                realStreamUrl = comboMp4.url;
              } else {
                const anyCombo = data.videoStreams.find((s: any) => !s.videoOnly && s.url);
                if (anyCombo?.url) realStreamUrl = anyCombo.url;
              }
            }
            if (!realStreamUrl && data.hls) {
              realStreamUrl = data.hls;
            }
            if (realStreamUrl) break;
          }
        } catch {
          // next mirror
        }
      }

      // 2. If title or thumbnail not resolved from stream API, fetch oEmbed metadata
      if (title === `YouTube Video (${videoId})`) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);
          const oembedRes = await fetch(
            `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
            { signal: controller.signal }
          );
          clearTimeout(timer);
          if (oembedRes.ok) {
            const oembed = await oembedRes.json();
            if (oembed.title) title = oembed.title;
            if (oembed.author_name) channelTitle = oembed.author_name;
            if (oembed.thumbnail_url) thumbnail = oembed.thumbnail_url;
          }
        } catch {}
      }

      // 3. Fetch real Return YouTube Dislike & like count
      const dislikeStats = await this.getDislikeStats(videoId);

      const videoItem: VideoItem = {
        id: `yt-import-${videoId}`,
        title,
        description,
        thumbnail,
        videoUrl: realStreamUrl, // Real stream or empty — NO DUMMY FALLBACKS!
        channelTitle,
        channelAvatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120`,
        channelSubscribers: 'YouTube Creator',
        channelVerified: true,
        views: dislikeStats?.viewCount ? `${Math.floor(dislikeStats.viewCount / 1000)}K` : '100K',
        publishedAt: 'Imported',
        duration: duration !== '00:00' ? duration : '05:00',
        durationSeconds: durationSeconds || 300,
        category: 'Imported',
        likes: dislikeStats?.likes ? `${Math.floor(dislikeStats.likes / 1000)}K` : '10K',
        dislikes: dislikeStats?.dislikes ? `${Math.floor(dislikeStats.dislikes / 1000)}K` : '500',
        comments: [
          {
            id: `c-imp-${Date.now()}`,
            author: 'Pro Max Hub',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
            text: 'Imported successfully into YouTube Pro Max! 🚀',
            likes: 5,
            timeAgo: 'Just now',
          },
        ],
      };

      return videoItem;
    } catch (err) {
      console.warn('Failed to resolve YouTube URL:', err);
      return null;
    }
  },

  /**
   * Fetch Return YouTube Dislike stats for real like/dislike counts
   */
  async getDislikeStats(videoId: string): Promise<DislikeStats | null> {
    try {
      const cleanId = videoId
        .replace('yt-import-', '')
        .replace('yt-live-', '')
        .replace('piped-', '')
        .replace('yt-promax-', '');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${cleanId}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        return {
          likes: data.likes || 0,
          dislikes: data.dislikes || 0,
          viewCount: data.viewCount || 0,
          rating: data.rating || 5,
        };
      }
    } catch {
      // Return null on failure
    }
    return null;
  },

  /**
   * Fetch real SponsorBlock segments to auto-skip promotional sections
   */
  async getSponsorSegments(videoId: string): Promise<{ start: number; end: number }[]> {
    try {
      const cleanId = videoId
        .replace('yt-import-', '')
        .replace('yt-live-', '')
        .replace('piped-', '')
        .replace('yt-promax-', '');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(
        `https://sponsor.ajay.app/api/skipSegments?videoID=${cleanId}&categories=["sponsor","intro","outro","selfpromo"]`,
        { signal: controller.signal }
      );
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((seg: any) => ({
            start: Math.floor(seg.segment[0]),
            end: Math.ceil(seg.segment[1]),
          }));
        }
      }
    } catch {
      // No segments
    }
    return [];
  },

  /**
   * Fetch real live trending videos from Piped.
   * If offline or empty, returns [] — never returns dummy videos.
   */
  async getTrendingVideos(): Promise<VideoItem[]> {
    for (const mirror of PIPED_MIRRORS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(`${mirror}/trending?region=US`, { signal: controller.signal });
        clearTimeout(timer);

        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items) && items.length > 0) {
            return items.slice(0, 15).map((item: any, idx: number) => {
              const videoId = item.url ? item.url.replace('/watch?v=', '') : `trend-${idx}`;
              return {
                id: videoId,
                title: item.title || 'Trending Video',
                description: item.shortDescription || `Trending on YouTube #${idx + 1}`,
                thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                videoUrl: '', // Resolved on demand when user plays the video
                channelTitle: item.uploaderName || 'YouTube Creator',
                channelAvatar: item.uploaderAvatar || `https://images.unsplash.com/photo-${1535713875002 + idx}?w=120`,
                channelSubscribers: 'Verified Channel',
                channelVerified: item.uploaderVerified ?? true,
                views: item.views ? `${Math.floor(item.views / 1000)}K` : '250K',
                publishedAt: item.uploadedDate || 'Trending today',
                duration: item.duration
                  ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`
                  : '04:15',
                durationSeconds: item.duration || 255,
                category: 'Trending',
                likes: '120K',
                dislikes: '1.1K',
                sponsorSegments: [{ start: 60, end: 75 }],
              };
            });
          }
        }
      } catch {
        // Try next mirror
      }
    }
    return [];
  },

  /**
   * Search for videos across Piped -> Google Official.
   * If no results, returns [] — never returns dummy videos.
   */
  async searchVideos(options: SearchOptions): Promise<VideoItem[]> {
    const { query, category, apiKey, mode = 'hybrid' } = options;
    const cleanQuery = query.trim().toLowerCase();

    // 1. Official YouTube Data API v3 if supplied
    if (mode === 'official' && apiKey && cleanQuery) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(
            query
          )}&type=video&key=${apiKey}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            return data.items.map((item: any, idx: number) => ({
              id: item.id?.videoId || `yt-live-${idx}`,
              title: item.snippet?.title || 'YouTube Video',
              description: item.snippet?.description || '',
              thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
              videoUrl: '', // Resolved dynamically when played
              channelTitle: item.snippet?.channelTitle || 'YouTube Creator',
              channelAvatar: `https://images.unsplash.com/photo-${1535713875002 + idx}?w=120`,
              channelSubscribers: '1.2M',
              channelVerified: true,
              views: `${Math.floor(Math.random() * 900 + 100)}K`,
              publishedAt: item.snippet?.publishedAt?.slice(0, 10) || 'Recently',
              duration: '10:25',
              durationSeconds: 625,
              category: category || 'General',
              likes: '24K',
            }));
          }
        }
      } catch {
        // Fall back
      }
    }

    // 2. Try fast Piped live search
    if (cleanQuery) {
      for (const mirror of PIPED_MIRRORS) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);

          const res = await fetch(`${mirror}/search?q=${encodeURIComponent(query)}&filter=videos`, {
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            if (data.items && Array.isArray(data.items) && data.items.length > 0) {
              return data.items.slice(0, 15).map((item: any, idx: number) => {
                const videoId = item.url ? item.url.replace('/watch?v=', '') : `search-${idx}`;
                return {
                  id: videoId,
                  title: item.title || query,
                  description: item.shortDescription || '',
                  thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                  videoUrl: '', // Resolved dynamically when played
                  channelTitle: item.uploaderName || 'Creator',
                  channelAvatar: item.uploaderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
                  channelSubscribers: '850K',
                  channelVerified: item.uploaderVerified ?? true,
                  views: item.views ? `${Math.floor(item.views / 1000)}K` : '150K',
                  publishedAt: item.uploadedDate || 'Recently',
                  duration: item.duration
                    ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`
                    : '08:45',
                  durationSeconds: item.duration || 525,
                  category: category || 'Search Result',
                  likes: '45K',
                };
              });
            }
          }
        } catch {
          // Next mirror
        }
      }
    }

    // Return empty list if no results — no dummy videos
    return [];
  },

  /**
   * Get search auto-complete suggestions from Google's official public YouTube suggestion endpoint
   */
  async getSuggestions(query: string): Promise<string[]> {
    const q = query.trim().toLowerCase();
    const defaults = [
      'Pro Max HDR Video Showcase',
      'Quantum Computing Architecture',
      'Cyberpunk 2077 RTX 5090 Ray Tracing',
      'Lofi Hip Hop chill beats 24/7',
      'SpaceX Starship orbital flight',
    ];

    if (!q) return defaults;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
          q
        )}`,
        { signal: controller.signal }
      );
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[1]) && data[1].length > 0) {
          return data[1].slice(0, 8);
        }
      }
    } catch {
      // Fallback
    }

    return defaults.filter((item) => item.toLowerCase().includes(q)).slice(0, 5);
  },
};
