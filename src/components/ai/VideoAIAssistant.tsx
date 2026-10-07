import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { VideoItem } from '../../types';

interface VideoAIAssistantProps {
  visible: boolean;
  onClose: () => void;
  video: VideoItem;
}

export const VideoAIAssistant: React.FC<VideoAIAssistantProps> = ({ visible, onClose, video }) => {
  const { colors, seekTo } = useApp();
  const [activeTab, setActiveTab] = useState<'summary' | 'chapters' | 'chat' | 'creator'>('summary');
  const [userQuery, setUserQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'ai'; text: string; time: string }[]
  >([
    {
      sender: 'ai',
      text: `Hello! I have fully indexed "${video.title}". What would you like to know about this video?`,
      time: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (textToSend?: string) => {
    const q = textToSend || userQuery.trim();
    if (!q) return;

    const newMsg = { sender: 'user' as const, text: q, time: 'Just now' };
    setChatMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setUserQuery('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = `Based on the key segments of "${video.title}", the creator highlights that breakthrough efficiency is achieved by modular architectures and pipelined streaming models.`;
      const lower = q.toLowerCase();
      if (lower.includes('sponsor') || lower.includes('ad')) {
        reply = `YouTube Pro Max detected a sponsor segment between 02:00 and 02:25. The auto-skip engine will seamlessly fast-forward through it!`;
      } else if (lower.includes('conclusion') || lower.includes('summary')) {
        reply = `The conclusion emphasizes that next-generation tooling empowers users with 10x faster workflows and zero manual overhead.`;
      } else if (lower.includes('download') || lower.includes('offline')) {
        reply = `You can download this video in up to 1080p Ultra HD right from the player! YouTube Pro Max guarantees it will NEVER auto-delete or expire.`;
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply, time: 'Just now' }]);
      setIsTyping(false);
    }, 700);
  };

  const viralTitles = [
    { title: `Why Everyone is WRONG About ${video.title.split(':')[0]}!`, score: 98 },
    { title: `I Tested ${video.title.split(' ')[0]} For 30 Days (SHOCKING Results)`, score: 95 },
    { title: `The 2026 Breakthrough Nobody is Talking About`, score: 92 },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.aiIconBadge, { backgroundColor: colors.secondaryAccent }]}>
                <MaterialCommunityIcons name="robot" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>YouTube Pro Max AI</Text>
                <Text style={[styles.subTitle, { color: colors.textMuted }]}>Neural Video Intelligence</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Sub Navigation Tabs */}
          <View style={[styles.tabBar, { backgroundColor: colors.surfaceSubtle }]}>
            {[
              { id: 'summary', label: 'Summary', icon: 'document-text-outline' },
              { id: 'chapters', label: 'Key Moments', icon: 'list-outline' },
              { id: 'chat', label: 'Ask AI', icon: 'chatbubbles-outline' },
              { id: 'creator', label: 'Creator Tools', icon: 'sparkles-outline' },
            ].map((t) => {
              const active = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.tabItem,
                    active && { backgroundColor: colors.surface, shadowColor: colors.accent },
                  ]}
                  onPress={() => setActiveTab(t.id as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={t.icon as any}
                    size={14}
                    color={active ? colors.accent : colors.textMuted}
                  />
                  <Text style={[styles.tabItemText, { color: active ? colors.textPrimary : colors.textMuted }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tab 1: AI Summary */}
          {activeTab === 'summary' && (
            <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
              <View style={[styles.tldrBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                <View style={styles.tldrHeader}>
                  <Ionicons name="flash" size={16} color={colors.secondaryAccent} />
                  <Text style={[styles.tldrTitle, { color: colors.secondaryAccent }]}>EXECUTIVE TL;DR</Text>
                </View>
                <Text style={[styles.tldrBody, { color: colors.textSecondary }]}>
                  {video.description.slice(0, 220)}...
                </Text>
              </View>

              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>KEY TAKEAWAYS</Text>
              {[
                'Identifies the shift towards autonomous execution pipelines and real-time inference.',
                'Examines benchmark performance with over 3.4x faster throughput compared to legacy stacks.',
                'Demonstrates real-world case studies in production environments with zero downtime.',
                'Provides concrete recommendations for upgrading existing infrastructure in 2026.',
              ].map((point, idx) => (
                <View key={idx} style={[styles.pointRow, { backgroundColor: colors.surfaceSubtle }]}>
                  <View style={[styles.pointNumber, { backgroundColor: colors.accent }]}>
                    <Text style={styles.pointNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.pointText, { color: colors.textPrimary }]}>{point}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Tab 2: Smart Chapters */}
          {activeTab === 'chapters' && (
            <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                AI DETECTED MOMENTS (TAP TO SEEK)
              </Text>
              {(video.chapters || [
                { title: 'Opening Overview & Core Concepts', timestamp: 0, timeFormatted: '00:00' },
                { title: 'Technical Architecture Breakdown', timestamp: 90, timeFormatted: '01:30' },
                { title: 'Deep Analysis & Live Demonstration', timestamp: 240, timeFormatted: '04:00' },
                { title: 'Conclusions & Next Steps', timestamp: 420, timeFormatted: '07:00' },
              ]).map((ch, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chapterItem, { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider }]}
                  onPress={() => {
                    seekTo(ch.timestamp);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.chapterTimeBadge, { backgroundColor: colors.accent }]}>
                    <Ionicons name="play" size={11} color="#FFFFFF" />
                    <Text style={styles.chapterTimeText}>{ch.timeFormatted}</Text>
                  </View>
                  <Text style={[styles.chapterTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {ch.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Tab 3: Ask Video AI */}
          {activeTab === 'chat' && (
            <View style={styles.chatContainer}>
              <ScrollView style={styles.chatScroll} showsVerticalScrollIndicator={false}>
                {chatMessages.map((msg, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.chatBubble,
                      msg.sender === 'user'
                        ? [styles.userBubble, { backgroundColor: colors.accent }]
                        : [styles.aiBubble, { backgroundColor: colors.surfaceSubtle }],
                    ]}
                  >
                    <Text style={[styles.chatBubbleText, { color: '#FFFFFF' }]}>{msg.text}</Text>
                  </View>
                ))}
                {isTyping && (
                  <View style={[styles.aiBubble, { backgroundColor: colors.surfaceSubtle, width: 80 }]}>
                    <ActivityIndicator size="small" color={colors.accent} />
                  </View>
                )}
              </ScrollView>

              {/* Quick Prompt Chips */}
              <View style={styles.promptChipsRow}>
                {['Is there a sponsor?', 'Summarize conclusions', 'Download video'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.promptChip, { backgroundColor: colors.surfaceSubtle }]}
                    onPress={() => handleSendMessage(p)}
                  >
                    <Text style={[styles.promptChipText, { color: colors.textSecondary }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chat Input */}
              <View style={[styles.chatInputRow, { borderColor: colors.divider }]}>
                <TextInput
                  style={[styles.chatInput, { color: colors.textPrimary }]}
                  placeholder="Ask anything about this video..."
                  placeholderTextColor={colors.textMuted}
                  value={userQuery}
                  onChangeText={setUserQuery}
                  onSubmitEditing={() => handleSendMessage()}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: colors.accent }]}
                  onPress={() => handleSendMessage()}
                  disabled={!userQuery.trim()}
                >
                  <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tab 4: Creator Tools */}
          {activeTab === 'creator' && (
            <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                HIGH CTR VIRAL TITLE PREDICTOR
              </Text>
              {viralTitles.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.viralTitleCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider }]}
                >
                  <View style={styles.viralScoreBadge}>
                    <Text style={styles.viralScoreText}>{item.score}% CTR</Text>
                  </View>
                  <Text style={[styles.viralTitleText, { color: colors.textPrimary }]}>{item.title}</Text>
                </View>
              ))}

              <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 14 }]}>
                OPTIMIZED SEO HASHTAGS
              </Text>
              <View style={styles.tagsContainer}>
                {['#tech2026', '#aiagents', '#promax', '#software', '#deepdive', '#quantum', '#automation'].map((tag) => (
                  <View key={tag} style={[styles.tagBadge, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.tagBadgeText, { color: colors.accent }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
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
    height: '82%',
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 10,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 9,
  },
  tabItemText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  tldrBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  tldrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tldrTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tldrBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  pointNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  pointNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  pointText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  chapterTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chapterTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chapterTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  chatContainer: {
    flex: 1,
  },
  chatScroll: {
    flex: 1,
    marginBottom: 8,
  },
  chatBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  chatBubbleText: {
    fontSize: 12,
    lineHeight: 18,
  },
  promptChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  promptChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  promptChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chatInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viralTitleCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    position: 'relative',
  },
  viralScoreBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  viralScoreText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  viralTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
