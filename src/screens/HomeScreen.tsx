import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Share,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { VideoItem } from '../types';
import { DownloadModal } from '../components/player/DownloadModal';
import { youtubeService } from '../services/youtubeService';

export const HomeScreen: React.FC = () => {
  const { colors, playVideo, isDownloaded, userUploadedVideos, setActiveTab } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [downloadModalVideo, setDownloadModalVideo] = useState<VideoItem | null>(null);
  const [liveTrendingVideos, setLiveTrendingVideos] = useState<VideoItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionSheetVideo, setActionSheetVideo] = useState<VideoItem | null>(null);

  const categories = ['All', 'Trending 🔥', 'AI & Future', 'Gaming', 'Music', 'Technology', 'Science'];

  // Load live trending videos on mount
  const fetchTrending = async () => {
    setIsRefreshing(true);
    try {
      const trending = await youtubeService.getTrendingVideos();
      if (trending && trending.length > 0) {
        setLiveTrendingVideos(trending);
      }
    } catch {
      // Keep empty if offline
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  // Only real videos: user uploads/imports and live trending streams (NO DUMMY VIDEOS)
  const allVideos = [
    ...userUploadedVideos,
    ...(liveTrendingVideos.length > 0 ? liveTrendingVideos : []),
  ];

  // Remove duplicate IDs
  const uniqueVideos = allVideos.filter(
    (v, i, arr) => arr.findIndex((item) => item.id === v.id) === i
  );

  const filteredVideos =
    selectedCategory === 'All'
      ? uniqueVideos
      : selectedCategory === 'Trending 🔥'
      ? liveTrendingVideos.length > 0
        ? liveTrendingVideos
        : uniqueVideos.slice(0, 5)
      : uniqueVideos.filter(
          (v: VideoItem) =>
            v.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            selectedCategory.toLowerCase().includes(v.category.toLowerCase())
        );

  const handleShareVideo = (video: VideoItem) => {
    Share.share({
      message: `Watch "${video.title}" in 4K HDR on YouTube Pro Max! https://youtube.com/watch?v=${video.id}`,
    }).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Category Pills Carousel */}
      <View style={[styles.categoryBar, { borderBottomColor: colors.divider }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.divider,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Videos Feed with Pull-To-Refresh */}
      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={filteredVideos.length === 0 ? styles.emptyScrollContainer : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={fetchTrending}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {filteredVideos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="film-outline" size={50} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Videos Added Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              No dummy videos are loaded. Add your real videos by importing a YouTube link or uploading directly from device storage.
            </Text>

            <View style={styles.emptyActionsRow}>
              <TouchableOpacity
                style={[styles.emptyBtnPrimary, { backgroundColor: colors.accent }]}
                onPress={() => setActiveTab('studio')}
                activeOpacity={0.8}
              >
                <Ionicons name="link" size={18} color="#FFFFFF" />
                <Text style={styles.emptyBtnPrimaryText}>Import YouTube Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.emptyBtnSecondary,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
                onPress={() => setActiveTab('studio')}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={18} color={colors.textPrimary} />
                <Text style={[styles.emptyBtnSecondaryText, { color: colors.textPrimary }]}>
                  Device Upload
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          filteredVideos.map((video) => (
            <TouchableOpacity
              key={video.id}
              style={[
                styles.videoCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
              onPress={() => playVideo(video)}
              activeOpacity={0.92}
            >
              {/* Thumbnail Box */}
              <View style={styles.thumbnailWrapper}>
              <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />

              {/* Duration badge */}
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{video.duration}</Text>
              </View>

              {/* 4K Pro Max tag */}
              <View style={[styles.qualityBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.qualityText}>4K PRO</Text>
              </View>

              {/* SponsorBlock Auto-Skip indicator */}
              <View style={styles.sponsorBlockBadge}>
                <Ionicons name="shield-checkmark" size={10} color="#10B981" />
                <Text style={styles.sponsorBadgeText}>AD-FREE</Text>
              </View>
            </View>

            {/* Video Meta Info */}
            <View style={styles.metaRow}>
              <Image source={{ uri: video.channelAvatar }} style={styles.channelAvatar} />

              <View style={styles.titleColumn}>
                <Text style={[styles.videoTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {video.title}
                </Text>

                <View style={styles.channelInfoRow}>
                  <Text style={[styles.channelTitle, { color: colors.textSecondary }]}>
                    {video.channelTitle}
                  </Text>
                  {video.channelVerified && (
                    <Ionicons name="checkmark-circle" size={12} color={colors.accent} />
                  )}
                  <Text style={[styles.dotSep, { color: colors.textMuted }]}>•</Text>
                  <Text style={[styles.statsText, { color: colors.textMuted }]}>
                    {video.views} views • {video.publishedAt}
                  </Text>
                </View>
              </View>

              {/* 3-Dot Context Options Button */}
              <TouchableOpacity
                style={styles.moreOptionsBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  setActionSheetVideo(video);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )))}
      </ScrollView>

      {/* 3-Dot Quick Action Sheet Modal */}
      {actionSheetVideo && (
        <Modal
          visible={!!actionSheetVideo}
          transparent
          animationType="fade"
          onRequestClose={() => setActionSheetVideo(null)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setActionSheetVideo(null)}
          >
            <View
              style={[
                styles.actionSheet,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.sheetHeader}>
                <Text
                  style={[styles.sheetTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {actionSheetVideo.title}
                </Text>
              </View>

              {/* Action: Play in Fullscreen */}
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  const vid = actionSheetVideo;
                  setActionSheetVideo(null);
                  playVideo(vid);
                }}
              >
                <Ionicons name="play-circle-outline" size={22} color={colors.accent} />
                <Text style={[styles.sheetItemText, { color: colors.textPrimary }]}>
                  Play in 4K HDR Player
                </Text>
              </TouchableOpacity>

              {/* Action: Download 4K */}
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  const vid = actionSheetVideo;
                  setActionSheetVideo(null);
                  setDownloadModalVideo(vid);
                }}
              >
                <Ionicons
                  name={isDownloaded(actionSheetVideo.id) ? 'checkmark-circle' : 'download-outline'}
                  size={22}
                  color={isDownloaded(actionSheetVideo.id) ? '#10B981' : colors.textPrimary}
                />
                <Text style={[styles.sheetItemText, { color: colors.textPrimary }]}>
                  {isDownloaded(actionSheetVideo.id)
                    ? 'Saved Offline (Permanent ♾️)'
                    : 'Download Permanent Offline (Never Expires)'}
                </Text>
              </TouchableOpacity>

              {/* Action: Share */}
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  const vid = actionSheetVideo;
                  setActionSheetVideo(null);
                  handleShareVideo(vid);
                }}
              >
                <Ionicons name="share-social-outline" size={22} color={colors.textPrimary} />
                <Text style={[styles.sheetItemText, { color: colors.textPrimary }]}>
                  Share Video Link
                </Text>
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.sheetCancelBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => setActionSheetVideo(null)}
              >
                <Text style={[styles.sheetCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Download Modal if triggered */}
      {downloadModalVideo && (
        <DownloadModal
          visible={!!downloadModalVideo}
          onClose={() => setDownloadModalVideo(null)}
          video={downloadModalVideo}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  categoryScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  feedScroll: {
    flex: 1,
    padding: 12,
  },
  videoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnailWrapper: {
    width: '100%',
    height: 195,
    position: 'relative',
    backgroundColor: '#000000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  qualityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sponsorBlockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  sponsorBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  channelAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  titleColumn: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 4,
  },
  channelInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  channelTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  dotSep: {
    fontSize: 11,
  },
  statsText: {
    fontSize: 10,
  },
  moreOptionsBtn: {
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 28,
    gap: 10,
  },
  sheetHeader: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  sheetItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetCancelBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 30,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 16,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emptyBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
