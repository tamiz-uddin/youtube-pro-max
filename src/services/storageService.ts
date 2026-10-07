import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineDownload, TimestampNote, Playlist, AppTheme, VideoItem } from '../types';

const STORAGE_KEYS = {
  PERMANENT_DOWNLOADS: '@yt_promax_permanent_downloads_v1',
  TIMESTAMP_NOTES: '@yt_promax_timestamp_notes_v1',
  WATCH_HISTORY: '@yt_promax_watch_history_v1',
  LIKED_VIDEOS: '@yt_promax_liked_videos_v1',
  PLAYLISTS: '@yt_promax_playlists_v1',
  THEME: '@yt_promax_theme_v1',
  API_SETTINGS: '@yt_promax_api_settings_v1',
  STUDIO_PROFILE: '@yt_promax_studio_profile_v1',
  USER_VIDEOS: '@yt_promax_user_videos_v1',
};

export const storageService = {
  // === PERMANENT DOWNLOADS (NEVER AUTO-DELETE) ===
  async getPermanentDownloads(): Promise<OfflineDownload[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PERMANENT_DOWNLOADS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async savePermanentDownload(download: OfflineDownload): Promise<OfflineDownload[]> {
    try {
      const current = await this.getPermanentDownloads();
      // Ensure no duplicates
      const updated = [download, ...current.filter((item) => item.videoId !== download.videoId)];
      await AsyncStorage.setItem(STORAGE_KEYS.PERMANENT_DOWNLOADS, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  async removePermanentDownload(downloadId: string): Promise<OfflineDownload[]> {
    try {
      const current = await this.getPermanentDownloads();
      const updated = current.filter((item) => item.id !== downloadId);
      await AsyncStorage.setItem(STORAGE_KEYS.PERMANENT_DOWNLOADS, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  // === TIMESTAMPED NOTES ===
  async getTimestampNotes(): Promise<TimestampNote[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TIMESTAMP_NOTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveTimestampNote(note: TimestampNote): Promise<TimestampNote[]> {
    try {
      const current = await this.getTimestampNotes();
      const updated = [note, ...current];
      await AsyncStorage.setItem(STORAGE_KEYS.TIMESTAMP_NOTES, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  async deleteTimestampNote(noteId: string): Promise<TimestampNote[]> {
    try {
      const current = await this.getTimestampNotes();
      const updated = current.filter((item) => item.id !== noteId);
      await AsyncStorage.setItem(STORAGE_KEYS.TIMESTAMP_NOTES, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  // === LIKES, HISTORY & PLAYLISTS ===
  async getLikedVideoIds(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LIKED_VIDEOS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async toggleLikeVideo(videoId: string): Promise<string[]> {
    try {
      const current = await this.getLikedVideoIds();
      const exists = current.includes(videoId);
      const updated = exists ? current.filter((id) => id !== videoId) : [videoId, ...current];
      await AsyncStorage.setItem(STORAGE_KEYS.LIKED_VIDEOS, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  async getWatchHistory(): Promise<{ videoId: string; watchedAt: string; progressPercent: number }[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async recordWatchHistory(videoId: string, progressPercent = 0) {
    try {
      const current = await this.getWatchHistory();
      const filtered = current.filter((item) => item.videoId !== videoId);
      const updated = [{ videoId, watchedAt: new Date().toISOString(), progressPercent }, ...filtered].slice(0, 50);
      await AsyncStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  async clearWatchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY);
    } catch {
      // ignore
    }
  },

  async getPlaylists(): Promise<Playlist[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async savePlaylist(playlist: Playlist): Promise<Playlist[]> {
    try {
      const current = await this.getPlaylists();
      const updated = [playlist, ...current.filter((p) => p.id !== playlist.id)];
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  // === APP THEME & PREFERENCES ===
  async getSavedTheme(): Promise<AppTheme> {
    try {
      const data = (await AsyncStorage.getItem(STORAGE_KEYS.THEME)) as AppTheme | null;
      return data || 'oled-black';
    } catch {
      return 'oled-black';
    }
  },

  async saveTheme(theme: AppTheme): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // ignore
    }
  },

  // === API SETTINGS ===
  async getApiSettings(): Promise<{ mode: 'hybrid' | 'piped' | 'official'; apiKey?: string }> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.API_SETTINGS);
      return data ? JSON.parse(data) : { mode: 'hybrid' };
    } catch {
      return { mode: 'hybrid' };
    }
  },

  async saveApiSettings(settings: { mode: 'hybrid' | 'piped' | 'official'; apiKey?: string }): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  },

  // === USER IMPORTED & UPLOADED VIDEOS ===
  async getUserVideos(): Promise<VideoItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_VIDEOS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveUserVideo(video: VideoItem): Promise<VideoItem[]> {
    try {
      const current = await this.getUserVideos();
      const updated = [video, ...current.filter((item) => item.id !== video.id)];
      await AsyncStorage.setItem(STORAGE_KEYS.USER_VIDEOS, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  async removeUserVideo(videoId: string): Promise<VideoItem[]> {
    try {
      const current = await this.getUserVideos();
      const updated = current.filter((item) => item.id !== videoId);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_VIDEOS, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },
};
