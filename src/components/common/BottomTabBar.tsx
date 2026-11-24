import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, colors, notes, downloadJobs } = useApp();

  const totalLibraryItems = notes.length;
  const activeDownloads = downloadJobs.filter((j) => j.status === 'downloading').length;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bottomBarBg,
          borderTopColor: colors.divider,
        },
      ]}
    >
      {/* Home Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab('home')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'home' ? 'home' : 'home-outline'}
          size={22}
          color={activeTab === 'home' ? colors.accent : colors.textMuted}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'home' ? colors.accent : colors.textMuted },
          ]}
        >
          Home
        </Text>
        {activeTab === 'home' && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.accent, shadowColor: colors.accent }]} />
        )}
      </TouchableOpacity>

      {/* Device Videos Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab('device')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'device' ? 'phone-portrait' : 'phone-portrait-outline'}
          size={22}
          color={activeTab === 'device' ? colors.accent : colors.textMuted}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'device' ? colors.accent : colors.textMuted },
          ]}
        >
          Device
        </Text>
        {activeTab === 'device' && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.accent, shadowColor: colors.accent }]} />
        )}
      </TouchableOpacity>

      {/* Download (+) Tab */}
      <TouchableOpacity
        style={styles.centerTabItem}
        onPress={() => setActiveTab('download')}
        activeOpacity={0.8}
      >
        <View style={[styles.centerPlusButton, { backgroundColor: colors.accent, shadowColor: colors.accent }]}>
          <Ionicons name="download" size={24} color="#FFFFFF" />
          {activeDownloads > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.secondaryAccent }]}>
              <Text style={styles.badgeText}>{activeDownloads}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'download' ? colors.accent : colors.textMuted, marginTop: 3 },
          ]}
        >
          Download
        </Text>
      </TouchableOpacity>

      {/* Library Tab with badge */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab('library')}
        activeOpacity={0.7}
      >
        <View style={styles.iconBadgeWrapper}>
          <Ionicons
            name={activeTab === 'library' ? 'folder' : 'folder-outline'}
            size={22}
            color={activeTab === 'library' ? colors.accent : colors.textMuted}
          />
          {totalLibraryItems > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{totalLibraryItems}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'library' ? colors.accent : colors.textMuted },
          ]}
        >
          Library
        </Text>
        {activeTab === 'library' && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.accent, shadowColor: colors.accent }]} />
        )}
      </TouchableOpacity>

      {/* Settings Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab('settings')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
          size={22}
          color={activeTab === 'settings' ? colors.accent : colors.textMuted}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'settings' ? colors.accent : colors.textMuted },
          ]}
        >
          Pro Max
        </Text>
        {activeTab === 'settings' && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.accent, shadowColor: colors.accent }]} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingBottom: 4,
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  centerPlusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    width: 16,
    height: 3,
    borderRadius: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  iconBadgeWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
