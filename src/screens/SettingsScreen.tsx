import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { AppTheme } from '../types';
import { formatBytes } from '../utils/videoFormat';

export const SettingsScreen: React.FC = () => {
  const { colors, theme, setTheme, downloadedVideos } = useApp();

  const themeOptions: { id: AppTheme; label: string; desc: string; iconColor: string }[] = [
    { id: 'oled-black', label: 'OLED Pitch Black', desc: 'Zero pixel power, YouTube Red glow', iconColor: '#FF0033' },
    { id: 'cyber-neon', label: 'Cyberpunk Neon', desc: 'Electric Cyan & Magenta glow', iconColor: '#00F0FF' },
    { id: 'pro-gold', label: 'Pro Obsidian Gold', desc: 'Luxury Amber & 24K Gold accents', iconColor: '#F59E0B' },
  ];

  const totalBytes = downloadedVideos.reduce((sum, v) => sum + v.fileSizeBytes, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.badgeIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Pro Max Control Center</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Theme Customizer */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>VISUAL THEME ENGINE</Text>
        <View style={styles.themeList}>
          {themeOptions.map((t) => {
            const isSelected = theme === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: isSelected ? colors.surfaceSubtle : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.divider,
                  },
                ]}
                onPress={() => setTheme(t.id)}
                activeOpacity={0.8}
              >
                <View style={styles.themeCardLeft}>
                  <View style={[styles.themeColorDot, { backgroundColor: t.iconColor }]} />
                  <View>
                    <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>{t.label}</Text>
                    <Text style={[styles.themeDesc, { color: colors.textMuted }]}>{t.desc}</Text>
                  </View>
                </View>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={isSelected ? colors.accent : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* STORAGE */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 18 }]}>STORAGE</Text>
        <View style={[styles.toggleSettingRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.toggleSettingLeft}>
            <View style={[styles.toggleIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="folder-open" size={16} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Downloaded videos</Text>
              <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                {downloadedVideos.length} {downloadedVideos.length === 1 ? 'video' : 'videos'} •{' '}
                {formatBytes(totalBytes)}. Kept in app storage until you delete them or uninstall the app.
              </Text>
            </View>
          </View>
        </View>

        {/* App Version Info */}
        <View style={styles.versionFooter}>
          <Text style={[styles.versionName, { color: colors.textPrimary }]}>YouTube Pro Max</Text>
          <Text style={[styles.versionTag, { color: colors.textMuted }]}>
            Offline video player • React Native Expo
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
    padding: 14,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  themeList: {
    gap: 8,
    marginBottom: 10,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeColorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  apiCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  apiCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  apiCardDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  apiModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  apiModeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  apiModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  apiKeySection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  apiKeyLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  apiKeyInput: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 8,
  },
  saveKeyBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveKeyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  savedNoticeText: {
    color: '#10B981',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  toggleSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  toggleSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  versionFooter: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  versionName: {
    fontSize: 13,
    fontWeight: '800',
  },
  versionTag: {
    fontSize: 10,
  },
});
