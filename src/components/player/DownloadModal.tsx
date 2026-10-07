import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { VideoItem, QualityOption } from '../../types';

interface DownloadModalProps {
  visible: boolean;
  onClose: () => void;
  video: VideoItem;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ visible, onClose, video }) => {
  const { colors, startDownload, isDownloaded } = useApp();
  const [selectedQuality, setSelectedQuality] = useState<QualityOption>('1080p');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const alreadyDownloaded = isDownloaded(video.id);

  const qualityOptions: { id: QualityOption; label: string; desc: string; size: string; icon: string }[] = [
    { id: '1080p', label: '1080p Ultra HD', desc: 'Highest quality crisp visuals', size: '142 MB', icon: 'sparkles' },
    { id: '720p', label: '720p Standard HD', desc: 'Smooth balanced streaming', size: '78 MB', icon: 'videocam' },
    { id: '480p', label: '480p Data Saver', desc: 'Compact file size', size: '35 MB', icon: 'film' },
    { id: 'audio_only', label: 'Audio Only (MP3)', desc: 'High-fidelity 320kbps music', size: '13 MB', icon: 'musical-notes' },
  ];

  const handleStartDownload = async () => {
    setDownloading(true);
    setDownloadProgress(10);

    const step1 = setTimeout(() => setDownloadProgress(45), 400);
    const step2 = setTimeout(() => setDownloadProgress(85), 800);
    const step3 = setTimeout(async () => {
      setDownloadProgress(100);
      await startDownload(video, selectedQuality);
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        setDownloadProgress(0);
        onClose();
      }, 1500);
    }, 1200);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.proIconBadge, { backgroundColor: colors.accent }]}>
                <Ionicons name="download" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Offline Download Vault</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* PERMANENT STORAGE GUARANTEE BANNER */}
          <View style={[styles.guaranteeBanner, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <View style={styles.guaranteeHeader}>
              <MaterialCommunityIcons name="infinity" size={18} color="#10B981" />
              <Text style={styles.guaranteeTitle}>PERMANENT STORAGE GUARANTEE</Text>
            </View>
            <Text style={styles.guaranteeDesc}>
              This download will <Text style={{ fontWeight: '800', color: '#10B981' }}>NEVER AUTO-DELETE</Text> or expire. It stays on your device forever until you manually choose to delete it.
            </Text>
          </View>

          {/* Video Preview */}
          <View style={[styles.videoPreview, { backgroundColor: colors.surfaceSubtle }]}>
            <Text style={[styles.videoTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {video.title}
            </Text>
            <Text style={[styles.videoChannel, { color: colors.textMuted }]}>
              {video.channelTitle} • {video.duration}
            </Text>
          </View>

          {/* Quality Options */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>SELECT QUALITY</Text>

          <View style={styles.qualityList}>
            {qualityOptions.map((opt) => {
              const isSelected = selectedQuality === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.qualityItem,
                    {
                      backgroundColor: isSelected ? colors.surfaceSubtle : 'transparent',
                      borderColor: isSelected ? colors.accent : colors.divider,
                    },
                  ]}
                  onPress={() => setSelectedQuality(opt.id)}
                  disabled={downloading}
                  activeOpacity={0.7}
                >
                  <View style={styles.qualityLeft}>
                    <View style={[styles.optIconWrap, { backgroundColor: isSelected ? colors.accent : colors.cardBg }]}>
                      <Ionicons
                        name={opt.icon as any}
                        size={15}
                        color={isSelected ? '#FFFFFF' : colors.textMuted}
                      />
                    </View>
                    <View>
                      <Text style={[styles.optLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                      <Text style={[styles.optDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                    </View>
                  </View>
                  <View style={styles.qualityRight}>
                    <Text style={[styles.optSize, { color: isSelected ? colors.accent : colors.textSecondary }]}>
                      {opt.size}
                    </Text>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? colors.accent : colors.textMuted}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Progress / Action */}
          {downloading ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressText, { color: colors.textPrimary }]}>
                  Saving to permanent device storage...
                </Text>
                <Text style={[styles.progressPercent, { color: colors.accent }]}>{downloadProgress}%</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                <View style={[styles.progressFill, { width: `${downloadProgress}%`, backgroundColor: colors.accent }]} />
              </View>
            </View>
          ) : downloadSuccess ? (
            <View style={[styles.successBanner, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.successText}>Saved Permanently to Offline Library!</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.downloadBtn,
                {
                  backgroundColor: alreadyDownloaded ? '#1E293B' : colors.accent,
                  shadowColor: colors.accent,
                },
              ]}
              onPress={handleStartDownload}
              activeOpacity={0.8}
            >
              <Ionicons
                name={alreadyDownloaded ? 'refresh' : 'download-outline'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.downloadBtnText}>
                {alreadyDownloaded ? 'Re-Download (Permanent)' : 'Download Permanently Now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  guaranteeBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guaranteeTitle: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  guaranteeDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  videoPreview: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  videoChannel: {
    fontSize: 11,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  qualityList: {
    gap: 8,
    marginBottom: 20,
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  qualityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  optDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  qualityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optSize: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
  },
  successText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
