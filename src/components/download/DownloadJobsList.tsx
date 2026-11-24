import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { formatBytes } from '../../utils/videoFormat';

/** In-progress and failed downloads, with progress bars and cancel/dismiss. */
export const DownloadJobsList: React.FC = () => {
  const { colors, downloadJobs, cancelDownload, dismissDownloadJob } = useApp();
  if (downloadJobs.length === 0) return null;

  return (
    <View style={styles.container}>
      {downloadJobs.map((job) => {
        const failed = job.status === 'failed';
        const percent =
          job.totalBytes && job.totalBytes > 0 ? Math.min(100, (job.bytesWritten / job.totalBytes) * 100) : null;
        return (
          <View
            key={job.youtubeId}
            style={[styles.row, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          >
            {job.thumbnail ? (
              <Image source={{ uri: job.thumbnail }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, { backgroundColor: colors.surfaceSubtle }]} />
            )}
            <View style={styles.body}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {job.title}
              </Text>
              {failed ? (
                <Text style={[styles.status, { color: colors.error }]} numberOfLines={2}>
                  Failed: {job.error}
                </Text>
              ) : (
                <>
                  <View style={[styles.track, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.fill,
                        { backgroundColor: colors.accent, width: percent !== null ? `${percent}%` : '15%' },
                      ]}
                    />
                  </View>
                  <Text style={[styles.status, { color: colors.textMuted }]}>
                    {job.formatLabel} • {formatBytes(job.bytesWritten)}
                    {job.totalBytes ? ` of ${formatBytes(job.totalBytes)}` : ''}
                    {percent !== null ? ` • ${Math.floor(percent)}%` : ''}
                  </Text>
                </>
              )}
            </View>
            <TouchableOpacity
              onPress={() => (failed ? dismissDownloadJob(job.youtubeId) : cancelDownload(job.youtubeId))}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={failed ? 'Dismiss' : 'Cancel download'}
            >
              <Ionicons name="close-circle" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  thumb: {
    width: 72,
    height: 42,
    borderRadius: 6,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  status: {
    fontSize: 11,
    marginTop: 4,
  },
});
