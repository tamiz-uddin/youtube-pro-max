import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { YouTubeSearchResult, youtubeService } from '../services/youtubeService';
import { DownloadSheet } from '../components/download/DownloadSheet';
import { DownloadJobsList } from '../components/download/DownloadJobsList';
import { formatClock, formatCount } from '../utils/videoFormat';

const looksLikeLink = (text: string) => /youtu\.?be/i.test(text);

export const DownloadScreen: React.FC = () => {
  const { colors, isYoutubeVideoDownloaded } = useApp();
  const [input, setInput] = useState('');
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sheetVideoId, setSheetVideoId] = useState<string | null>(null);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text) return;
    Keyboard.dismiss();
    setMessage(null);

    // A pasted link goes straight to the download sheet
    if (looksLikeLink(text)) {
      const id = youtubeService.extractVideoId(text);
      if (id) setSheetVideoId(id);
      else setMessage('That link does not contain a YouTube video ID.');
      return;
    }

    setIsSearching(true);
    try {
      const found = await youtubeService.searchVideos(text);
      setResults(found);
      if (found.length === 0) setMessage('No videos found.');
    } catch (err) {
      setResults([]);
      setMessage(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Ionicons name={looksLikeLink(input) ? 'link' : 'search'} size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Search YouTube or paste a video link"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          returnKeyType={looksLikeLink(input) ? 'go' : 'search'}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {input.length > 0 && (
          <TouchableOpacity onPress={() => setInput('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.goBtn, { backgroundColor: colors.accent }]}
        onPress={handleSubmit}
        activeOpacity={0.85}
      >
        <Text style={styles.goBtnText}>{looksLikeLink(input) ? 'Get video' : 'Search'}</Text>
      </TouchableOpacity>

      <FlatList
        data={results}
        keyExtractor={(item) => item.youtubeId}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <DownloadJobsList />
            {isSearching && <ActivityIndicator color={colors.accent} style={styles.spinner} />}
            {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
          </>
        }
        renderItem={({ item }) => {
          const saved = isYoutubeVideoDownloaded(item.youtubeId);
          return (
            <TouchableOpacity
              style={[styles.resultRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              onPress={() => setSheetVideoId(item.youtubeId)}
              activeOpacity={0.85}
            >
              <View>
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
                {item.durationSeconds > 0 && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{formatClock(item.durationSeconds)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.resultBody}>
                <Text style={[styles.resultTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.resultMeta, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.channelTitle}
                </Text>
                <Text style={[styles.resultMeta, { color: colors.textMuted }]} numberOfLines={1}>
                  {formatCount(item.views)} views • {item.uploadedDate}
                </Text>
              </View>
              <Ionicons
                name={saved ? 'checkmark-circle' : 'download-outline'}
                size={22}
                color={saved ? colors.success : colors.accent}
              />
            </TouchableOpacity>
          );
        }}
      />

      <DownloadSheet youtubeId={sheetVideoId} onClose={() => setSheetVideoId(null)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  goBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  goBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 120,
  },
  spinner: {
    marginVertical: 20,
  },
  message: {
    textAlign: 'center',
    fontSize: 13,
    marginVertical: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  thumb: {
    width: 128,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  durationBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  resultBody: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  resultMeta: {
    fontSize: 11,
    marginTop: 2,
  },
});
