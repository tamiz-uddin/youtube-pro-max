import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

interface ABLoopModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ABLoopModal: React.FC<ABLoopModalProps> = ({ visible, onClose }) => {
  const { colors, abLoop, setABLoop, currentTime, duration, seekTo } = useApp();

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSetPointA = () => {
    const currentA = Math.round(currentTime);
    const end = abLoop ? Math.max(currentA + 5, abLoop.end) : Math.min(duration || 60, currentA + 10);
    setABLoop({
      enabled: true,
      start: currentA,
      end,
    });
  };

  const handleSetPointB = () => {
    const currentB = Math.round(currentTime);
    const start = abLoop ? Math.min(abLoop.start, Math.max(0, currentB - 5)) : Math.max(0, currentB - 10);
    setABLoop({
      enabled: true,
      start,
      end: currentB,
    });
  };

  const handleToggle = () => {
    if (abLoop) {
      setABLoop({ ...abLoop, enabled: !abLoop.enabled });
    } else {
      const start = Math.max(0, Math.round(currentTime) - 5);
      const end = Math.round(currentTime) + 10;
      setABLoop({ enabled: true, start, end });
    }
  };

  const handleClear = () => {
    setABLoop(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.badgeIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="repeat" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>A-B Section Repeater</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Set precise loop markers to continuously replay any tutorial step, guitar solo, or sports play.
          </Text>

          {/* Current Position */}
          <View style={[styles.currentPosRow, { backgroundColor: colors.surfaceSubtle }]}>
            <Text style={[styles.posLabel, { color: colors.textSecondary }]}>Playhead Position:</Text>
            <Text style={[styles.posValue, { color: colors.accent }]}>{formatSeconds(currentTime)}</Text>
          </View>

          {/* Markers */}
          <View style={styles.markerContainer}>
            {/* Point A */}
            <View style={[styles.markerBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider }]}>
              <View style={styles.markerHeader}>
                <Text style={[styles.markerTitle, { color: colors.textPrimary }]}>Point A (Start)</Text>
                <Text style={[styles.markerTime, { color: colors.accent }]}>
                  {abLoop ? formatSeconds(abLoop.start) : '--:--'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.setBtn, { backgroundColor: colors.accent }]}
                onPress={handleSetPointA}
                activeOpacity={0.8}
              >
                <Ionicons name="flag-outline" size={14} color="#FFFFFF" />
                <Text style={styles.setBtnText}>Set A Here</Text>
              </TouchableOpacity>
            </View>

            {/* Point B */}
            <View style={[styles.markerBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider }]}>
              <View style={styles.markerHeader}>
                <Text style={[styles.markerTitle, { color: colors.textPrimary }]}>Point B (End)</Text>
                <Text style={[styles.markerTime, { color: colors.accent }]}>
                  {abLoop ? formatSeconds(abLoop.end) : '--:--'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.setBtn, { backgroundColor: colors.accent }]}
                onPress={handleSetPointB}
                activeOpacity={0.8}
              >
                <Ionicons name="flag" size={14} color="#FFFFFF" />
                <Text style={styles.setBtnText}>Set B Here</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Status & Action */}
          <View style={styles.actionsRow}>
            {abLoop && (
              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={handleClear}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>Clear</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.mainActionBtn,
                {
                  backgroundColor: abLoop?.enabled ? colors.accent : colors.surfaceSubtle,
                  shadowColor: colors.accent,
                },
              ]}
              onPress={handleToggle}
              activeOpacity={0.8}
            >
              <Ionicons
                name={abLoop?.enabled ? 'refresh-circle' : 'play-circle-outline'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.mainActionText}>
                {abLoop?.enabled ? 'Loop Active (Tap to Pause)' : 'Activate Loop'}
              </Text>
            </TouchableOpacity>
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
    marginBottom: 8,
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
  subtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  currentPosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  posLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  posValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  markerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  markerBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  markerHeader: {
    marginBottom: 10,
  },
  markerTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  markerTime: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  setBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  setBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  mainActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
