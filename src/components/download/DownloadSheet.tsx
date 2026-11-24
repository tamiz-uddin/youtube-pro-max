import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { DownloadFormat, YouTubeVideoInfo, youtubeService } from '../../services/youtubeService';
import { isDownloadSupported } from '../../services/downloadService';
import { formatBytes, formatClock, formatCount } from '../../utils/videoFormat';

interface DownloadSheetProps {
  youtubeId: string | null;
  onClose: () => void;
}

/** Loads a video's details, then lets the user pick a format to download. */
export const DownloadSheet: React.FC<DownloadSheetProps> = ({ youtubeId, onClose }) => {
  const { colors, startDownload, isYoutubeVideoDownloaded, downloadJobs } = useApp();
  const [info, setInfo] = useState<YouTubeVideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!youtubeId) return;
    let cancelled = false;
    setInfo(null);
    setError(null);
    youtubeService
      .getVideoInfo(youtubeId)
      .then((result) => {
        if (!cancelled) setInfo(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load this video.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [youtubeId]);

  const alreadyDownloaded = youtubeId ? isYoutubeVideoDownloaded(youtubeId) : false;
  const inProgress = youtubeId ? downloadJobs.some((j) => j.youtubeId === youtubeId && j.status === 'downloading') : false;

  const handlePick = (format: DownloadFormat) => {
    if (!info) return;
    startDownload(info, format);
    onClose();
  };

  return (
    <Modal visible={!!youtubeId} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Download video</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {!info && !error && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.mutedText, { color: colors.textMuted }]}>Collecting video details…</Text>
            </View>
          )}

          {error && (
            <View style={styles.centerBox}>
              <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
              <Text style={[styles.mutedText, { color: colors.textSecondary }]}>{error}</Text>
            </View>
          )}

          {info && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {!!info.thumbnail && <Image source={{ uri: info.thumbnail }} style={styles.thumbnail} />}
              <Text style={[styles.title, { color: colors.textPrimary }]}>{info.title}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {info.channelTitle}
                {info.channelSubscribers !== null ? ` • ${formatCount(info.channelSubscribers)} subscribers` : ''}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {formatCount(info.views)} views • {formatCount(info.likes)} likes • {info.uploadDate} •{' '}
                {formatClock(info.durationSeconds)}
              </Text>

              {alreadyDownloaded && (
                <View style={[styles.notice, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                    Already in your downloads. Downloading again saves another copy.
                  </Text>
                </View>
              )}

              {!isDownloadSupported && (
                <View style={[styles.notice, { backgroundColor: colors.surfaceSubtle }]}>
                  <Ionicons name="information-circle" size={16} color={colors.warning} />
                  <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                    Downloading works in the Android and iOS apps, not on web.
                  </Text>
                </View>
              )}

              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CHOOSE FORMAT</Text>
              {info.formats.length === 0 && (
                <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
                  No downloadable format was offered for this video.
                </Text>
              )}
              {info.formats.map((format) => (
                <TouchableOpacity
                  key={format.id}
                  style={[styles.formatRow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}
                  onPress={() => handlePick(format)}
                  disabled={inProgress || !isDownloadSupported}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={format.isAudioOnly ? 'musical-notes' : 'film'}
                    size={20}
                    color={colors.accent}
                  />
                  <View style={styles.formatTextCol}>
                    <Text style={[styles.formatLabel, { color: colors.textPrimary }]}>{format.label}</Text>
                    <Text style={[styles.formatMeta, { color: colors.textMuted }]}>
                      {format.extension.toUpperCase()} • {formatBytes(format.sizeBytes)}
                    </Text>
                  </View>
                  <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
              {inProgress && (
                <Text style={[styles.mutedText, { color: colors.textMuted }]}>This video is already downloading.</Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  mutedText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#000000',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  formatTextCol: {
    flex: 1,
  },
  formatLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  formatMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});
