import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { DownloadedVideo } from '../types';
import { DownloadJobsList } from '../components/download/DownloadJobsList';
import { VideoInfoModal } from '../components/download/VideoInfoModal';
import { formatBytes, formatClock, formatCount } from '../utils/videoFormat';

export const HomeScreen: React.FC = () => {
  const { colors, downloadedVideos, playDownloadedVideo, deleteDownloadedVideo, setActiveTab } = useApp();
  const [filter, setFilter] = useState('');
  const [actionVideo, setActionVideo] = useState<DownloadedVideo | null>(null);
  const [infoVideo, setInfoVideo] = useState<DownloadedVideo | null>(null);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return downloadedVideos;
    return downloadedVideos.filter(
      (v) => v.title.toLowerCase().includes(q) || v.channelTitle.toLowerCase().includes(q)
    );
  }, [downloadedVideos, filter]);

  const totalBytes = downloadedVideos.reduce((sum, v) => sum + v.fileSizeBytes, 0);

  const handlePlay = (video: DownloadedVideo) => {
    if (!playDownloadedVideo(video)) {
      Alert.alert('File missing', 'The video file for this download could not be found. Delete it and download again.');
    }
  };

  const confirmDelete = (video: DownloadedVideo) => {
    setActionVideo(null);
    Alert.alert('Delete download?', `"${video.title}" will be removed from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDownloadedVideo(video.id) },
    ]);
  };

  const shareLink = (video: DownloadedVideo) => {
    setActionVideo(null);
    Share.share({ message: `${video.title} https://youtube.com/watch?v=${video.youtubeId}` }).catch(() => {});
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceSubtle }]}>
        <Ionicons name="download-outline" size={46} color={colors.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {downloadedVideos.length === 0 ? 'No downloads yet' : 'No matches'}
      </Text>
      {downloadedVideos.length === 0 && (
        <>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Search YouTube or paste a link to save a video to this device. Downloaded videos play without internet.
          </Text>
          <View style={styles.emptyActionsRow}>
            <TouchableOpacity
              style={[styles.emptyBtnPrimary, { backgroundColor: colors.accent }]}
              onPress={() => setActiveTab('download')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyBtnPrimaryText}>Download a video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyBtnSecondary, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
              onPress={() => setActiveTab('device')}
              activeOpacity={0.8}
            >
              <Ionicons name="phone-portrait-outline" size={18} color={colors.textPrimary} />
              <Text style={[styles.emptyBtnSecondaryText, { color: colors.textPrimary }]}>Device videos</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <DownloadJobsList />
            {downloadedVideos.length > 0 && (
              <>
                <View style={[styles.filterRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                  <Ionicons name="search" size={16} color={colors.textMuted} />
                  <TextInput
                    style={[styles.filterInput, { color: colors.textPrimary }]}
                    placeholder="Search your downloads"
                    placeholderTextColor={colors.textMuted}
                    value={filter}
                    onChangeText={setFilter}
                  />
                </View>
                <Text style={[styles.summary, { color: colors.textMuted }]}>
                  {downloadedVideos.length} {downloadedVideos.length === 1 ? 'video' : 'videos'} •{' '}
                  {formatBytes(totalBytes)} on this device
                </Text>
              </>
            )}
          </>
        }
        ListEmptyComponent={renderEmpty}
        renderItem={({ item: video }) => (
          <TouchableOpacity
            style={[styles.videoCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            onPress={() => handlePlay(video)}
            activeOpacity={0.92}
          >
            <View style={styles.thumbnailWrapper}>
              {video.thumbnailUri ? (
                <Image source={{ uri: video.thumbnailUri }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.thumbPlaceholder]}>
                  <Ionicons name="film-outline" size={40} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{formatClock(video.durationSeconds)}</Text>
              </View>
              <View style={[styles.qualityBadge, { backgroundColor: colors.accent }]}>
                <Ionicons name={video.isAudioOnly ? 'musical-notes' : 'cloud-offline'} size={10} color="#FFFFFF" />
                <Text style={styles.qualityText}>{video.quality.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              {video.channelAvatarUri ? (
                <Image source={{ uri: video.channelAvatarUri }} style={styles.channelAvatar} />
              ) : (
                <View style={[styles.channelAvatar, { backgroundColor: colors.surfaceSubtle }]} />
              )}
              <View style={styles.titleColumn}>
                <Text style={[styles.videoTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={[styles.statsText, { color: colors.textMuted }]} numberOfLines={1}>
                  {video.channelTitle} • {formatCount(video.views)} views • {video.uploadDate}
                </Text>
                <Text style={[styles.statsText, { color: colors.textMuted }]}>
                  {formatBytes(video.fileSizeBytes)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.moreOptionsBtn}
                onPress={() => setActionVideo(video)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="More options"
              >
                <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {actionVideo && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setActionVideo(null)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActionVideo(null)}>
            <View style={[styles.actionSheet, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {actionVideo.title}
              </Text>
              {[
                { icon: 'play', label: 'Play', onPress: () => { setActionVideo(null); handlePlay(actionVideo); } },
                { icon: 'information-circle-outline', label: 'Video details', onPress: () => { setActionVideo(null); setInfoVideo(actionVideo); } },
                { icon: 'share-social-outline', label: 'Share YouTube link', onPress: () => shareLink(actionVideo) },
                { icon: 'trash-outline', label: 'Delete from device', onPress: () => confirmDelete(actionVideo), danger: true },
              ].map((action) => (
                <TouchableOpacity key={action.label} style={styles.sheetItem} onPress={action.onPress}>
                  <Ionicons
                    name={action.icon as any}
                    size={20}
                    color={action.danger ? colors.error : colors.textPrimary}
                  />
                  <Text style={[styles.sheetItemText, { color: action.danger ? colors.error : colors.textPrimary }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <VideoInfoModal video={infoVideo} onClose={() => setInfoVideo(null)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  filterInput: {
    flex: 1,
    fontSize: 14,
  },
  summary: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  videoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnailWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
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
    left: 8,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
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
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  statsText: {
    fontSize: 12,
    marginTop: 3,
  },
  moreOptionsBtn: {
    paddingTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  sheetItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  emptyBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyBtnSecondaryText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
