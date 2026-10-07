import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  VideoItem,
  ShortItem,
  OfflineDownload,
  TimestampNote,
  Playlist,
  VideoFilterSettings,
  AppTheme,
  StudioAnalytics,
  QualityOption,
} from '../types';
import { themes, ThemeColors } from '../theme/colors';
import { MOCK_SHORTS } from '../data/mockShorts';
import { storageService } from '../services/storageService';
import { youtubeService } from '../services/youtubeService';

export type PlayerMode = 'closed' | 'minimized' | 'full';

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

  // Active Screen / Navigation
  activeTab: 'home' | 'shorts' | 'studio' | 'library' | 'settings';
  setActiveTab: (tab: 'home' | 'shorts' | 'studio' | 'library' | 'settings') => void;

  // Search & Discovery
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;

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

  // Permanent Offline Downloads (NEVER Auto-Delete Guarantee)
  downloads: OfflineDownload[];
  startDownload: (video: VideoItem, quality: QualityOption) => Promise<void>;
  removeDownload: (id: string) => Promise<void>;
  isDownloaded: (videoId: string) => boolean;

  // Timestamped Notes
  notes: TimestampNote[];
  addTimestampNote: (noteText: string, timestamp?: number) => Promise<void>;
  removeTimestampNote: (id: string) => Promise<void>;

  // Library & Social
  likedVideoIds: string[];
  toggleLike: (videoId: string) => Promise<void>;
  isLiked: (videoId: string) => boolean;
  watchHistory: { videoId: string; watchedAt: string; progressPercent: number }[];
  clearHistory: () => Promise<void>;
  playlists: Playlist[];
  createPlaylist: (name: string, firstVideo?: VideoItem) => Promise<void>;

  // Shorts State
  shorts: ShortItem[];
  currentShortIndex: number;
  setCurrentShortIndex: (index: number) => void;

  // Creator Studio & Imports
  studioAnalytics: StudioAnalytics;
  userUploadedVideos: VideoItem[];
  uploadNewVideo: (video: Omit<VideoItem, 'id' | 'views' | 'likes'>) => Promise<void>;
  importYoutubeVideo: (video: VideoItem) => Promise<void>;
  deleteUserVideo: (videoId: string) => Promise<void>;

  // API Config
  apiSettings: { mode: 'hybrid' | 'piped' | 'official'; apiKey?: string };
  updateApiSettings: (settings: { mode: 'hybrid' | 'piped' | 'official'; apiKey?: string }) => Promise<void>;

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

