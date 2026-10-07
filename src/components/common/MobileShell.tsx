import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const MobileShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors, isDeviceFrameActive, toggleDeviceFrame, currentVideo, isPlaying } = useApp();

  // If on native mobile (iOS/Android) or device frame is toggled off on web, render directly
  if (Platform.OS !== 'web' || !isDeviceFrameActive) {
    return <View style={[styles.fullRoot, { backgroundColor: colors.background }]}>{children}</View>;
  }

  // Current time for the status bar
  const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.webBackdrop, { backgroundColor: '#030407' }]}>
      {/* Top Floating Control Bar */}
      <View style={styles.webHeaderBar}>
        <View style={styles.webHeaderLeft}>
          <View style={styles.redDot} />
          <View style={styles.yellowDot} />
          <View style={styles.greenDot} />
          <Text style={styles.webHeaderTitle}>YouTube Pro Max • Mobile Simulator</Text>
        </View>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={toggleDeviceFrame}
          activeOpacity={0.8}
        >
          <Ionicons name="expand" size={14} color="#CBD5E1" />
          <Text style={styles.expandButtonText}>Full Screen Web View</Text>
        </TouchableOpacity>
      </View>

      {/* iPhone 16 Pro Device Frame */}
      <View style={[styles.deviceBezel, { shadowColor: colors.accent }]}>
        {/* Dynamic Island & Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusTime}>{currentTimeStr}</Text>

          {/* Dynamic Island */}
          <View style={styles.dynamicIsland}>
            <View style={styles.islandCameraDot} />
            {currentVideo && (
              <View style={styles.islandNowPlaying}>
                <Ionicons
                  name={isPlaying ? 'musical-notes' : 'pause'}
                  size={10}
                  color={colors.accent}
                />
              </View>
            )}
          </View>

          <View style={styles.statusIcons}>
            <Ionicons name="cellular" size={12} color="#FFFFFF" />
            <Ionicons name="wifi" size={12} color="#FFFFFF" />
            <Ionicons name="battery-full" size={14} color="#FFFFFF" />
          </View>
        </View>

        {/* Inner Screen Content */}
        <View style={[styles.screenContent, { backgroundColor: colors.background }]}>
          {children}
        </View>

        {/* Home Indicator Bar */}
        <View style={styles.homeIndicatorWrapper}>
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webBackdrop: {
    flex: 1,
    width: '100%',
    minHeight: '100vh' as any,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#030407',
  },
  webHeaderBar: {
    width: 440,
    maxWidth: '96%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  webHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  yellowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  webHeaderTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E2230',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandButtonText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  deviceBezel: {
    width: 412,
    height: 870,
    maxHeight: '94vh' as any,
    borderRadius: 48,
    backgroundColor: '#16181F',
    borderWidth: 8,
    borderColor: '#242735',
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 20,
  },
  statusBar: {
    height: 44,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    zIndex: 50,
  },
  statusTime: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    width: 60,
  },
  dynamicIsland: {
    width: 110,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#1F222E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  islandCameraDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A0C14',
    borderWidth: 1,
    borderColor: '#282C3D',
  },
  islandNowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 60,
    justifyContent: 'flex-end',
  },
  screenContent: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  homeIndicatorWrapper: {
    height: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  homeIndicator: {
    width: 130,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
