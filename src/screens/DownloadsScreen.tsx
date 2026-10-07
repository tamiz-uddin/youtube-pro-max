import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { OfflineDownload } from '../types';

interface DownloadsScreenProps {
  onBack?: () => void;
}

export const DownloadsScreen: React.FC<DownloadsScreenProps> = ({ onBack }) => {
  const { colors, downloads, removeDownload, playVideo } = useApp();
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<OfflineDownload | null>(null);

  const totalSizeMb = downloads.reduce((acc: number, curr: OfflineDownload) => acc + curr.fileSizeMb, 0);

  const handlePlayOffline = (item: OfflineDownload) => {
    playVideo({
      id: item.videoId,
      title: item.title,
      description: 'Playing from Permanent Offline Vault (No internet required)',
      thumbnail: item.thumbnail,
      videoUrl: item.videoUrl,
      channelTitle: item.channelTitle,
      channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      channelSubscribers: 'Verified',
      channelVerified: true,
      views: 'Offline',
      publishedAt: item.downloadedAt,
      duration: item.duration,
      durationSeconds: 300,
      category: 'Offline',
      likes: '100%',
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmItem) {
      await removeDownload(deleteConfirmItem.id);
      setDeleteConfirmItem(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={[styles.headerBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="download" size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Permanent Offline Vault</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>{downloads.length} Videos Saved</Text>
          </View>
        </View>

        <View style={[styles.offlineStatusChip, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
          <View style={styles.greenPulse} />
          <Text style={styles.offlineStatusText}>Offline Ready</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* PERMANENT STORAGE GUARANTEE HERO BANNER */}
        <View
          style={[
            styles.guaranteeHero,
            { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.35)' },
          ]}
        >
          <View style={styles.guaranteeHeroTop}>
            <MaterialCommunityIcons name="infinity" size={22} color="#10B981" />
            <Text style={styles.guaranteeHeroTitle}>PERMANENT VAULT POLICY</Text>
          </View>
          <Text style={styles.guaranteeHeroDesc}>
            YouTube Pro Max guarantees your downloaded content will <Text style={{ color: '#10B981', fontWeight: '800' }}>NEVER AUTO-DELETE</Text> or expire. No 30-day limits. No internet check-ins required.
          </Text>
        </View>

        {/* Device Storage Usage Meter */}
        <View style={[styles.storageCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.storageCardHeader}>
            <Text style={[styles.storageTitle, { color: colors.textPrimary }]}>Device Storage</Text>
            <Text style={[styles.storageSizeText, { color: colors.accent }]}>{totalSizeMb.toFixed(1)} MB Used</Text>
          </View>
          <View style={[styles.storageBarTrack, { backgroundColor: colors.surfaceSubtle }]}>
            <View
              style={[
                styles.storageBarFill,
                { width: `${Math.min(100, Math.max(8, (totalSizeMb / 1000) * 100))}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>
          <View style={styles.storageFooter}>
            <Text style={[styles.storageFooterText, { color: colors.textMuted }]}>
              {downloads.length} offline videos • Permanent storage
            </Text>
            <Text style={[styles.storageFooterText, { color: colors.textMuted }]}>Free: 48.2 GB</Text>
          </View>
        </View>

        {/* Downloads List */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>OFFLINE VIDEOS</Text>

        {downloads.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Ionicons name="cloud-download-outline" size={42} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Offline Videos Yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              Tap the download button on any video. It will be saved permanently and will never auto-delete!
            </Text>
          </View>
        ) : (
          downloads.map((item: OfflineDownload) => (
            <View
              key={item.id}
              style={[styles.downloadCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            >
              {/* Thumbnail with 1-tap play */}
              <TouchableOpacity
                style={styles.thumbWrapper}
                onPress={() => handlePlayOffline(item)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.thumbnail }} style={styles.thumbImg} />
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.thumbDuration}>
                  <Text style={styles.thumbDurationText}>{item.duration}</Text>
                </View>
              </TouchableOpacity>

              {/* Details */}
              <View style={styles.infoWrapper}>
                <TouchableOpacity onPress={() => handlePlayOffline(item)} activeOpacity={0.7}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.itemChannel, { color: colors.textMuted }]}>{item.channelTitle}</Text>

                {/* Badges: Quality, File Size, Permanent Lock */}
                <View style={styles.badgesRow}>
                  <View style={[styles.qualityTag, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.qualityTagText, { color: colors.accent }]}>{item.quality}</Text>
                  </View>

                  <View style={[styles.sizeTag, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.sizeTagText, { color: colors.textSecondary }]}>
                      {item.fileSizeMb.toFixed(1)} MB
                    </Text>
                  </View>

                  <View style={styles.permanentPill}>
                    <MaterialCommunityIcons name="infinity" size={12} color="#10B981" />
                    <Text style={styles.permanentPillText}>Never Expires</Text>
                  </View>
                </View>
              </View>

              {/* Delete button */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setDeleteConfirmItem(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteConfirmItem} transparent animationType="fade" onRequestClose={() => setDeleteConfirmItem(null)}>
        <View style={styles.confirmBackdrop}>
          <View style={[styles.confirmCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Ionicons name="warning-outline" size={32} color="#EF4444" />
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Delete Permanent Download?</Text>
            <Text style={[styles.confirmDesc, { color: colors.textMuted }]}>
              "{deleteConfirmItem?.title}" will be permanently removed from your offline storage.
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => setDeleteConfirmItem(null)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, { backgroundColor: '#EF4444' }]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteConfirmBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 10,
  },
  offlineStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  offlineStatusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
    padding: 14,
  },
  guaranteeHero: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  guaranteeHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  guaranteeHeroTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  guaranteeHeroDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  storageCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  storageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  storageTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  storageSizeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  storageBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageBarFill: {
    height: '100%',
  },
  storageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storageFooterText: {
    fontSize: 10,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  emptyBox: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 240,
  },
  downloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  thumbWrapper: {
    width: 100,
    height: 65,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  thumbDurationText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  infoWrapper: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 2,
  },
  itemChannel: {
    fontSize: 10,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  qualityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sizeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sizeTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  permanentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  permanentPillText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 6,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  confirmTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
