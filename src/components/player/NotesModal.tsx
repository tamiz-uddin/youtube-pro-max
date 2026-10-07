import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { VideoItem } from '../../types';

interface NotesModalProps {
  visible: boolean;
  onClose: () => void;
  video: VideoItem;
}

export const NotesModal: React.FC<NotesModalProps> = ({ visible, onClose, video }) => {
  const { colors, currentTime, addTimestampNote, notes, removeTimestampNote, seekTo } = useApp();
  const [noteText, setNoteText] = useState('');

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!noteText.trim()) return;
    await addTimestampNote(noteText.trim(), currentTime);
    setNoteText('');
  };

  const videoNotes = notes.filter((n) => n.videoId === video.id);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.badgeIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="document-text" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Timestamped Notes</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* New Note Input Box */}
          <View style={[styles.inputBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider }]}>
            <View style={styles.inputHeader}>
              <View style={[styles.timeBadge, { backgroundColor: colors.accent }]}>
                <Ionicons name="time" size={12} color="#FFFFFF" />
                <Text style={styles.timeBadgeText}>{formatSeconds(currentTime)}</Text>
              </View>
              <Text style={[styles.inputHelp, { color: colors.textMuted }]}>Pinned to current playhead</Text>
            </View>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary }]}
              placeholder="Write a key insight, code snippet, or reminder..."
              placeholderTextColor={colors.textMuted}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: noteText.trim() ? colors.accent : colors.cardBg,
                  shadowColor: colors.accent,
                },
              ]}
              onPress={handleSave}
              disabled={!noteText.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="save-outline" size={15} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Note</Text>
            </TouchableOpacity>
          </View>

          {/* Existing Notes for Video */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            SAVED MOMENTS ({videoNotes.length})
          </Text>

          <ScrollView style={styles.notesList} showsVerticalScrollIndicator={false}>
            {videoNotes.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="bookmarks-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No notes saved for this video yet. Add one above!
                </Text>
              </View>
            ) : (
              videoNotes.map((note) => (
                <View
                  key={note.id}
                  style={[styles.noteCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider }]}
                >
                  <TouchableOpacity
                    style={styles.noteContentArea}
                    onPress={() => {
                      seekTo(note.timestamp);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.noteTop}>
                      <View style={[styles.jumpBadge, { backgroundColor: 'rgba(255, 0, 51, 0.15)' }]}>
                        <Ionicons name="play" size={10} color={colors.accent} />
                        <Text style={[styles.jumpTime, { color: colors.accent }]}>{note.timeFormatted}</Text>
                      </View>
                      <Text style={[styles.noteDate, { color: colors.textMuted }]}>{note.createdAt}</Text>
                    </View>
                    <Text style={[styles.noteBody, { color: colors.textPrimary }]}>{note.noteText}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.delNoteBtn}
                    onPress={() => removeTimestampNote(note.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  inputHelp: {
    fontSize: 10,
  },
  textInput: {
    fontSize: 13,
    minHeight: 50,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  notesList: {
    maxHeight: 220,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 11,
    textAlign: 'center',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  noteContentArea: {
    flex: 1,
  },
  noteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  jumpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  jumpTime: {
    fontSize: 11,
    fontWeight: '800',
  },
  noteDate: {
    fontSize: 10,
  },
  noteBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  delNoteBtn: {
    padding: 6,
  },
});
