import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { youtubeService } from '../../services/youtubeService';
import { VideoItem } from '../../types';

export const SearchModal: React.FC = () => {
  const { isSearchModalOpen, setIsSearchModalOpen, colors, playVideo, apiSettings } = useApp();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? RNStatusBar.currentHeight || 28 : 0
  );
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSugg = async () => {
      const suggs = await youtubeService.getSuggestions(query || '');
      if (isMounted) {
        setSuggestions(suggs);
      }
    };
    fetchSugg();
    return () => {
      isMounted = false;
    };
  }, [query]);

  const executeSearch = async (searchTerm: string) => {
    setQuery(searchTerm);
    setLoading(true);
    setHasSearched(true);
    const searchRes = await youtubeService.searchVideos({
      query: searchTerm,
      mode: apiSettings.mode,
      apiKey: apiSettings.apiKey,
    });
    setResults(searchRes);
    setLoading(false);
  };

  const handleSelectVideo = (video: VideoItem) => {
    setIsSearchModalOpen(false);
    playVideo(video);
  };

  return (
    <Modal visible={isSearchModalOpen} animationType="fade" onRequestClose={() => setIsSearchModalOpen(false)}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Search Header Bar */}
        <View
          style={[
            styles.searchBarRow,
            {
              borderBottomColor: colors.divider,
              paddingTop: topInset + 6,
              height: 56 + topInset,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setIsSearchModalOpen(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={[styles.searchInputWrapper, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Search YouTube Pro Max..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => executeSearch(query)}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchActionBtn, { backgroundColor: colors.accent }]}
            onPress={() => executeSearch(query)}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Querying Hybrid YouTube Intelligence...
              </Text>
            </View>
          ) : hasSearched ? (
            <View style={styles.resultsContainer}>
              <Text style={[styles.resultsHeader, { color: colors.textSecondary }]}>
                SEARCH RESULTS ({results.length})
              </Text>

              {results.length === 0 ? (
                <View style={styles.centerBox}>
                  <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching videos found.</Text>
                </View>
              ) : (
                results.map((video) => (
                  <TouchableOpacity
                    key={video.id}
                    style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                    onPress={() => handleSelectVideo(video)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: video.thumbnail }} style={styles.resultThumb} />
                    <View style={styles.resultInfo}>
                      <Text style={[styles.resultTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <Text style={[styles.resultChannel, { color: colors.textMuted }]} numberOfLines={1}>
                        {video.channelTitle} • {video.views} views
                      </Text>
                      <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceSubtle }]}>
                        <Text style={[styles.categoryBadgeText, { color: colors.accent }]}>{video.category}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : (
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsHeader, { color: colors.textSecondary }]}>TRENDING SEARCHES</Text>
              {suggestions.map((sug, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.suggestionItem, { borderBottomColor: colors.divider }]}
                  onPress={() => executeSearch(sug)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trending-up" size={16} color={colors.accent} />
                  <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{sug}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  searchInputWrapper: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  searchActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
  },
  suggestionsContainer: {
    padding: 16,
  },
  suggestionsHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 16,
  },
  resultsHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  resultCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  resultThumb: {
    width: 120,
    height: 80,
    backgroundColor: '#000000',
  },
  resultInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 4,
  },
  resultChannel: {
    fontSize: 10,
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
