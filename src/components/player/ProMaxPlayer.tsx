import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  useWindowDimensions,
  Platform,
  Animated,
  TextInput,
  PanResponder,
  Share,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useApp } from '../../context/AppContext';
import { youtubeService } from '../../services/youtubeService';
import { VideoEnhancerModal } from './VideoEnhancerModal';
import { ABLoopModal } from './ABLoopModal';
import { SleepTimerModal } from './SleepTimerModal';
import { DownloadModal } from './DownloadModal';
import { NotesModal } from './NotesModal';
import { VideoAIAssistant } from '../ai/VideoAIAssistant';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProMaxPlayer: React.FC = () => {
  const {
    currentVideo,
    playerMode,
    setPlayerMode,
    isPlaying,
    pauseVideo,
    resumeVideo,
    currentTime,
    duration,
    seekTo: appSeekTo,
    playbackSpeed,
    setPlaybackSpeed,
    abLoop,
    filterSettings,
    sleepTimerRemaining,
    sponsorSkipToast,
    triggerFrameStep,
    updateVideoProgress,
    colors,
    toggleLike,
    isLiked,
    isDownloaded,
    playVideo,
    userUploadedVideos,
  } = useApp();

  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? RNStatusBar.currentHeight || 28 : 0
  );

  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showEnhancerModal, setShowEnhancerModal] = useState(false);
  const [showABLoopModal, setShowABLoopModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [snapshotToast, setSnapshotToast] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAmbientOn, setIsAmbientOn] = useState(true);
  const [isStretchFit, setIsStretchFit] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [localComments, setLocalComments] = useState<any[]>([]);

  // Dislike count from Return YouTube Dislike API
  const [dislikeCount, setDislikeCount] = useState<string>(currentVideo?.dislikes || '1.2K');
  const [isDisliked, setIsDisliked] = useState(false);
  const [hasSponsorBlock, setHasSponsorBlock] = useState(false);

  // Gesture Controls: Volume & Brightness & Double Tap Seek
  const [brightnessLevel, setBrightnessLevel] = useState(1.0); // 0.1 to 1.0
  const [volumeLevel, setVolumeLevel] = useState(1.0); // 0.0 to 1.0
  const [hudType, setHudType] = useState<'brightness' | 'volume' | null>(null);
  const [hudValue, setHudValue] = useState(100);
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);

  // Fullscreen & Orientation State
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [trackLayoutWidth, setTrackLayoutWidth] = useState(0);
  const videoViewRef = useRef<VideoView | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Extract clean 11-char YouTube ID if video is from YouTube
  const youtubeId = useMemo(() => {
    if (!currentVideo) return null;
    return (
      youtubeService.extractVideoId(currentVideo.id) ||
      youtubeService.extractVideoId(currentVideo.videoUrl) ||
      youtubeService.extractVideoId(currentVideo.description || '')
    );
  }, [currentVideo?.id, currentVideo?.videoUrl, currentVideo?.description]);
  const controlsTimeoutRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);
  const hudTimerRef = useRef<any>(null);
  const doubleTapTimerRef = useRef<any>(null);

  const glowAnim = useRef(new Animated.Value(0.7)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // Clean up orientation when closing player or unmounting
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (playerMode !== 'full' && isFullscreen) {
      setIsFullscreen(false);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
  }, [playerMode, isFullscreen]);

  const handleToggleFullscreen = async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    if (Platform.OS === 'web') {
      try {
        if (nextState) {
          if (videoRef.current?.requestFullscreen) {
            await videoRef.current.requestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          }
        }
      } catch (err) {
        console.warn('Web fullscreen error:', err);
      }
      return;
    }

    try {
      if (nextState) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        try {
          await videoViewRef.current?.enterFullscreen();
        } catch {
          // Native fullscreen dialog fallback: handled in-app
        }
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        try {
          await videoViewRef.current?.exitFullscreen();
        } catch {
          // Fallback
        }
      }
    } catch (err) {
      console.warn('ScreenOrientation error:', err);
    }
  };

  // Modern Expo Video player instance
  const player = useVideoPlayer(currentVideo?.videoUrl ?? null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
    if (isPlaying) p.play();
  });

  // Dynamically load new video source when currentVideo changes
  useEffect(() => {
    if (player && currentVideo?.videoUrl) {
      try {
        player.replace(currentVideo.videoUrl);
        player.currentTime = 0;
        if (isPlaying) {
          player.play();
        }
      } catch (err) {
        console.warn('Error updating player source:', err);
      }
    } else if (player && !currentVideo) {
      try {
        player.pause();
      } catch {}
    }
  }, [currentVideo?.id, currentVideo?.videoUrl, player]);

  // Sync player playing state
  useEffect(() => {
    if (!player) return;
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, player]);

  // Sync playback speed
  useEffect(() => {
    if (!player) return;
    player.playbackRate = playbackSpeed;
  }, [playbackSpeed, player]);

  // Sync volume
  useEffect(() => {
    if (!player) return;
    player.volume = volumeLevel;
    player.muted = volumeLevel === 0;
  }, [volumeLevel, player]);

  // Listen to time updates & track finish
  useEffect(() => {
    if (!player) return;
    const timeSub = player.addListener('timeUpdate', (event) => {
      updateVideoProgress(event.currentTime, player.duration || currentVideo?.durationSeconds || 0);
    });
    const endSub = player.addListener('playToEnd', () => {
      pauseVideo();
    });
    return () => {
      timeSub.remove();
      endSub.remove();
    };
  }, [player, currentVideo]);

  // Pulse ambient glow
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Sync comments & fetch real Return YouTube Dislike + SponsorBlock data
  useEffect(() => {
    if (currentVideo?.comments) {
      setLocalComments(currentVideo.comments);
    }
    if (currentVideo?.id) {
      youtubeService.getDislikeStats(currentVideo.id).then((stats) => {
        if (stats && stats.dislikes) {
          const formatted =
            stats.dislikes >= 1000
              ? `${(stats.dislikes / 1000).toFixed(1)}K`
              : `${stats.dislikes}`;
          setDislikeCount(formatted);
        }
      });

      youtubeService.getSponsorSegments(currentVideo.id).then((segments) => {
        if (segments && segments.length > 0) {
          setHasSponsorBlock(true);
          currentVideo.sponsorSegments = segments;
        }
      });
    }
  }, [currentVideo?.id]);

  // Sync HTML5 video on web for video source change
  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (currentVideo?.videoUrl) {
        videoRef.current.src = currentVideo.videoUrl;
        videoRef.current.currentTime = 0;
        if (isPlaying) {
          videoRef.current.play().catch(() => {});
        }
      } else {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    }
  }, [currentVideo?.id, currentVideo?.videoUrl]);

  // Sync HTML5 video on web for playback state & volume
  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.volume = volumeLevel;
    }
  }, [isPlaying, playbackSpeed, volumeLevel]);

  // Wrap seekTo to update both native & web
  const seekTo = (seconds: number) => {
    appSeekTo(seconds);
    if (player) {
      player.currentTime = seconds;
    }
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  };

  const showGestureHud = (type: 'brightness' | 'volume', val: number) => {
    setHudType(type);
    setHudValue(Math.round(val * 100));
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setHudType(null);
    }, 1200);
  };

  const triggerDoubleTapSeek = (forward: boolean) => {
    const side = forward ? 'right' : 'left';
    setDoubleTapSide(side);
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();

    if (forward) {
      seekTo(Math.min(duration || 9999, currentTime + 10));
    } else {
      seekTo(Math.max(0, currentTime - 10));
    }

    if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
    doubleTapTimerRef.current = setTimeout(() => {
      setDoubleTapSide(null);
    }, 600);
  };

  // Touch & Swipe gesture responder
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
        onPanResponderGrant: (evt) => {
          const now = Date.now();
          const { locationX } = evt.nativeEvent;
          const isLeft = locationX < screenWidth * 0.42;
          const isRight = locationX > screenWidth * 0.58;

          if (now - lastTapRef.current < 320) {
            if (isLeft) {
              triggerDoubleTapSeek(false);
            } else if (isRight) {
              triggerDoubleTapSeek(true);
            }
          } else {
            resetControlsTimer();
          }
          lastTapRef.current = now;
        },
        onPanResponderMove: (evt, gesture) => {
          const { locationX } = evt.nativeEvent;
          const delta = -gesture.dy / 250;

          if (locationX < screenWidth * 0.5) {
            // Brightness Control
            const nextB = Math.max(0.15, Math.min(1.0, brightnessLevel + delta));
            setBrightnessLevel(nextB);
            showGestureHud('brightness', nextB);
          } else {
            // Volume Control
            const nextV = Math.max(0, Math.min(1.0, volumeLevel + delta));
            setVolumeLevel(nextV);
            showGestureHud('volume', nextV);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -60 && Math.abs(gesture.dx) < 80) {
            // Swiped UP -> Enter Fullscreen
            if (!isFullscreen) {
              handleToggleFullscreen();
            }
          } else if (gesture.dy > 60 && Math.abs(gesture.dx) < 80) {
            // Swiped DOWN
            if (isFullscreen) {
              handleToggleFullscreen();
            } else {
              setPlayerMode('minimized');
            }
          }
        },
      }),
    [brightnessLevel, volumeLevel, currentTime, duration, isFullscreen, screenWidth]
  );

  const resetControlsTimer = () => {
    setShowControls((prev) => !prev);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 4500);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSnapshot = () => {
    setSnapshotToast(true);
    setTimeout(() => setSnapshotToast(false), 2200);
  };

  const handleShare = async () => {
    try {
      if (currentVideo) {
        await Share.share({
          message: `Watch "${currentVideo.title}" in 4K HDR on YouTube Pro Max! https://youtube.com/watch?v=${currentVideo.id}`,
        });
      }
    } catch {
      // Ignored
    }
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComm = {
      id: `c-user-${Date.now()}`,
      author: 'You (Pro Max VIP)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      text: newCommentText.trim(),
      likes: 1,
      timeAgo: 'Just now',
    };
    setLocalComments([newComm, ...localComments]);
    setNewCommentText('');
  };

  if (!currentVideo || playerMode === 'closed') {
    return null;
  }

  const speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const videoFilterStyle =
    Platform.OS === 'web'
      ? {
        filter: `brightness(${filterSettings.brightness}%) contrast(${filterSettings.contrast}%) saturate(${filterSettings.saturation}%) sepia(${filterSettings.sepia}%) ${filterSettings.invert ? 'invert(100%)' : ''
          }`,
      }
      : {};

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          display: playerMode === 'full' ? 'flex' : 'none',
        },
      ]}
    >
      {/* Dynamic Ambient Cinema Lighting Aura (hidden in fullscreen) */}
      {!isFullscreen && isAmbientOn && (
        <Animated.View
          style={[
            styles.ambientGlowContainer,
            {
              top: 40 + topInset,
              opacity: glowAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.accentGlow, 'rgba(255, 0, 51, 0.1)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.ambientGradient}
          />
        </Animated.View>
      )}

      {/* Top Header Bar inside Player (portrait only) */}
      {!isFullscreen && (
        <View style={[styles.topHeader, { paddingTop: topInset, height: 48 + topInset }]}>
          <View style={styles.headerLeftBtns}>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.surface }]}
              onPress={() => setPlayerMode('minimized')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-down" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.surface }]}
              onPress={() => setPlayerMode('closed')}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Ambient Cinema Tag Toggle */}
          <TouchableOpacity
            style={[
              styles.ambientTag,
              {
                backgroundColor: isAmbientOn ? 'rgba(255, 0, 51, 0.15)' : colors.surfaceSubtle,
                borderColor: isAmbientOn ? colors.accent : 'transparent',
                borderWidth: 1,
              },
            ]}
            onPress={() => setIsAmbientOn(!isAmbientOn)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.activeDot,
                { backgroundColor: isAmbientOn ? colors.accent : colors.textMuted },
              ]}
            />
            <Text
              style={[
                styles.ambientTagText,
                { color: isAmbientOn ? colors.accent : colors.textSecondary },
              ]}
            >
              Ambient Mode {isAmbientOn ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>

          <View style={styles.topHeaderRight}>
            {/* Fullscreen Button */}
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.surface }]}
              onPress={handleToggleFullscreen}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="fullscreen" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            {/* 21:9 Stretch Fit Toggle */}
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.surface }]}
              onPress={() => setIsStretchFit(!isStretchFit)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isStretchFit ? 'arrow-collapse' : 'arrow-expand'}
                size={18}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.surface }]}
              onPress={() => setShowAIModal(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="robot" size={18} color={colors.secondaryAccent} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.surface }]}
              onPress={() => setShowEnhancerModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="color-wand-outline" size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Video Viewport Container with PanResponder */}
      <View
        style={[styles.viewport, isFullscreen && styles.viewportFullscreen]}
        {...(!youtubeId ? panResponder.panHandlers : {})}
      >
        {youtubeId ? (
          Platform.OS === 'web' ? (
            <iframe
              key={youtubeId}
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&enablejsapi=1&origin=https://www.youtube.com&rel=0`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#000000',
              }}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <WebView
              key={youtubeId}
              style={styles.nativeVideo}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo={true}
              originWhitelist={['*']}
              mixedContentMode="always"
              userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              source={{
                uri: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&enablejsapi=1&rel=0`,
                headers: {
                  Referer: 'https://www.youtube.com',
                },
              }}
            />
          )
        ) : currentVideo.videoUrl ? (
          Platform.OS === 'web' ? (
            <video
              key={currentVideo.id}
              ref={videoRef as any}
              src={currentVideo.videoUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: isStretchFit ? 'cover' : 'contain',
                backgroundColor: '#000000',
                ...videoFilterStyle,
              }}
              playsInline
              onTimeUpdate={(e: any) => {
                const cur = e.target.currentTime;
                const dur = e.target.duration || currentVideo.durationSeconds;
                updateVideoProgress(cur, dur);
              }}
              onEnded={() => pauseVideo()}
            />
          ) : (
            <VideoView
              key={currentVideo.id}
              ref={videoViewRef}
              player={player}
              style={styles.nativeVideo}
              contentFit={isStretchFit ? 'cover' : 'contain'}
              nativeControls={false}
              fullscreenOptions={{
                enable: true,
                orientation: 'landscape',
              }}
              onFullscreenEnter={() => setIsFullscreen(true)}
              onFullscreenExit={() => {
                setIsFullscreen(false);
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
              }}
            />
          )
        ) : (
          <View style={styles.noStreamOverlay}>
            <Ionicons name="videocam-off-outline" size={38} color={colors.accent} />
            <Text style={styles.noStreamTitle}>Stream Not Available</Text>
            <Text style={styles.noStreamDesc}>
              No stream found. Please import a valid YouTube video link or upload directly from device storage.
            </Text>
          </View>
        )}

        {/* Dynamic Brightness Overlay (0.1 to 1.0) */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(0, 0, 0, ${Math.max(0, (1 - brightnessLevel) * 0.85)})` },
          ]}
        />

        {/* Gesture HUD: Brightness / Volume */}
        {hudType && (
          <View style={styles.gestureHud}>
            <Ionicons
              name={
                hudType === 'brightness'
                  ? brightnessLevel > 0.6
                    ? 'sunny'
                    : 'sunny-outline'
                  : volumeLevel > 0.5
                    ? 'volume-high'
                    : volumeLevel > 0
                      ? 'volume-low'
                      : 'volume-mute'
              }
              size={24}
              color="#FFFFFF"
            />
            <View style={styles.hudBarTrack}>
              <View style={[styles.hudBarFill, { width: `${hudValue}%` }]} />
            </View>
            <Text style={styles.hudText}>{hudValue}%</Text>
          </View>
        )}

        {/* Double-Tap 10s Seek Ripple Feedback */}
        {doubleTapSide && (
          <View
            style={[
              styles.doubleTapOverlay,
              doubleTapSide === 'left' ? styles.doubleTapLeft : styles.doubleTapRight,
            ]}
          >
            <Animated.View
              style={[
                styles.doubleTapBubble,
                {
                  transform: [
                    {
                      scale: rippleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1.25],
                      }),
                    },
                  ],
                  opacity: rippleAnim.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [1, 0.9, 0],
                  }),
                },
              ]}
            >
              <Ionicons
                name={doubleTapSide === 'left' ? 'play-back' : 'play-forward'}
                size={32}
                color="#FFFFFF"
              />
              <Text style={styles.doubleTapText}>10 seconds</Text>
            </Animated.View>
          </View>
        )}

        {/* Sponsor Skip Toast */}
        {sponsorSkipToast && (
          <View style={styles.sponsorToast}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
            <Text style={styles.sponsorToastText}>{sponsorSkipToast}</Text>
          </View>
        )}

        {/* Snapshot Flash & Toast */}
        {snapshotToast && (
          <View style={styles.snapshotToast}>
            <Ionicons name="camera" size={16} color="#10B981" />
            <Text style={styles.snapshotToastText}>📸 Frame Snapshot Saved to Gallery!</Text>
          </View>
        )}

        {/* Player Controls Overlay (For direct local videos) */}
        {!youtubeId && showControls && (
          <View style={styles.controlsOverlay}>
            {/* Top Bar inside Overlay */}
            {isFullscreen ? (
              <View style={[styles.fullscreenTopBar, { paddingTop: Platform.OS === 'android' ? 12 : topInset }]}>
                <TouchableOpacity
                  style={styles.fullscreenBackBtn}
                  onPress={handleToggleFullscreen}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.fullscreenTitle} numberOfLines={1}>
                  {currentVideo.title}
                </Text>
                <View style={styles.fullscreenTopActions}>
                  {hasSponsorBlock && (
                    <View style={styles.sponsorBlockPill}>
                      <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                      <Text style={styles.sponsorBlockText}>Shield</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.fullscreenTopActionBtn}
                    onPress={() => setIsStretchFit(!isStretchFit)}
                  >
                    <MaterialCommunityIcons
                      name={isStretchFit ? 'arrow-collapse' : 'arrow-expand'}
                      size={18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fullscreenTopActionBtn}
                    onPress={() => setShowEnhancerModal(true)}
                  >
                    <Ionicons name="color-wand-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fullscreenTopActionBtn}
                    onPress={handleToggleFullscreen}
                  >
                    <MaterialCommunityIcons name="fullscreen-exit" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.overlayTopStatus}>
                {hasSponsorBlock && (
                  <View style={styles.sponsorBlockPill}>
                    <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                    <Text style={styles.sponsorBlockText}>SponsorBlock Shield Active</Text>
                  </View>
                )}
              </View>
            )}

            {/* Center Transport Controls */}
            <View style={styles.centerControlsRow}>
              {/* 10s Rewind */}
              <TouchableOpacity
                style={styles.transportBtn}
                onPress={() => seekTo(Math.max(0, currentTime - 10))}
                activeOpacity={0.7}
              >
                <Ionicons name="play-back" size={26} color="#FFFFFF" />
                <Text style={styles.stepSecLabel}>-10s</Text>
              </TouchableOpacity>

              {/* Play / Pause */}
              <TouchableOpacity
                style={[
                  styles.mainPlayBtn,
                  { backgroundColor: colors.accent, shadowColor: colors.accent },
                ]}
                onPress={() => (isPlaying ? pauseVideo() : resumeVideo())}
                activeOpacity={0.8}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFFFFF" />
              </TouchableOpacity>

              {/* 10s Fast Forward */}
              <TouchableOpacity
                style={styles.transportBtn}
                onPress={() => seekTo(Math.min(duration || 9999, currentTime + 10))}
                activeOpacity={0.7}
              >
                <Ionicons name="play-forward" size={26} color="#FFFFFF" />
                <Text style={styles.stepSecLabel}>+10s</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Bar Controls (Seekbar, Speeds, Tools) */}
            <View style={styles.bottomControls}>
              {/* Seekbar */}
              <View
                style={styles.seekbarContainer}
                onLayout={(e) => setTrackLayoutWidth(e.nativeEvent.layout.width)}
              >
                {abLoop?.enabled && duration > 0 && (
                  <>
                    <View
                      style={[
                        styles.loopFlagA,
                        { left: `${(abLoop.start / duration) * 100}%` },
                      ]}
                    >
                      <Text style={styles.flagText}>A</Text>
                    </View>
                    <View
                      style={[
                        styles.loopFlagB,
                        { left: `${(abLoop.end / duration) * 100}%` },
                      ]}
                    >
                      <Text style={styles.flagText}>B</Text>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.seekbarTouchTrack}
                  activeOpacity={1}
                  onPress={(e) => {
                    const { locationX } = e.nativeEvent;
                    const trackWidth = trackLayoutWidth || (screenWidth - 32);
                    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
                    seekTo(ratio * (duration || currentVideo.durationSeconds));
                  }}
                >
                  <View style={styles.seekbarBackground}>
                    <View
                      style={[
                        styles.seekbarFill,
                        { width: `${progressPercent}%`, backgroundColor: colors.accent },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Time display & Pro Utilities row */}
              <View style={styles.proUtilsRow}>
                <Text style={styles.timeText}>
                  {formatSeconds(currentTime)} / {formatSeconds(duration || currentVideo.durationSeconds)}
                </Text>

                <View style={styles.utilsRight}>
                  {/* Frame by Frame - Backward */}
                  <TouchableOpacity
                    style={styles.utilIconBtn}
                    onPress={() => triggerFrameStep(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="play-skip-back" size={14} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Frame by Frame - Forward */}
                  <TouchableOpacity
                    style={styles.utilIconBtn}
                    onPress={() => triggerFrameStep(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="play-skip-forward" size={14} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* 1-Click Snapshot */}
                  <TouchableOpacity
                    style={styles.utilIconBtn}
                    onPress={handleSnapshot}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Speed Selector Badge */}
                  <TouchableOpacity
                    style={[styles.speedBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                    onPress={() => setShowSpeedMenu(!showSpeedMenu)}
                  >
                    <Text style={styles.speedBadgeText}>{playbackSpeed}x</Text>
                  </TouchableOpacity>

                  {/* Fullscreen Toggle Button */}
                  <TouchableOpacity
                    style={[styles.utilIconBtn, { marginLeft: 4 }]}
                    onPress={handleToggleFullscreen}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Fullscreen top exit button for YouTube player */}
        {youtubeId && isFullscreen && (
          <View style={[styles.fullscreenTopBar, { paddingTop: Platform.OS === 'android' ? 12 : topInset, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99 }]}>
            <TouchableOpacity
              style={styles.fullscreenBackBtn}
              onPress={handleToggleFullscreen}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              {currentVideo.title}
            </Text>
            <TouchableOpacity
              style={styles.fullscreenTopActionBtn}
              onPress={handleToggleFullscreen}
            >
              <MaterialCommunityIcons name="fullscreen-exit" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Speed Selector Dropdown Menu */}
        {showSpeedMenu && (
          <View
            style={[
              styles.speedMenu,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.speedMenuTitle, { color: colors.textSecondary }]}>
              PLAYBACK SPEED
            </Text>
            <View style={styles.speedGrid}>
              {speeds.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.speedItem,
                    s === playbackSpeed && { backgroundColor: colors.accent },
                  ]}
                  onPress={() => {
                    setPlaybackSpeed(s);
                    setShowSpeedMenu(false);
                  }}
                >
                  <Text
                    style={[
                      styles.speedItemText,
                      { color: s === playbackSpeed ? '#FFFFFF' : colors.textPrimary },
                    ]}
                  >
                    {s}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Video Details & Actions Scroll Area (hidden in fullscreen) */}
      {!isFullscreen && (
        <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.infoSection}>
          {/* Title */}
          <Text style={[styles.videoTitle, { color: colors.textPrimary }]}>
            {currentVideo.title}
          </Text>

          {/* Stats Bar */}
          <Text style={[styles.viewsCount, { color: colors.textMuted }]}>
            {currentVideo.views} views • {currentVideo.publishedAt} • 4K HDR 60fps
          </Text>

          {/* Channel Row */}
          <View style={[styles.channelBar, { borderColor: colors.divider }]}>
            <View style={styles.channelLeft}>
              <Image source={{ uri: currentVideo.channelAvatar }} style={styles.channelAvatar} />
              <View>
                <View style={styles.channelNameRow}>
                  <Text style={[styles.channelTitle, { color: colors.textPrimary }]}>
                    {currentVideo.channelTitle}
                  </Text>
                  {currentVideo.channelVerified && (
                    <Ionicons name="checkmark-circle" size={13} color={colors.accent} />
                  )}
                </View>
                <Text style={[styles.subscriberCount, { color: colors.textMuted }]}>
                  {currentVideo.channelSubscribers} subscribers
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeBtn,
                {
                  backgroundColor: isSubscribed ? colors.surfaceSubtle : colors.textPrimary,
                },
              ]}
              onPress={() => setIsSubscribed(!isSubscribed)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isSubscribed ? 'notifications' : 'notifications-outline'}
                size={14}
                color={isSubscribed ? colors.accent : colors.background}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.subscribeBtnText,
                  { color: isSubscribed ? colors.textPrimary : colors.background },
                ]}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Pro Actions Toolbar (YouTube Standard + Vanced Beyond) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionToolbar}
          >
            {/* Like */}
            <TouchableOpacity
              style={[
                styles.actionPill,
                {
                  backgroundColor: isLiked(currentVideo.id)
                    ? 'rgba(255, 0, 51, 0.2)'
                    : colors.surfaceSubtle,
                  borderColor: isLiked(currentVideo.id) ? colors.accent : colors.divider,
                },
              ]}
              onPress={() => toggleLike(currentVideo.id)}
            >
              <Ionicons
                name={isLiked(currentVideo.id) ? 'thumbs-up' : 'thumbs-up-outline'}
                size={16}
                color={isLiked(currentVideo.id) ? colors.accent : colors.textPrimary}
              />
              <Text style={[styles.pillText, { color: colors.textPrimary }]}>
                {currentVideo.likes}
              </Text>
            </TouchableOpacity>

            {/* Return YouTube Dislike (Real counts!) */}
            <TouchableOpacity
              style={[
                styles.actionPill,
                {
                  backgroundColor: isDisliked ? 'rgba(255, 255, 255, 0.15)' : colors.surfaceSubtle,
                  borderColor: colors.divider,
                },
              ]}
              onPress={() => setIsDisliked(!isDisliked)}
            >
              <Ionicons
                name={isDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
                size={16}
                color={colors.textPrimary}
              />
              <Text style={[styles.pillText, { color: colors.textMuted }]}>
                {dislikeCount}
              </Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              style={[
                styles.actionPill,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider },
              ]}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={16} color={colors.textPrimary} />
              <Text style={[styles.pillText, { color: colors.textPrimary }]}>Share</Text>
            </TouchableOpacity>

            {/* Permanent Offline Download Button */}
            <TouchableOpacity
              style={[
                styles.actionPill,
                {
                  backgroundColor: isDownloaded(currentVideo.id)
                    ? 'rgba(16, 185, 129, 0.2)'
                    : colors.surfaceSubtle,
                  borderColor: isDownloaded(currentVideo.id) ? '#10B981' : colors.divider,
                },
              ]}
              onPress={() => setShowDownloadModal(true)}
            >
              <Ionicons
                name={isDownloaded(currentVideo.id) ? 'checkmark-circle' : 'download-outline'}
                size={16}
                color={isDownloaded(currentVideo.id) ? '#10B981' : colors.textPrimary}
              />
              <Text style={[styles.pillText, { color: colors.textPrimary }]}>
                {isDownloaded(currentVideo.id) ? 'Saved 4K ♾️' : 'Download 4K'}
              </Text>
            </TouchableOpacity>

            {/* AI Insights & Summarizer */}
            <TouchableOpacity
              style={[
                styles.actionPill,
                {
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  borderColor: colors.secondaryAccent,
                },
              ]}
              onPress={() => setShowAIModal(true)}
            >
              <MaterialCommunityIcons name="robot" size={16} color={colors.secondaryAccent} />
              <Text style={[styles.pillText, { color: colors.secondaryAccent }]}>AI Summary</Text>
            </TouchableOpacity>

            {/* Video Enhancer */}
            <TouchableOpacity
              style={[
                styles.actionPill,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider },
              ]}
              onPress={() => setShowEnhancerModal(true)}
            >
              <Ionicons name="color-wand-outline" size={16} color={colors.accent} />
              <Text style={[styles.pillText, { color: colors.textPrimary }]}>Cinema HDR</Text>
            </TouchableOpacity>

            {/* Timestamped Note */}
            <TouchableOpacity
              style={[
                styles.actionPill,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider },
              ]}
              onPress={() => setShowNotesModal(true)}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.textPrimary} />
              <Text style={[styles.pillText, { color: colors.textPrimary }]}>Add Note</Text>
            </TouchableOpacity>

            {/* A-B Loop */}
            <TouchableOpacity
              style={[
                styles.actionPill,
                {
                  backgroundColor: abLoop?.enabled
                    ? 'rgba(255, 0, 51, 0.2)'
                    : colors.surfaceSubtle,
                  borderColor: abLoop?.enabled ? colors.accent : colors.divider,
                },
              ]}
              onPress={() => setShowABLoopModal(true)}
            >
              <Ionicons
                name="repeat"
                size={16}
                color={abLoop?.enabled ? colors.accent : colors.textPrimary}
              />
              <Text style={[styles.pillText, { color: colors.textPrimary }]}>
                {abLoop?.enabled ? 'A-B Looping' : 'A-B Loop'}
              </Text>
            </TouchableOpacity>

            {/* Sleep Timer */}
            <TouchableOpacity
              style={[
                styles.actionPill,
                {
                  backgroundColor:
                    sleepTimerRemaining !== null
                      ? 'rgba(245, 158, 11, 0.2)'
                      : colors.surfaceSubtle,
                  borderColor: sleepTimerRemaining !== null ? '#F59E0B' : colors.divider,
                },
              ]}
              onPress={() => setShowSleepModal(true)}
            >
              <Ionicons
                name="moon-outline"
                size={16}
                color={sleepTimerRemaining !== null ? '#F59E0B' : colors.textPrimary}
              />
              <Text style={[styles.pillText, { color: colors.textPrimary }]}>
                {sleepTimerRemaining !== null ? 'Timer Active' : 'Sleep Timer'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Video Description Box */}
          <View
            style={[
              styles.descriptionBox,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.descTitle, { color: colors.textPrimary }]}>Description</Text>
            <Text style={[styles.descContent, { color: colors.textSecondary }]}>
              {currentVideo.description}
            </Text>
          </View>

          {/* Comments Section */}
          <View style={[styles.commentsSection, { borderColor: colors.divider }]}>
            <View style={styles.commentsHeader}>
              <Text style={[styles.commentsTitle, { color: colors.textPrimary }]}>
                Comments ({localComments.length})
              </Text>
              <Text style={[styles.proBadgeLabel, { color: colors.accent }]}>
                PRO MAX VIP
              </Text>
            </View>

            {/* New Comment Input */}
            <View
              style={[
                styles.commentInputRow,
                { backgroundColor: colors.surface, borderColor: colors.divider },
              ]}
            >
              <TextInput
                style={[styles.commentInput, { color: colors.textPrimary }]}
                placeholder="Add a comment to this video..."
                placeholderTextColor={colors.textMuted}
                value={newCommentText}
                onChangeText={setNewCommentText}
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity
                style={[styles.postCommentBtn, { backgroundColor: colors.accent }]}
                onPress={handleAddComment}
                disabled={!newCommentText.trim()}
              >
                <Ionicons name="send" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Comment Items */}
            {localComments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <View style={styles.commentMeta}>
                    <Text style={[styles.commentAuthor, { color: colors.textPrimary }]}>
                      {comment.author}
                    </Text>
                    <Text style={[styles.commentTime, { color: colors.textMuted }]}>
                      {comment.timeAgo}
                    </Text>
                  </View>
                  <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                    {comment.text}
                  </Text>
                  <View style={styles.commentActions}>
                    <TouchableOpacity style={styles.commentLikeBtn}>
                      <Ionicons name="heart-outline" size={13} color={colors.textMuted} />
                      <Text style={[styles.commentLikesText, { color: colors.textMuted }]}>
                        {comment.likes}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            {/* UP NEXT RECOMMENDED SECTION (Only real user videos) */}
            {userUploadedVideos.filter((v) => v.id !== currentVideo.id).length > 0 && (
              <View style={styles.upNextSection}>
                <Text style={[styles.upNextHeading, { color: colors.textSecondary }]}>UP NEXT</Text>
                {userUploadedVideos
                  .filter((v) => v.id !== currentVideo.id)
                  .map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.upNextCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                      onPress={() => playVideo(item)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: item.thumbnail }} style={styles.upNextThumb} />
                      <View style={styles.upNextMeta}>
                        <Text style={[styles.upNextTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={[styles.upNextChannel, { color: colors.textMuted }]} numberOfLines={1}>
                          {item.channelTitle} • {item.views} views
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      )}

      {/* Child Feature Modals */}
      <VideoEnhancerModal visible={showEnhancerModal} onClose={() => setShowEnhancerModal(false)} />
      <ABLoopModal visible={showABLoopModal} onClose={() => setShowABLoopModal(false)} />
      <SleepTimerModal visible={showSleepModal} onClose={() => setShowSleepModal(false)} />
      <DownloadModal visible={showDownloadModal} onClose={() => setShowDownloadModal(false)} video={currentVideo} />
      <NotesModal visible={showNotesModal} onClose={() => setShowNotesModal(false)} video={currentVideo} />
      <VideoAIAssistant visible={showAIModal} onClose={() => setShowAIModal(false)} video={currentVideo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  ambientGlowContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 280,
    zIndex: 0,
    pointerEvents: 'none',
  },
  ambientGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  topHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 10,
  },
  headerLeftBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ambientTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewport: {
    width: '100%',
    height: 230,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  viewportFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 99,
    backgroundColor: '#000000',
  },
  fullscreenTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    marginBottom: 8,
  },
  fullscreenBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 12,
  },
  fullscreenTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fullscreenTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fullscreenTopActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  gestureHud: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 35,
  },
  hudBarTrack: {
    width: 90,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  hudBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  hudText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    minWidth: 36,
  },
  doubleTapOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    pointerEvents: 'none',
  },
  doubleTapLeft: {
    left: 0,
  },
  doubleTapRight: {
    right: 0,
  },
  doubleTapBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: 'center',
    gap: 6,
  },
  doubleTapText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sponsorToast: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 30,
  },
  sponsorToastText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  snapshotToast: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 30,
  },
  snapshotToastText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    padding: 12,
    zIndex: 25,
  },
  overlayTopStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  sponsorBlockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  sponsorBlockText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  centerControlsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  transportBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSecLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  mainPlayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  bottomControls: {
    width: '100%',
  },
  seekbarContainer: {
    width: '100%',
    height: 16,
    justifyContent: 'center',
    position: 'relative',
  },
  seekbarTouchTrack: {
    height: 16,
    justifyContent: 'center',
  },
  seekbarBackground: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  seekbarFill: {
    height: '100%',
  },
  loopFlagA: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF0033',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  loopFlagB: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  flagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  proUtilsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  utilsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  utilIconBtn: {
    padding: 2,
  },
  speedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  speedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  speedMenu: {
    position: 'absolute',
    bottom: 40,
    right: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 35,
  },
  speedMenuTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 140,
    gap: 6,
  },
  speedItem: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  speedItemText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsScroll: {
    flex: 1,
  },
  infoSection: {
    padding: 14,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  viewsCount: {
    fontSize: 11,
    marginBottom: 12,
  },
  channelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  channelAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  channelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  subscriberCount: {
    fontSize: 11,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  subscribeBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionToolbar: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 14,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  descTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  descContent: {
    fontSize: 12,
    lineHeight: 18,
  },
  commentsSection: {
    borderTopWidth: 1,
    paddingTop: 14,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  proBadgeLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  commentInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 6,
  },
  postCommentBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 10,
  },
  commentText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikesText: {
    fontSize: 10,
  },
  upNextSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  upNextHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  upNextCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  upNextThumb: {
    width: 90,
    height: 55,
    borderRadius: 8,
  },
  upNextMeta: {
    flex: 1,
  },
  upNextTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  upNextChannel: {
    fontSize: 10,
  },
  noStreamOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  noStreamTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  noStreamDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },
});
