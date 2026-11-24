import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const MiniPlayer: React.FC = () => {
  const { currentVideo, playerMode, setPlayerMode, isPlaying, pauseVideo, resumeVideo, colors, currentTime, duration } =
    useApp();

  if (!currentVideo || playerMode !== 'minimized') {
    return null;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.cardBorder }]}>
      {/* Top micro progress bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.accent }]} />
      </View>

      <TouchableOpacity
        style={styles.contentRow}
        onPress={() => setPlayerMode('full')}
        activeOpacity={0.9}
      >
        <Image
          source={currentVideo.thumbnail ? { uri: currentVideo.thumbnail } : undefined}
          style={[styles.thumbnail, { backgroundColor: colors.surfaceSubtle }]}
        />

        <View style={styles.infoWrapper}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {currentVideo.title}
          </Text>
          <Text style={[styles.channel, { color: colors.textMuted }]} numberOfLines={1}>
            {currentVideo.channelTitle} • Mini-Player
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => {
              e.stopPropagation();
              isPlaying ? pauseVideo() : resumeVideo();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => {
              e.stopPropagation();
              setPlayerMode('closed');
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderTopWidth: 1,
    position: 'relative',
    zIndex: 20,
    elevation: 8,
  },
  progressBarTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFill: {
    height: '100%',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  thumbnail: {
    width: 64,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
  },
  channel: {
    fontSize: 10,
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
