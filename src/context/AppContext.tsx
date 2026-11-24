import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  VideoItem,
  TimestampNote,
  Playlist,
  VideoFilterSettings,
  AppTheme,
  DownloadedVideo,
  DeviceVideo,
} from '../types';
import { themes, ThemeColors } from '../theme/colors';
import { storageService } from '../services/storageService';
import { DownloadFormat, YouTubeVideoInfo, youtubeService } from '../services/youtubeService';
import { ActiveDownload, DownloadCancelledError, downloadService } from '../services/downloadService';
import { deviceMediaService } from '../services/deviceMediaService';
import { deviceToVideoItem, downloadedToVideoItem } from '../utils/videoFormat';

export type PlayerMode = 'closed' | 'minimized' | 'full';
export type AppTab = 'home' | 'download' | 'device' | 'library' | 'settings';

// Implemented by the mounted player, so seeks from anywhere
// (A-B loop, notes, SponsorBlock, frame step) move the real video.
export interface PlayerController {
  seekTo: (seconds: number) => void;
}

export interface DownloadJob {
  youtubeId: string;
  title: string;
  thumbnail: string;
  formatLabel: string;
  bytesWritten: number;
  totalBytes: number | null;
  status: 'downloading' | 'failed';
  error?: string;
}

interface ABLoopState {
  enabled: boolean;
  start: number;
  end: number;
}

interface AppContextType {
  // Theme & Styling
  theme: AppTheme;
  colors: ThemeColors;
  setTheme: (theme: AppTheme) => void;

  // Navigation
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  // Video Player Suite
  currentVideo: VideoItem | null;
  playerMode: PlayerMode;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  abLoop: ABLoopState | null;
  filterSettings: VideoFilterSettings;
  sleepTimerRemaining: number | null;
  sponsorSkipToast: string | null;

