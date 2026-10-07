import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ visible, onClose }) => {
  const { colors, sleepTimerRemaining, setSleepTimer } = useApp();

  const presets = [
    { label: '15 Minutes', minutes: 15 },
    { label: '30 Minutes', minutes: 30 },
    { label: '45 Minutes', minutes: 45 },
    { label: '60 Minutes (1 Hour)', minutes: 60 },
  ];

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.badgeIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="moon" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Sleep Timer</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Active status */}
          {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
            <View style={[styles.activeStatusBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#F59E0B' }]}>
              <Ionicons name="time-outline" size={18} color="#F59E0B" />
              <Text style={styles.activeStatusText}>
                Auto-pausing in: <Text style={{ fontWeight: '800', color: '#F59E0B' }}>{formatRemaining(sleepTimerRemaining)}</Text>
              </Text>
            </View>
          )}

          {/* Preset Buttons */}
          <View style={styles.optionsList}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset.minutes}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.divider,
                  },
                ]}
                onPress={() => {
                  setSleepTimer(preset.minutes);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>{preset.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}

            {sleepTimerRemaining !== null && (
              <TouchableOpacity
                style={[styles.turnOffBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}
                onPress={() => {
                  setSleepTimer(null);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="stop-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.turnOffText}>Turn Off Sleep Timer</Text>
              </TouchableOpacity>
            )}
          </View>
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
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  activeStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  activeStatusText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  optionsList: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  turnOffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  turnOffText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
