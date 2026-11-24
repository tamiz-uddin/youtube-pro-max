import React from 'react';
import { View, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { MobileShell } from './src/components/common/MobileShell';
import { TopBar } from './src/components/common/TopBar';
import { BottomTabBar } from './src/components/common/BottomTabBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { DownloadScreen } from './src/screens/DownloadScreen';
import { DeviceScreen } from './src/screens/DeviceScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ProMaxPlayer } from './src/components/player/ProMaxPlayer';
import { MiniPlayer } from './src/components/player/MiniPlayer';

const MainAppContent: React.FC = () => {
  const { activeTab, colors } = useApp();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? RNStatusBar.currentHeight || 28 : 0
  );

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'download':
        return <DownloadScreen />;
      case 'device':
        return <DeviceScreen />;
      case 'library':
        return <LibraryScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
          paddingTop: topInset,
        },
      ]}
    >
      <StatusBar style="light" />

      <TopBar />

      {/* Active Screen View */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Persistent Floating Mini-Player */}
      <MiniPlayer />

      {/* Bottom Navigation Bar */}
      <BottomTabBar />

      {/* Full-Screen Pro Max Video Player Modal */}
      <ProMaxPlayer />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MobileShell>
          <MainAppContent />
        </MobileShell>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  screenContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
});