  // Player Actions
  playVideo: (video: VideoItem, startAt?: number) => void;
  playDownloadedVideo: (video: DownloadedVideo, startAt?: number) => boolean;
  playDeviceVideo: (video: DeviceVideo) => Promise<void>;
  pauseVideo: () => void;
  resumeVideo: () => void;
  setPlayerMode: (mode: PlayerMode) => void;
  seekTo: (seconds: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setABLoop: (loop: ABLoopState | null) => void;
  setFilterSettings: (settings: VideoFilterSettings) => void;
  setSleepTimer: (minutes: number | null) => void;
  triggerFrameStep: (forward: boolean) => void;
  updateVideoProgress: (current: number, total: number) => void;
  registerPlayerController: (controller: PlayerController | null) => void;

  // Downloads (files in app storage, metadata in AsyncStorage)
  downloadedVideos: DownloadedVideo[];
  downloadedVideoItems: VideoItem[];
  downloadJobs: DownloadJob[];
  startDownload: (info: YouTubeVideoInfo, format: DownloadFormat) => void;
  cancelDownload: (youtubeId: string) => void;
  dismissDownloadJob: (youtubeId: string) => void;
  deleteDownloadedVideo: (id: string) => Promise<void>;
  isYoutubeVideoDownloaded: (youtubeId: string) => boolean;

  // Timestamped Notes
  notes: TimestampNote[];
  addTimestampNote: (noteText: string, timestamp?: number) => Promise<void>;
  removeTimestampNote: (id: string) => Promise<void>;

  // Library
  likedVideoIds: string[];
  toggleLike: (videoId: string) => Promise<void>;
  isLiked: (videoId: string) => boolean;
  watchHistory: { videoId: string; watchedAt: string; progressPercent: number }[];
  clearHistory: () => Promise<void>;
  playlists: Playlist[];
  createPlaylist: (name: string, firstVideo?: VideoItem) => Promise<void>;

  // Device Frame Viewport (for desktop testing)
  isDeviceFrameActive: boolean;
  toggleDeviceFrame: () => void;
}

const defaultFilters: VideoFilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  invert: false,
  bassBoost: false,
  vocalEnhance: false,
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('oled-black');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isDeviceFrameActive, setIsDeviceFrameActive] = useState(false);

  // Player state
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('closed');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [abLoop, setABLoop] = useState<ABLoopState | null>(null);
  const [filterSettings, setFilterSettings] = useState<VideoFilterSettings>(defaultFilters);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [sponsorSkipToast, setSponsorSkipToast] = useState<string | null>(null);

  // Downloads, notes & library
  const [downloadedVideos, setDownloadedVideos] = useState<DownloadedVideo[]>([]);
  const [jobsById, setJobsById] = useState<Record<string, DownloadJob>>({});
  const [notes, setNotes] = useState<TimestampNote[]>([]);
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<{ videoId: string; watchedAt: string; progressPercent: number }[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Refs read by callbacks that native listeners and download tasks hold across renders.
  const controllerRef = useRef<PlayerController | null>(null);
  const currentVideoRef = useRef<VideoItem | null>(null);
  const durationRef = useRef(0);
  const lastSponsorSkipRef = useRef<{ end: number; at: number } | null>(null);
  const activeDownloadsRef = useRef<Record<string, ActiveDownload>>({});
  // Downloads between "requested" and "file transfer started" (SponsorBlock lookup runs first).
  const pendingDownloadsRef = useRef<Set<string>>(new Set());
  const downloadedVideosRef = useRef<DownloadedVideo[]>([]);
  currentVideoRef.current = currentVideo;
  durationRef.current = duration;
  downloadedVideosRef.current = downloadedVideos;

  // Load persistent storage on startup
  useEffect(() => {
    async function loadSavedData() {
      const [savedTheme, savedDownloads, savedNotes, savedLikes, savedHistory, savedPlaylists] =
        await Promise.all([
          storageService.getSavedTheme(),
          storageService.getDownloadedVideos(),
          storageService.getTimestampNotes(),
          storageService.getLikedVideoIds(),
          storageService.getWatchHistory(),
          storageService.getPlaylists(),
        ]);

      setThemeState(savedTheme);
      setNotes(savedNotes);
      setLikedVideoIds(savedLikes);
      setWatchHistory(savedHistory);
      setPlaylists(savedPlaylists);

      // Drop entries whose file no longer exists (e.g. app data restored without files).
      const present = savedDownloads.filter((v) => downloadService.fileExists(v));
      setDownloadedVideos(present);
      if (present.length !== savedDownloads.length) {
        storageService.saveDownloadedVideos(present).catch(() => {});
      }
    }
    loadSavedData();
  }, []);

  // Cancel in-flight downloads if the provider unmounts
  useEffect(() => {
    return () => {
      Object.values(activeDownloadsRef.current).forEach((d) => d.cancel());
    };
  }, []);

  // Sleep Timer countdown ticker
  useEffect(() => {
    if (sleepTimerRemaining === null || sleepTimerRemaining <= 0) return;
    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setIsPlaying(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerRemaining]);

  // A-B Looper check
  useEffect(() => {
    if (abLoop && abLoop.enabled && currentTime >= abLoop.end) {
      seekTo(abLoop.start);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, abLoop]);

  const setTheme = async (newTheme: AppTheme) => {
    setThemeState(newTheme);
    await storageService.saveTheme(newTheme);
  };

  // === PLAYER ===
  const handleSetPlayerMode = (mode: PlayerMode) => {
    setPlayerMode(mode);
    if (mode === 'closed') {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setCurrentVideo(null);
    }
  };

  const playVideo = (video: VideoItem, startAt?: number) => {
    setCurrentVideo({ ...video });
    setPlayerMode('full');
    setIsPlaying(true);
    setCurrentTime(startAt ?? 0);
    setDuration(0);
    lastSponsorSkipRef.current = null;
    storageService.recordWatchHistory(video.id, startAt ?? 0);
    setWatchHistory((prev) =>
      [
        { videoId: video.id, watchedAt: new Date().toISOString(), progressPercent: startAt ?? 0 },
        ...prev.filter((h) => h.videoId !== video.id),
      ].slice(0, 50)
    );
  };

  /** Returns false if the file is missing. */
  const playDownloadedVideo = (video: DownloadedVideo, startAt?: number) => {
    if (!downloadService.fileExists(video)) return false;
    playVideo(downloadedToVideoItem(video), startAt);
    return true;
  };

  const playDeviceVideo = async (video: DeviceVideo) => {
    const uri = await deviceMediaService.getPlayableUri(video.id);
    playVideo(deviceToVideoItem(video, uri));
  };

  const registerPlayerController = (controller: PlayerController | null) => {
    controllerRef.current = controller;
  };

  const pauseVideo = () => setIsPlaying(false);
  const resumeVideo = () => setIsPlaying(true);

  const seekTo = (seconds: number) => {
    const total = durationRef.current;
    const clamped = Math.max(0, total > 0 ? Math.min(seconds, total) : seconds);
    setCurrentTime(clamped);
    controllerRef.current?.seekTo(clamped);
  };

  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerRemaining(minutes === null ? null : minutes * 60);
  };

  const triggerFrameStep = (forward: boolean) => {
    // 1 frame at 25fps = 0.04 seconds
    seekTo(currentTime + (forward ? 0.04 : -0.04));
  };

  const updateVideoProgress = (current: number, total: number) => {
    setCurrentTime(current);
    if (total > 0) {
      setDuration(total);
      durationRef.current = total;
    }

    // SponsorBlock segments saved with the download
    const segments = currentVideoRef.current?.sponsorSegments;
    if (segments) {
      for (const segment of segments) {
        if (current >= segment.start && current < segment.end) {
          // Progress events can still report the old position while a seek is in flight.
          const last = lastSponsorSkipRef.current;
          if (last && last.end === segment.end && Date.now() - last.at < 2000) break;
          lastSponsorSkipRef.current = { end: segment.end, at: Date.now() };
          seekTo(segment.end);
          setSponsorSkipToast('SponsorBlock: skipped sponsor segment');
          setTimeout(() => setSponsorSkipToast(null), 3000);
          break;
        }
      }
    }
  };

  // === DOWNLOADS ===
  const persistDownloads = async (next: DownloadedVideo[]) => {
    downloadedVideosRef.current = next;
    setDownloadedVideos(next);
    await storageService.saveDownloadedVideos(next);
  };

  const updateJob = (youtubeId: string, patch: Partial<DownloadJob>) => {
    setJobsById((prev) => (prev[youtubeId] ? { ...prev, [youtubeId]: { ...prev[youtubeId], ...patch } } : prev));
  };

  const removeJob = (youtubeId: string) => {
    setJobsById((prev) => {
      const { [youtubeId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const startDownload = (info: YouTubeVideoInfo, format: DownloadFormat) => {
    const { youtubeId } = info;
    if (activeDownloadsRef.current[youtubeId] || pendingDownloadsRef.current.has(youtubeId)) return;
    pendingDownloadsRef.current.add(youtubeId);

    setJobsById((prev) => ({
      ...prev,
      [youtubeId]: {
        youtubeId,
        title: info.title,
        thumbnail: info.thumbnail,
        formatLabel: format.label,
        bytesWritten: 0,
        totalBytes: format.sizeBytes,
        status: 'downloading',
      },
    }));

    (async () => {
      const sponsorSegments = await youtubeService.getSponsorSegments(youtubeId);
      // Cancelled while the SponsorBlock lookup was running
      if (!pendingDownloadsRef.current.delete(youtubeId)) return;
      let lastUpdate = 0;
      try {
        const active = downloadService.start(info, format, sponsorSegments, ({ bytesWritten, totalBytes }) => {
          const now = Date.now();
          if (now - lastUpdate < 250) return;
          lastUpdate = now;
          updateJob(youtubeId, { bytesWritten, totalBytes });
        });
        activeDownloadsRef.current[youtubeId] = active;

        const saved = await active.promise;
        try {
          await persistDownloads([saved, ...downloadedVideosRef.current]);
        } catch (err) {
          // Don't leave an untracked file or a phantom list entry if the metadata could not be saved
          downloadService.deleteFiles(saved);
          downloadedVideosRef.current = downloadedVideosRef.current.filter((v) => v.id !== saved.id);
          setDownloadedVideos(downloadedVideosRef.current);
          throw err;
        }
        removeJob(youtubeId);
      } catch (err) {
        if (err instanceof DownloadCancelledError) {
          removeJob(youtubeId);
        } else {
          updateJob(youtubeId, {
            status: 'failed',
            error: err instanceof Error ? err.message : 'Download failed',
          });
        }
      } finally {
        delete activeDownloadsRef.current[youtubeId];
      }
    })();
  };

  const cancelDownload = (youtubeId: string) => {
    const active = activeDownloadsRef.current[youtubeId];
    if (active) {
      active.cancel();
    } else {
      pendingDownloadsRef.current.delete(youtubeId);
      removeJob(youtubeId);
    }
  };

  const dismissDownloadJob = (youtubeId: string) => removeJob(youtubeId);

  const deleteDownloadedVideo = async (id: string) => {
    const target = downloadedVideosRef.current.find((v) => v.id === id);
    if (!target) return;
    if (currentVideoRef.current?.id === id) handleSetPlayerMode('closed');
    downloadService.deleteFiles(target);
    await persistDownloads(downloadedVideosRef.current.filter((v) => v.id !== id));
  };

  const isYoutubeVideoDownloaded = (youtubeId: string) =>
    downloadedVideos.some((v) => v.youtubeId === youtubeId);

  const downloadedVideoItems = useMemo(() => downloadedVideos.map(downloadedToVideoItem), [downloadedVideos]);
  const downloadJobs = useMemo(() => Object.values(jobsById), [jobsById]);

  // === TIMESTAMPED NOTES ===
  const addTimestampNote = async (noteText: string, customTime?: number) => {
    if (!currentVideo) return;
    const targetSeconds = customTime !== undefined ? customTime : currentTime;
    const minutes = Math.floor(targetSeconds / 60);
    const secs = Math.floor(targetSeconds % 60);
    const formatted = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const newNote: TimestampNote = {
      id: `note-${Date.now()}`,
      videoId: currentVideo.id,
      videoTitle: currentVideo.title,
      timestamp: Math.round(targetSeconds),
      timeFormatted: formatted,
      noteText,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = await storageService.saveTimestampNote(newNote);
    setNotes(updated);
  };

  const removeTimestampNote = async (id: string) => {
    const updated = await storageService.deleteTimestampNote(id);
    setNotes(updated);
  };

  // === LIKES & HISTORY ===
  const toggleLike = async (videoId: string) => {
    const updated = await storageService.toggleLikeVideo(videoId);
    setLikedVideoIds(updated);
  };

  const isLiked = (videoId: string) => likedVideoIds.includes(videoId);

  const clearHistory = async () => {
    await storageService.clearWatchHistory();
    setWatchHistory([]);
  };

  const createPlaylist = async (name: string, firstVideo?: VideoItem) => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      videoCount: firstVideo ? 1 : 0,
      videoIds: firstVideo ? [firstVideo.id] : [],
      thumbnail: firstVideo ? firstVideo.thumbnail : '',
      createdAt: new Date().toISOString(),
    };
    const updated = await storageService.savePlaylist(newPlaylist);
    setPlaylists(updated);
  };

  const toggleDeviceFrame = () => setIsDeviceFrameActive((prev) => !prev);

  const colors = themes[theme];

  return (
    <AppContext.Provider
      value={{
        theme,
        colors,
        setTheme,
        activeTab,
        setActiveTab,
        currentVideo,
        playerMode,
        isPlaying,
        currentTime,
        duration,
        playbackSpeed,
        abLoop,
        filterSettings,
        sleepTimerRemaining,
        sponsorSkipToast,
        playVideo,
        playDownloadedVideo,
        playDeviceVideo,
        pauseVideo,
        resumeVideo,
        setPlayerMode: handleSetPlayerMode,
        seekTo,
        setPlaybackSpeed,
        setABLoop,
        setFilterSettings,
        setSleepTimer,
        triggerFrameStep,
        updateVideoProgress,
        registerPlayerController,
        downloadedVideos,
        downloadedVideoItems,
        downloadJobs,
        startDownload,
        cancelDownload,
        dismissDownloadJob,
        deleteDownloadedVideo,
        isYoutubeVideoDownloaded,
        notes,
        addTimestampNote,
        removeTimestampNote,
        likedVideoIds,
        toggleLike,
        isLiked,
        watchHistory,
        clearHistory,
        playlists,
        createPlaylist,
        isDeviceFrameActive,
        toggleDeviceFrame,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