const initialAnalytics: StudioAnalytics = {
  views28d: 184520,
  viewsGrowth: 28.4,
  watchTimeHours: 6420,
  subscribers: 24800,
  subscribersGrowth: 14.2,
  estimatedRevenue: 1480.5,
  ctrPercent: 8.9,
  viewsHistory: [
    { day: 'Mon', views: 4200 },
    { day: 'Tue', views: 6100 },
    { day: 'Wed', views: 5800 },
    { day: 'Thu', views: 8900 },
    { day: 'Fri', views: 9400 },
    { day: 'Sat', views: 14200 },
    { day: 'Sun', views: 12100 },
  ],
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('oled-black');
  const [activeTab, setActiveTab] = useState<'home' | 'shorts' | 'studio' | 'library' | 'settings'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
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

  // Offline Downloads & Notes
  const [downloads, setDownloads] = useState<OfflineDownload[]>([]);
  const [notes, setNotes] = useState<TimestampNote[]>([]);
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<{ videoId: string; watchedAt: string; progressPercent: number }[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [shorts] = useState<ShortItem[]>(MOCK_SHORTS);
  const [currentShortIndex, setCurrentShortIndex] = useState(0);

  // Studio & User Uploads
  const [studioAnalytics] = useState<StudioAnalytics>(initialAnalytics);
  const [userUploadedVideos, setUserUploadedVideos] = useState<VideoItem[]>([]);
  const [apiSettings, setApiSettingsState] = useState<{ mode: 'hybrid' | 'piped' | 'official'; apiKey?: string }>({
    mode: 'hybrid',
  });

  // Load persistent storage on startup
  useEffect(() => {
    async function loadSavedData() {
      const [
        savedTheme,
        savedDownloads,
        savedNotes,
        savedLikes,
        savedHistory,
        savedPlaylists,
        savedApi,
        savedUserVideos,
      ] = await Promise.all([
        storageService.getSavedTheme(),
        storageService.getPermanentDownloads(),
        storageService.getTimestampNotes(),
        storageService.getLikedVideoIds(),
        storageService.getWatchHistory(),
        storageService.getPlaylists(),
        storageService.getApiSettings(),
        storageService.getUserVideos(),
      ]);

      setThemeState(savedTheme);
      setDownloads(savedDownloads);
      setNotes(savedNotes);
      setLikedVideoIds(savedLikes);
      setWatchHistory(savedHistory);
      setPlaylists(savedPlaylists);
      setApiSettingsState(savedApi);
      if (savedUserVideos && savedUserVideos.length > 0) {
        setUserUploadedVideos(savedUserVideos);
      }
    }
    loadSavedData();
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
  }, [currentTime, abLoop]);

  // Theme changer
  const setTheme = async (newTheme: AppTheme) => {
    setThemeState(newTheme);
    await storageService.saveTheme(newTheme);
  };

  const updateApiSettings = async (settings: { mode: 'hybrid' | 'piped' | 'official'; apiKey?: string }) => {
    setApiSettingsState(settings);
    await storageService.saveApiSettings(settings);
  };

  const handleSetPlayerMode = (mode: PlayerMode) => {
    setPlayerMode(mode);
    if (mode === 'closed') {
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentVideo(null);
    }
  };

  const playVideo = (video: VideoItem, startAt?: number) => {
    setCurrentVideo({ ...video });
    setPlayerMode('full');
    setIsPlaying(true);
    setCurrentTime(startAt ?? 0);
    storageService.recordWatchHistory(video.id, startAt ?? 0);

    // If video has no videoUrl yet, fetch real stream dynamically
    if (!video.videoUrl && video.id) {
      youtubeService.getStreamUrl(video.id).then((resolvedUrl) => {
        if (resolvedUrl) {
          setCurrentVideo((prev) =>
            prev && prev.id === video.id ? { ...prev, videoUrl: resolvedUrl } : prev
          );
        }
      });
    }
  };

  const pauseVideo = () => setIsPlaying(false);
  const resumeVideo = () => setIsPlaying(true);

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration || 9999));
    setCurrentTime(clamped);
  };

  const setSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
  };

  const triggerFrameStep = (forward: boolean) => {
    // 1 frame at 25fps = 0.04 seconds
    const delta = forward ? 0.04 : -0.04;
    seekTo(currentTime + delta);
  };

  const updateVideoProgress = (current: number, total: number) => {
    setCurrentTime(current);
    if (total > 0) setDuration(total);

    // Auto-Sponsor Skip check
    if (currentVideo?.sponsorSegments) {
      for (const segment of currentVideo.sponsorSegments) {
        if (current >= segment.start && current < segment.end) {
          seekTo(segment.end);
          setSponsorSkipToast('⚡ SponsorBlock: Skipped promotional sponsor segment');
          setTimeout(() => setSponsorSkipToast(null), 3000);
          break;
        }
      }
    }
  };

  // === PERMANENT DOWNLOADS (NEVER AUTO-DELETE GUARANTEE) ===
  const startDownload = async (video: VideoItem, quality: QualityOption) => {
    const sizeMap: Record<QualityOption, number> = {
      '1080p': 142.5,
      '720p': 78.2,
      '480p': 34.6,
      audio_only: 12.8,
    };

    const newDownload: OfflineDownload = {
      id: `download-${Date.now()}`,
      videoId: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      videoUrl: video.videoUrl,
      quality,
      fileSizeMb: sizeMap[quality],
      downloadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isPermanent: true, // Permanent: NEVER expires or auto-deletes!
      channelTitle: video.channelTitle,
      duration: video.duration,
    };

    const updated = await storageService.savePermanentDownload(newDownload);
    setDownloads(updated);
  };

  const removeDownload = async (id: string) => {
    const updated = await storageService.removePermanentDownload(id);
    setDownloads(updated);
  };

  const isDownloaded = (videoId: string) => {
    return downloads.some((item) => item.videoId === videoId);
  };

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
      thumbnail: firstVideo ? firstVideo.thumbnail : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
      createdAt: 'Just now',
    };
    const updated = await storageService.savePlaylist(newPlaylist);
    setPlaylists(updated);
  };

  // === CREATOR STUDIO UPLOAD & IMPORT ===
  const uploadNewVideo = async (videoData: Omit<VideoItem, 'id' | 'views' | 'likes'>) => {
    const newVideo: VideoItem = {
      ...videoData,
      id: `user-vid-${Date.now()}`,
      views: '1',
      likes: '1',
      publishedAt: 'Just now',
      durationSeconds: videoData.durationSeconds || 300,
    };
    const updated = await storageService.saveUserVideo(newVideo);
    setUserUploadedVideos(updated);
  };

  const importYoutubeVideo = async (video: VideoItem) => {
    const updated = await storageService.saveUserVideo(video);
    setUserUploadedVideos(updated);
    // Also save as download for offline availability
    try {
      await startDownload(video, '1080p');
    } catch {
      // Ignored if download fails
    }
  };

  const deleteUserVideo = async (videoId: string) => {
    const updated = await storageService.removeUserVideo(videoId);
    setUserUploadedVideos(updated);
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
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        isSearchModalOpen,
        setIsSearchModalOpen,
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
        downloads,
        startDownload,
        removeDownload,
        isDownloaded,
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
        shorts,
        currentShortIndex,
        setCurrentShortIndex,
        studioAnalytics,
        userUploadedVideos,
        uploadNewVideo,
        importYoutubeVideo,
        deleteUserVideo,
        apiSettings,
        updateApiSettings,
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
