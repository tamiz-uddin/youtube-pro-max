import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { VideoFilterSettings } from '../../types';

interface VideoEnhancerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const VideoEnhancerModal: React.FC<VideoEnhancerModalProps> = ({ visible, onClose }) => {
  const { colors, filterSettings, setFilterSettings } = useApp();

  const updateSetting = (key: keyof VideoFilterSettings, value: any) => {
    setFilterSettings({
      ...filterSettings,
      [key]: value,
    });
  };

  const applyPreset = (preset: 'default' | 'cinema' | 'vivid' | 'night') => {
    switch (preset) {
      case 'cinema':
        setFilterSettings({
          brightness: 95,
          contrast: 125,
          saturation: 120,
          sepia: 0,
          invert: false,
          bassBoost: true,
          vocalEnhance: true,
        });
        break;
      case 'vivid':
        setFilterSettings({
          brightness: 110,
          contrast: 130,
          saturation: 160,
          sepia: 0,
          invert: false,
          bassBoost: true,
          vocalEnhance: false,
        });
        break;
      case 'night':
        setFilterSettings({
          brightness: 80,
          contrast: 90,
          saturation: 75,
          sepia: 25,
          invert: false,
          bassBoost: false,
          vocalEnhance: true,
        });
        break;
      case 'default':
        setFilterSettings({
          brightness: 100,
          contrast: 100,
          saturation: 100,
          sepia: 0,
          invert: false,
          bassBoost: false,
          vocalEnhance: false,
        });
        break;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.badgeIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="color-wand" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Video & Audio Enhancer</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Quick Presets */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>QUICK PRESETS</Text>
            <View style={styles.presetRow}>
              {[
                { id: 'cinema', label: '🎬 OLED Cinema' },
                { id: 'vivid', label: '⚡ Vivid HDR' },
                { id: 'night', label: '🌙 Eye Comfort' },
                { id: 'default', label: '↺ Reset' },
              ].map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.presetBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider }]}
                  onPress={() => applyPreset(p.id as any)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetBtnText, { color: colors.textPrimary }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Video Controls */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 16 }]}>
              DISPLAY HARDWARE TUNING
            </Text>

            {/* Brightness */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>Brightness</Text>
                <Text style={[styles.controlValue, { color: colors.accent }]}>{filterSettings.brightness}%</Text>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={() => updateSetting('brightness', Math.max(50, filterSettings.brightness - 10))}
                >
                  <Ionicons name="remove" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceSubtle }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${((filterSettings.brightness - 50) / 100) * 100}%`, backgroundColor: colors.accent },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={() => updateSetting('brightness', Math.min(150, filterSettings.brightness + 10))}
                >
                  <Ionicons name="add" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Contrast */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>Contrast</Text>
                <Text style={[styles.controlValue, { color: colors.accent }]}>{filterSettings.contrast}%</Text>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={() => updateSetting('contrast', Math.max(50, filterSettings.contrast - 10))}
                >
                  <Ionicons name="remove" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceSubtle }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${((filterSettings.contrast - 50) / 100) * 100}%`, backgroundColor: colors.accent },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={() => updateSetting('contrast', Math.min(150, filterSettings.contrast + 10))}
                >
                  <Ionicons name="add" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Saturation */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>Saturation</Text>
                <Text style={[styles.controlValue, { color: colors.accent }]}>{filterSettings.saturation}%</Text>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={() => updateSetting('saturation', Math.max(0, filterSettings.saturation - 20))}
                >
                  <Ionicons name="remove" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceSubtle }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${(filterSettings.saturation / 200) * 100}%`, backgroundColor: colors.accent },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={() => updateSetting('saturation', Math.min(200, filterSettings.saturation + 20))}
                >
                  <Ionicons name="add" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Audio Enhancer Toggles */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 16 }]}>
              PRO AUDIO PROCESSING
            </Text>

            <TouchableOpacity
              style={[
                styles.toggleCard,
                {
                  backgroundColor: filterSettings.bassBoost ? colors.surfaceSubtle : 'transparent',
                  borderColor: filterSettings.bassBoost ? colors.accent : colors.divider,
                },
              ]}
              onPress={() => updateSetting('bassBoost', !filterSettings.bassBoost)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleLeft}>
                <MaterialCommunityIcons
                  name="speaker-wireless"
                  size={20}
                  color={filterSettings.bassBoost ? colors.accent : colors.textMuted}
                />
                <View>
                  <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Dynamic Bass Boost 🔊</Text>
                  <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                    Amplifies low frequencies for explosive audio
                  </Text>
                </View>
              </View>
              <Ionicons
                name={filterSettings.bassBoost ? 'checkbox' : 'square-outline'}
                size={20}
                color={filterSettings.bassBoost ? colors.accent : colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleCard,
                {
                  backgroundColor: filterSettings.vocalEnhance ? colors.surfaceSubtle : 'transparent',
                  borderColor: filterSettings.vocalEnhance ? colors.accent : colors.divider,
                  marginTop: 8,
                },
              ]}
              onPress={() => updateSetting('vocalEnhance', !filterSettings.vocalEnhance)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleLeft}>
                <Ionicons
                  name="mic-outline"
                  size={20}
                  color={filterSettings.vocalEnhance ? colors.accent : colors.textMuted}
                />
                <View>
                  <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Vocal Clarity Equalizer 🎙️</Text>
                  <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                    Sharpens speech and dialogue intelligibility
                  </Text>
                </View>
              </View>
              <Ionicons
                name={filterSettings.vocalEnhance ? 'checkbox' : 'square-outline'}
                size={20}
                color={filterSettings.vocalEnhance ? colors.accent : colors.textMuted}
              />
            </TouchableOpacity>
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
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  controlItem: {
    marginBottom: 14,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  controlValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 10,
    marginTop: 2,
  },
});
