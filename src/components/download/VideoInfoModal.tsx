import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { DownloadedVideo } from '../../types';
import { formatBytes, formatClock, formatCount, formatDate } from '../../utils/videoFormat';

interface VideoInfoModalProps {
  video: DownloadedVideo | null;
  onClose: () => void;
}

/** Everything collected about a downloaded video. */
export const VideoInfoModal: React.FC<VideoInfoModalProps> = ({ video, onClose }) => {
  const { colors } = useApp();
  if (!video) return null;

  const rows: [string, string][] = [
    ['Channel', video.channelTitle + (video.channelVerified ? ' (verified)' : '')],
    ['Subscribers', formatCount(video.channelSubscribers)],
    ['Views', formatCount(video.views)],
    ['Likes', formatCount(video.likes)],
    ['Dislikes', formatCount(video.dislikes)],
    ['Uploaded', video.uploadDate],
    ['Duration', formatClock(video.durationSeconds)],
    ['Category', video.category || '–'],
    ['Format', `${video.quality} (${video.mimeType})`],
    ['File size', formatBytes(video.fileSizeBytes)],
    ['Downloaded', formatDate(video.downloadedAt)],
    ['Sponsor segments', `${video.sponsorSegments.length}`],
    ['YouTube ID', video.youtubeId],
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Video details</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {!!video.thumbnailUri && <Image source={{ uri: video.thumbnailUri }} style={styles.thumbnail} />}
            <Text style={[styles.title, { color: colors.textPrimary }]}>{video.title}</Text>

            <View style={[styles.table, { borderColor: colors.divider }]}>
              {rows.map(([label, value]) => (
                <View key={label} style={[styles.tableRow, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
                  <Text style={[styles.value, { color: colors.textSecondary }]} selectable>
                    {value}
                  </Text>
                </View>
              ))}
            </View>

            {video.chapters.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CHAPTERS</Text>
                {video.chapters.map((c) => (
                  <Text key={`${c.timestamp}-${c.title}`} style={[styles.body, { color: colors.textSecondary }]}>
                    {c.timeFormatted}  {c.title}
                  </Text>
                ))}
              </>
            )}

            {video.tags.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TAGS</Text>
                <Text style={[styles.body, { color: colors.textSecondary }]}>{video.tags.join(', ')}</Text>
              </>
            )}

            {!!video.description && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DESCRIPTION</Text>
                {/* Piped returns the description as HTML; show it as plain text */}
                <Text style={[styles.body, { color: colors.textSecondary }]} selectable>
                  {video.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')}
                </Text>
              </>
            )}
          </ScrollView>
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
    maxHeight: '90%',
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
    marginBottom: 12,
  },
  table: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  label: {
    width: 120,
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    flex: 1,
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 6,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
});
