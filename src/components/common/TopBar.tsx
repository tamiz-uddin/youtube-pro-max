import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const TopBar: React.FC = () => {
  const { colors, setActiveTab, toggleDeviceFrame, isDeviceFrameActive } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
      {/* Brand Logo & Pro Max Badge */}
      <TouchableOpacity
        style={styles.logoRow}
        onPress={() => setActiveTab('home')}
        activeOpacity={0.8}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
        </View>
        <Text style={[styles.brandText, { color: colors.textPrimary }]}>
          YouTube
        </Text>
        <View style={[styles.proBadge, { backgroundColor: colors.accent, shadowColor: colors.accent }]}>
          <Text style={styles.proBadgeText}>PRO MAX</Text>
        </View>
      </TouchableOpacity>

      {/* Action Icons */}
      <View style={styles.actionRow}>
        {/* Toggle Mobile Frame (on Web) */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
            onPress={toggleDeviceFrame}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDeviceFrameActive ? 'phone-portrait' : 'expand'}
              size={18}
              color={isDeviceFrameActive ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
          onPress={() => setActiveTab('download')}
          activeOpacity={0.7}
          accessibilityLabel="Search YouTube to download"
        >
          <Ionicons name="search" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FF0033',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF0033',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  brandText: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
