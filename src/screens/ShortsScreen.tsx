import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  Animated,
  TextInput,
  Modal,
  Share,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useApp } from '../context/AppContext';

export const ShortsScreen: React.FC = () => {
  const { colors, shorts, currentShortIndex, setCurrentShortIndex } = useApp();
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentsList, setCommentsList] = useState<{ id: string; author: string; text: string; likes: number }[]>([
    { id: 'sc1', author: 'CyberSamurai', text: 'Bro this is genuinely next level editing 🔥', likes: 420 },
    { id: 'sc2', author: 'CodeQueen', text: 'Watching this on YouTube Pro Max in 4K!', likes: 180 },
  ]);

  const heartScale = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? RNStatusBar.currentHeight || 28 : 0
  );

  const activeShort = shorts[currentShortIndex] || shorts[0];
  const isCurrentLiked = !!likedMap[activeShort.id];

  // Modern Expo Video player for Shorts
  const shortsPlayer = useVideoPlayer(activeShort?.videoUrl ?? null, (p) => {
    p.loop = true;
    p.play();
  });

  const triggerHeartAnimation = () => {
    setShowHeartPop(true);
    setLikedMap((prev) => ({ ...prev, [activeShort.id]: true }));
    heartScale.setValue(0);
    Animated.spring(heartScale, {
      toValue: 1.4,
      friction: 3,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(heartScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowHeartPop(false));
      }, 400);
    });
  };

  const handleNextShort = () => {
    if (currentShortIndex < shorts.length - 1) {
      setCurrentShortIndex(currentShortIndex + 1);
    } else {
      setCurrentShortIndex(0); // loop back
    }
  };

  const handlePrevShort = () => {
    if (currentShortIndex > 0) {
      setCurrentShortIndex(currentShortIndex - 1);
    }
  };

  const handleAddShortComment = () => {
    if (!newComment.trim()) return;
    setCommentsList([
      { id: `c-${Date.now()}`, author: 'You', text: newComment.trim(), likes: 0 },
      ...commentsList,
    ]);
    setNewComment('');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {/* Video Viewport / Portrait player */}
      <TouchableOpacity
        style={styles.videoSurface}
        activeOpacity={1}
        onPress={triggerHeartAnimation}
      >
        {Platform.OS === 'web' ? (
          <video
            src={activeShort.videoUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            autoPlay
            loop
            muted={false}
            playsInline
          />
        ) : (
          <VideoView
            player={shortsPlayer}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            nativeControls={false}
          />
        )}

        {/* Double-tap bursting heart */}
        {showHeartPop && (
          <Animated.View style={[styles.burstHeart, { transform: [{ scale: heartScale }] }]}>
            <Ionicons name="heart" size={100} color="#FF0055" />
          </Animated.View>
        )}

        {/* Top Floating Badge */}
        <View style={[styles.topShortsTag, { top: 14 + topInset }]}>
          <Text style={styles.shortsTagText}>Shorts Pro Max</Text>
          <View style={[styles.redLiveDot, { backgroundColor: colors.accent }]} />
        </View>

        {/* Navigation Arrows for desktop/browser ease */}
        <View style={[styles.navButtons, { top: 20 + topInset }]}>
          <TouchableOpacity
            style={styles.navArrowBtn}
            onPress={handlePrevShort}
            disabled={currentShortIndex === 0}
          >
            <Ionicons
              name="chevron-up"
              size={24}
              color={currentShortIndex === 0 ? 'rgba(255,255,255,0.2)' : '#FFFFFF'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextShort}>
            <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Right Floating Actions Toolbar */}
        <View style={styles.rightActionsColumn}>
          {/* Like */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setLikedMap((prev) => ({ ...prev, [activeShort.id]: !isCurrentLiked }))}
          >
            <View style={[styles.iconCircle, isCurrentLiked && { backgroundColor: 'rgba(255, 0, 85, 0.3)' }]}>
              <Ionicons
                name={isCurrentLiked ? 'heart' : 'heart-outline'}
                size={26}
                color={isCurrentLiked ? '#FF0055' : '#FFFFFF'}
              />
            </View>
            <Text style={styles.actionCount}>{activeShort.likes}</Text>
          </TouchableOpacity>

          {/* Dislike */}
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="thumbs-down-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCount}>Dislike</Text>
          </TouchableOpacity>

          {/* Comments */}
          <TouchableOpacity style={styles.actionItem} onPress={() => setShowCommentModal(true)}>
            <View style={styles.iconCircle}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCount}>{activeShort.commentsCount}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              Share.share({
                message: `Check out this Short "${activeShort.title}" on YouTube Pro Max!`,
              }).catch(() => {});
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCount}>Share</Text>
          </TouchableOpacity>

          {/* Sound Spinning Disc */}
          <View style={[styles.soundDisc, { borderColor: colors.accent }]}>
            <Ionicons name="musical-notes" size={14} color="#FFFFFF" />
          </View>
        </View>

        {/* Bottom Metadata Info */}
        <View style={styles.bottomOverlay}>
          {/* Channel Row */}
          <View style={styles.channelRow}>
            <Image source={{ uri: activeShort.channelAvatar }} style={styles.channelAvatar} />
            <Text style={styles.channelName}>{activeShort.channelTitle}</Text>
            <TouchableOpacity style={[styles.followBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.followBtnText}>Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Caption */}
          <Text style={styles.captionText} numberOfLines={2}>
            {activeShort.title}
          </Text>

          {/* Sound Track Pill */}
          <View style={styles.soundPill}>
            <Ionicons name="musical-note" size={12} color="#FFFFFF" />
            <Text style={styles.soundText} numberOfLines={1}>
              {activeShort.soundTitle} • {activeShort.soundArtist}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Slide-Up Comments Drawer */}
      <Modal visible={showCommentModal} transparent animationType="slide" onRequestClose={() => setShowCommentModal(false)}>
        <View style={styles.commentModalBackdrop}>
          <View style={[styles.commentCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.commentHeader}>
              <Text style={[styles.commentTitle, { color: colors.textPrimary }]}>Comments ({commentsList.length})</Text>
              <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.commentList}>
              {commentsList.map((c) => (
                <View key={c.id} style={styles.commentRow}>
                  <View style={[styles.commentAvatarMock, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 11 }}>{c.author[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.commentAuthor, { color: colors.textPrimary }]}>{c.author}</Text>
                    <Text style={[styles.commentText, { color: colors.textSecondary }]}>{c.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.commentInputRow, { borderColor: colors.divider }]}>
              <TextInput
                style={[styles.inputField, { color: colors.textPrimary }]}
                placeholder="Add a comment to this short..."
                placeholderTextColor={colors.textMuted}
                value={newComment}
                onChangeText={setNewComment}
                onSubmitEditing={handleAddShortComment}
              />
              <TouchableOpacity
                style={[styles.postBtn, { backgroundColor: colors.accent }]}
                onPress={handleAddShortComment}
                disabled={!newComment.trim()}
              >
                <Ionicons name="send" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoSurface: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstHeart: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    zIndex: 30,
  },
  topShortsTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  shortsTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  redLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  navButtons: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    gap: 6,
    zIndex: 20,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActionsColumn: {
    position: 'absolute',
    bottom: 80,
    right: 12,
    alignItems: 'center',
    gap: 16,
    zIndex: 25,
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    shadowColor: '#000000',
    shadowRadius: 2,
    shadowOpacity: 0.8,
  },
  soundDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 70,
    zIndex: 20,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  channelAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 3,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 3,
  },
  soundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  soundText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  commentModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  commentCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 18,
    maxHeight: '60%',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  commentTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  commentList: {
    gap: 12,
    marginBottom: 16,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatarMock: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAuthor: {
    fontSize: 11,
    fontWeight: '700',
  },
  commentText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 8,
  },
  postBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
