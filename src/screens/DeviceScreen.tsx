import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { DeviceVideo } from '../types';
import { DevicePermission, deviceMediaService, isDeviceLibrarySupported } from '../services/deviceMediaService';
import { formatClock, formatDate } from '../utils/videoFormat';

export const DeviceScreen: React.FC = () => {
  const { colors, playDeviceVideo } = useApp();
  const [permission, setPermission] = useState<DevicePermission | null>(null);
  const [videos, setVideos] = useState<DeviceVideo[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPage = useCallback(async (offset: number) => {
    setIsLoading(true);
    try {
      const page = await deviceMediaService.listVideos(offset);
      setVideos((prev) => (offset === 0 ? page.videos : [...prev, ...page.videos]));
      setHasMore(page.hasMore);
    } catch {
      Alert.alert('Could not read videos', 'The media library could not be read.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDeviceLibrarySupported) return;
    deviceMediaService.getPermission().then((p) => {
      setPermission(p);
      if (p === 'granted' || p === 'limited') loadPage(0);
    });
  }, [loadPage]);

  const handleRequest = async () => {
    const p = await deviceMediaService.requestPermission();
    setPermission(p);
    if (p === 'granted' || p === 'limited') loadPage(0);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPage(0);
    setIsRefreshing(false);
  };

  const handlePlay = async (video: DeviceVideo) => {
    try {
      await playDeviceVideo(video);
    } catch {
      Alert.alert('Cannot open video', 'This video could not be opened.');
    }
  };

  if (!isDeviceLibrarySupported) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="phone-portrait-outline" size={42} color={colors.textMuted} />
        <Text style={[styles.centerText, { color: colors.textSecondary }]}>
          {Platform.OS === 'web'
            ? 'Device videos are available in the Android and iOS apps.'
            : 'Device videos need a development build of this app. Expo Go does not include the media library module.'}
        </Text>
      </View>
    );
  }

  if (permission !== 'granted' && permission !== 'limited') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={42} color={colors.accent} />
        <Text style={[styles.centerTitle, { color: colors.textPrimary }]}>Allow access to your videos</Text>
        <Text style={[styles.centerText, { color: colors.textSecondary }]}>
          The app needs permission to list and play the videos stored on this device.
        </Text>
        {permission === 'denied' ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.primaryBtnText}>Open settings</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleRequest}>
            <Text style={styles.primaryBtnText}>Allow access</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasMore && !isLoading) loadPage(videos.length);
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListHeaderComponent={
          <Text style={[styles.summary, { color: colors.textMuted }]}>
            {permission === 'limited' ? 'Showing the videos you allowed access to' : 'All videos on this device'}
          </Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.accent} style={styles.spinner} />
          ) : (
            <Text style={[styles.centerText, { color: colors.textSecondary }]}>No videos found on this device.</Text>
          )
        }
        ListFooterComponent={isLoading && videos.length > 0 ? <ActivityIndicator color={colors.accent} /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            onPress={() => handlePlay(item)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="play" size={22} color={colors.accent} />
              <Text style={[styles.duration, { color: colors.textSecondary }]}>{formatClock(item.durationSeconds)}</Text>
            </View>
            <View style={styles.body}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
                {item.filename}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {item.width && item.height ? `${item.width}×${item.height} • ` : ''}
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  },
  summary: {
    fontSize: 12,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  centerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  spinner: {
    marginTop: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconBox: {
    width: 96,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    fontSize: 11,
    marginTop: 3,
  },
});
