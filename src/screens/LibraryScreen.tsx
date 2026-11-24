import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { VideoItem, TimestampNote, Playlist } from '../types';

export const LibraryScreen: React.FC = () => {
  const {
    colors,
    notes,
    likedVideoIds,
    watchHistory,
    clearHistory,
    playlists,
    createPlaylist,
    playVideo,
    removeTimestampNote,
    seekTo,
    downloadedVideoItems,
  } = useApp();

  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) return;
    await createPlaylist(playlistName.trim());
    setPlaylistName('');
    setShowNewPlaylistModal(false);
  };

  // History, likes and notes resolve against the downloaded videos
  const allAvailableVideos = downloadedVideoItems;
  const likedVideos = allAvailableVideos.filter((v: VideoItem) => likedVideoIds.includes(v.id));
  const historyVideos = watchHistory
    .map((h: { videoId: string; watchedAt: string; progressPercent: number }) => ({
      item: allAvailableVideos.find((v: VideoItem) => v.id === h.videoId),
      watchedAt: h.watchedAt,
    }))
    .filter((h: { item?: VideoItem; watchedAt: string }) => !!h.item) as { item: VideoItem; watchedAt: string }[];

  const handleNoteJump = (note: TimestampNote) => {
    const matchedVideo = allAvailableVideos.find((v: VideoItem) => v.id === note.videoId);
    if (matchedVideo) {
      playVideo(matchedVideo, note.timestamp);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Library</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* TIMESTAMPED NOTES SECTION */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithBadge}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>TIMESTAMPED NOTES</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.countBadgeText, { color: colors.accent }]}>{notes.length}</Text>
            </View>
          </View>
        </View>

        {notes.length === 0 ? (
          <View style={[styles.emptySectionBox, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Ionicons name="document-text-outline" size={24} color={colors.textMuted} />
            <Text style={[styles.emptySectionText, { color: colors.textMuted }]}>
              Take timestamped notes while watching any video to pin key moments!
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notesRow}>
            {notes.map((note: TimestampNote) => (
              <TouchableOpacity
                key={note.id}
                style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                onPress={() => handleNoteJump(note)}
                activeOpacity={0.8}
              >
                <View style={styles.noteCardTop}>
                  <View style={[styles.noteTimePill, { backgroundColor: 'rgba(255, 0, 51, 0.15)' }]}>
                    <Ionicons name="play" size={10} color={colors.accent} />
                    <Text style={[styles.noteTimeText, { color: colors.accent }]}>{note.timeFormatted}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeTimestampNote(note.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.noteSnippet, { color: colors.textPrimary }]} numberOfLines={3}>
                  {note.noteText}
                </Text>
                <Text style={[styles.noteVideoTitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {note.videoTitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* WATCH HISTORY */}
        <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>HISTORY</Text>
          {historyVideos.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={[styles.clearBtnText, { color: colors.accent }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {historyVideos.length === 0 ? (
          <View style={[styles.emptySectionBox, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Ionicons name="time-outline" size={24} color={colors.textMuted} />
            <Text style={[styles.emptySectionText, { color: colors.textMuted }]}>
              Your recently watched videos will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
            {historyVideos.map(({ item }, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.historyCard}
                onPress={() => playVideo(item)}
                activeOpacity={0.8}
              >
                <Image source={item.thumbnail ? { uri: item.thumbnail } : undefined} style={[styles.historyThumb, { backgroundColor: colors.surfaceSubtle }]} />
                <Text style={[styles.historyTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.historyChannel, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.channelTitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* LIKED VIDEOS */}
        <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
          <View style={styles.sectionTitleWithBadge}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>LIKED VIDEOS</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.countBadgeText, { color: colors.accent }]}>{likedVideos.length}</Text>
            </View>
          </View>
        </View>

        {likedVideos.length === 0 ? (
          <View style={[styles.emptySectionBox, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Ionicons name="heart-outline" size={24} color={colors.textMuted} />
            <Text style={[styles.emptySectionText, { color: colors.textMuted }]}>
              Videos you like will be organized here.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
            {likedVideos.map((item: VideoItem) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                onPress={() => playVideo(item)}
                activeOpacity={0.8}
              >
                <Image source={item.thumbnail ? { uri: item.thumbnail } : undefined} style={[styles.historyThumb, { backgroundColor: colors.surfaceSubtle }]} />
                <Text style={[styles.historyTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.historyChannel, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.channelTitle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* PLAYLISTS */}
        <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>CUSTOM PLAYLISTS</Text>
          <TouchableOpacity onPress={() => setShowNewPlaylistModal(true)}>
            <Text style={[styles.clearBtnText, { color: colors.accent }]}>+ New Playlist</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playlistsList}>
          {playlists.map((pl: Playlist) => (
            <View
              key={pl.id}
              style={[styles.playlistItem, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            >
              <Image source={pl.thumbnail ? { uri: pl.thumbnail } : undefined} style={[styles.plThumb, { backgroundColor: colors.surfaceSubtle }]} />
              <View style={styles.plInfo}>
                <Text style={[styles.plTitle, { color: colors.textPrimary }]}>{pl.name}</Text>
                <Text style={[styles.plMeta, { color: colors.textMuted }]}>
                  {pl.videoCount} videos • Created {pl.createdAt}
                </Text>
              </View>
              <Ionicons name="play-circle-outline" size={24} color={colors.accent} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* New Playlist Modal */}
      <Modal visible={showNewPlaylistModal} transparent animationType="fade" onRequestClose={() => setShowNewPlaylistModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create New Playlist</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceSubtle, color: colors.textPrimary }]}
              placeholder="Playlist name..."
              placeholderTextColor={colors.textMuted}
              value={playlistName}
              onChangeText={setPlaylistName}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => setShowNewPlaylistModal(false)}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}
                onPress={handleCreatePlaylist}
                disabled={!playlistName.trim()}
              >
                <Text style={styles.modalConfirmBtnText}>Create</Text>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  downloadsShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  downloadsShortcutText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
    padding: 14,
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  vaultCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vaultIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  vaultTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  neverExpiresBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  neverExpiresBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
  },
  vaultSub: {
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptySectionBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  emptySectionText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  notesRow: {
    gap: 10,
    paddingBottom: 4,
  },
  noteCard: {
    width: 170,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  noteCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noteTimeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  noteSnippet: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
  },
  noteVideoTitle: {
    fontSize: 9,
  },
  historyRow: {
    gap: 12,
    paddingBottom: 4,
  },
  historyCard: {
    width: 140,
  },
  historyThumb: {
    width: 140,
    height: 82,
    borderRadius: 10,
    backgroundColor: '#000000',
    marginBottom: 6,
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginBottom: 2,
  },
  historyChannel: {
    fontSize: 9,
  },
  playlistsList: {
    gap: 8,
    marginBottom: 20,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  plThumb: {
    width: 50,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  plInfo: {
    flex: 1,
  },
  plTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  plMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalInput: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
