import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { AppTheme } from '../types';

export const SettingsScreen: React.FC = () => {
  const { colors, theme, setTheme, apiSettings, updateApiSettings, downloads } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState(apiSettings.apiKey || '');
  const [apiKeySavedNotice, setApiKeySavedNotice] = useState(false);
  const [sponsorBlockEnabled, setSponsorBlockEnabled] = useState(true);

  const themeOptions: { id: AppTheme; label: string; desc: string; iconColor: string }[] = [
    { id: 'oled-black', label: 'OLED Pitch Black', desc: 'Zero pixel power, YouTube Red glow', iconColor: '#FF0033' },
    { id: 'cyber-neon', label: 'Cyberpunk Neon', desc: 'Electric Cyan & Magenta glow', iconColor: '#00F0FF' },
    { id: 'pro-gold', label: 'Pro Obsidian Gold', desc: 'Luxury Amber & 24K Gold accents', iconColor: '#F59E0B' },
  ];

  const handleSaveApiKey = async () => {
    await updateApiSettings({
      ...apiSettings,
      apiKey: apiKeyInput.trim(),
    });
    setApiKeySavedNotice(true);
    setTimeout(() => setApiKeySavedNotice(false), 2500);
  };

  const handleSetApiMode = async (mode: 'hybrid' | 'piped' | 'official') => {
    await updateApiSettings({
      ...apiSettings,
      mode,
    });
  };

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

        {/* DATA SOURCES & HYBRID PIPELINE */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 18 }]}>
          HYBRID DATA PIPELINE & API
        </Text>
        <View style={[styles.apiCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.apiCardTitle, { color: colors.textPrimary }]}>YouTube Data Provider</Text>
          <Text style={[styles.apiCardDesc, { color: colors.textMuted }]}>
            Choose where live video search results, channel metrics, and recommendations are sourced from.
          </Text>

          <View style={styles.apiModeRow}>
            {[
              { id: 'hybrid', label: '⚡ Hybrid (Auto)' },
              { id: 'piped', label: '🌐 Free Piped' },
              { id: 'official', label: '🔑 Official v3' },
            ].map((m) => {
              const active = apiSettings.mode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.apiModeBtn,
                    {
                      backgroundColor: active ? colors.accent : colors.surfaceSubtle,
                    },
                  ]}
                  onPress={() => handleSetApiMode(m.id as any)}
                >
                  <Text style={[styles.apiModeBtnText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional API key input */}
          {apiSettings.mode === 'official' && (
            <View style={styles.apiKeySection}>
              <Text style={[styles.apiKeyLabel, { color: colors.textSecondary }]}>
                GOOGLE CLOUD YOUTUBE API KEY
              </Text>
              <TextInput
                style={[styles.apiKeyInput, { backgroundColor: colors.surfaceSubtle, color: colors.textPrimary }]}
                placeholder="AIzaSy..."
                placeholderTextColor={colors.textMuted}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.saveKeyBtn, { backgroundColor: colors.accent }]}
                onPress={handleSaveApiKey}
              >
                <Text style={styles.saveKeyBtnText}>Save API Key</Text>
              </TouchableOpacity>
              {apiKeySavedNotice && (
                <Text style={styles.savedNoticeText}>✅ API Key saved to local secure store!</Text>
              )}
            </View>
          )}
        </View>

        {/* PRO MAX POWER TOGGLES */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 18 }]}>
          PRO MAX POWER ENGINE
        </Text>

        {/* SponsorBlock Auto-Skip */}
        <TouchableOpacity
          style={[styles.toggleSettingRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          onPress={() => setSponsorBlockEnabled(!sponsorBlockEnabled)}
          activeOpacity={0.8}
        >
          <View style={styles.toggleSettingLeft}>
            <View style={[styles.toggleIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="flash" size={16} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Auto-Skip Sponsor Segments</Text>
              <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                SponsorBlock integration automatically skips promotions
              </Text>
            </View>
          </View>
          <Ionicons
            name={sponsorBlockEnabled ? 'toggle' : 'toggle-outline'}
            size={28}
            color={sponsorBlockEnabled ? colors.accent : colors.textMuted}
          />
        </TouchableOpacity>

        {/* Permanent Offline Status */}
        <View style={[styles.toggleSettingRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder, marginTop: 8 }]}>
          <View style={styles.toggleSettingLeft}>
            <View style={[styles.toggleIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <MaterialCommunityIcons name="infinity" size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Permanent Vault Guarantee</Text>
              <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                Auto-delete disabled: {downloads.length} videos stored permanently
              </Text>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        </View>

        {/* App Version Info */}
        <View style={styles.versionFooter}>
          <Text style={[styles.versionName, { color: colors.textPrimary }]}>YouTube Pro Max</Text>
          <Text style={[styles.versionTag, { color: colors.textMuted }]}>
            v2.0.0 Ultra Mobile Edition • React Native Expo
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
