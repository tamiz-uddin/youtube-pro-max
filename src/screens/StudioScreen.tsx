import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useApp } from '../context/AppContext';
import { VideoItem } from '../types';
import { youtubeService } from '../services/youtubeService';

export const StudioScreen: React.FC = () => {
  const {
    colors,
    studioAnalytics,
    userUploadedVideos,
    uploadNewVideo,
    importYoutubeVideo,
    deleteUserVideo,
    playVideo,
  } = useApp();

  // Modal & Tab State
  const [showModal, setShowModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'youtube' | 'device'>('youtube');

  // YouTube Importer State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [fetchedVideo, setFetchedVideo] = useState<VideoItem | null>(null);
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  // Device Video Picker State
  const [deviceVideoUri, setDeviceVideoUri] = useState<string | null>(null);
  const [deviceVideoDuration, setDeviceVideoDuration] = useState<number | null>(null);
  const [deviceVideoName, setDeviceVideoName] = useState<string>('');
  const [deviceThumbnail, setDeviceThumbnail] = useState<string>(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop'
  );
  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localCategory, setLocalCategory] = useState('Technology');
  const [isUploading, setIsUploading] = useState(false);

  const maxViews = Math.max(
    ...studioAnalytics.viewsHistory.map((d: { day: string; views: number }) => d.views),
    1
  );

  // Handle YouTube URL Resolution
  const handleFetchYoutube = async () => {
    if (!youtubeUrl.trim()) {
      Alert.alert('Please enter a YouTube URL', 'Paste a link like https://youtube.com/watch?v=... or https://youtu.be/...');
      return;
    }

    setIsFetchingMetadata(true);
    setImportStatusMsg(null);
    try {
      const resolved = await youtubeService.resolveYoutubeUrl(youtubeUrl.trim());
      if (resolved) {
        setFetchedVideo(resolved);
        setImportStatusMsg('Metadata fetched successfully!');
      } else {
        Alert.alert('Invalid URL', 'Could not detect a valid YouTube video ID from the provided link.');
      }
    } catch {
      Alert.alert('Error', 'Failed to fetch YouTube metadata. Check your internet connection.');
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  // Confirm YouTube Video Import
  const handleConfirmImport = async () => {
    if (!fetchedVideo) return;

    try {
      await importYoutubeVideo(fetchedVideo);
      Alert.alert(
        'Video Imported!',
        `"${fetchedVideo.title}" has been saved to your local Library & Offline Vault.`,
        [
          {
            text: 'Play Now',
            onPress: () => {
              setShowModal(false);
              playVideo(fetchedVideo);
            },
          },
          {
            text: 'Done',
            onPress: () => {
              setShowModal(false);
            },
          },
        ]
      );
      setYoutubeUrl('');
      setFetchedVideo(null);
    } catch (err) {
      Alert.alert('Import Failed', 'Unable to import video to local storage.');
    }
  };

  // Pick Video from Device Gallery
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Permission to access media library is required to select local videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setDeviceVideoUri(asset.uri);
        setDeviceVideoDuration(asset.duration ? Math.round(asset.duration / 1000) : 180);
        setDeviceVideoName(asset.fileName || 'device_video.mp4');
        if (!localTitle) {
          const autoName = asset.fileName ? asset.fileName.replace(/\.[^/.]+$/, '') : 'My Local Video';
          setLocalTitle(autoName);
        }
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
      // Fallback to Document Picker if image picker encounters device issue
      handlePickFromFiles();
    }
  };

  // Pick Video using Document Picker
  const handlePickFromFiles = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setDeviceVideoUri(file.uri);
        setDeviceVideoName(file.name);
        setDeviceVideoDuration(300);
        if (!localTitle) {
          setLocalTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open file selector.');
    }
  };

  // Confirm Device Video Upload
  const handleConfirmDeviceUpload = async () => {
    if (!deviceVideoUri) {
      Alert.alert('No Video Selected', 'Please select a video from your gallery or files first.');
      return;
    }
    if (!localTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your video.');
      return;
    }

    setIsUploading(true);
    try {
      const durationSeconds = deviceVideoDuration || 180;
      const mins = Math.floor(durationSeconds / 60);
      const secs = durationSeconds % 60;
      const durationFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      await uploadNewVideo({
        title: localTitle.trim(),
        description: localDescription.trim() || 'Uploaded directly from device storage.',
        thumbnail: deviceThumbnail,
        videoUrl: deviceVideoUri,
        channelTitle: 'Your Pro Max Studio',
        channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        channelSubscribers: 'Pro Max Creator',
        channelVerified: true,
        duration: durationFormatted,
        durationSeconds,
        category: localCategory,
        publishedAt: 'Just now',
      });

      Alert.alert('Video Added!', 'Your video has been added to your local studio and library.');
      setDeviceVideoUri(null);
      setLocalTitle('');
      setLocalDescription('');
      setShowModal(false);
    } catch (err) {
      Alert.alert('Upload Failed', 'Could not save video.');
    } finally {
      setIsUploading(false);
    }
  };

  // Confirm Delete
  const handleDelete = (video: VideoItem) => {
    Alert.alert(
      'Remove Video',
      `Are you sure you want to delete "${video.title}" from your studio and storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteUserVideo(video.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Studio Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.studioBadge, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons name="view-dashboard" size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Creator Studio Pro Max</Text>
            <Text style={[styles.subTitle, { color: colors.textMuted }]}>Local Content & Import Hub</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.uploadHeaderBtn, { backgroundColor: colors.accent }]}
          onPress={() => {
            setShowModal(true);
            setActiveModalTab('youtube');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={16} color="#FFFFFF" />
          <Text style={styles.uploadHeaderBtnText}>Add Video</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Quick Action Banner */}
        <View style={[styles.actionBanner, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>Import & Store Videos</Text>
          <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
            Add any YouTube video via link or upload offline videos directly from your phone.
          </Text>

          <View style={styles.bannerBtnRow}>
            <TouchableOpacity
              style={[styles.bannerBtn, { backgroundColor: colors.accent }]}
              onPress={() => {
                setActiveModalTab('youtube');
                setShowModal(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="link" size={16} color="#FFFFFF" />
              <Text style={styles.bannerBtnText}>Import YouTube URL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bannerBtn, { backgroundColor: colors.surface, borderColor: colors.accent, borderWidth: 1 }]}
              onPress={() => {
                setActiveModalTab('device');
                setShowModal(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="folder-open" size={16} color={colors.accent} />
              <Text style={[styles.bannerBtnText, { color: colors.accent }]}>Device Upload</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 28-Day Key Metrics Grid */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>STUDIO OVERVIEW</Text>
        <View style={styles.metricsGrid}>
          {/* Views */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.metricCardTop}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Views</Text>
              <Ionicons name="trending-up" size={16} color="#10B981" />
            </View>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              {studioAnalytics.views28d.toLocaleString()}
            </Text>
            <Text style={styles.growthGreen}>+{studioAnalytics.viewsGrowth}% vs prev 28d</Text>
          </View>

          {/* Stored Videos */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.metricCardTop}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Saved Videos</Text>
              <Ionicons name="film" size={16} color="#3B82F6" />
            </View>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              {userUploadedVideos.length}
            </Text>
            <Text style={styles.growthGreen}>Device Storage Active</Text>
          </View>

          {/* Subscribers */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.metricCardTop}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Subscribers</Text>
              <Ionicons name="people" size={16} color={colors.secondaryAccent} />
            </View>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              {studioAnalytics.subscribers.toLocaleString()}
            </Text>
            <Text style={styles.growthGreen}>+{studioAnalytics.subscribersGrowth}%</Text>
          </View>

          {/* Estimated Revenue */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.metricCardTop}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Est. Value</Text>
              <Ionicons name="cash" size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
              ${studioAnalytics.estimatedRevenue.toFixed(2)}
            </Text>
            <Text style={styles.growthGreen}>Ad-Free Vault</Text>
          </View>
        </View>

        {/* 7-Day Performance Bar Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Daily Engagement Trend</Text>
          <View style={styles.barChartRow}>
            {studioAnalytics.viewsHistory.map((item: { day: string; views: number }, idx: number) => {
              const barHeight = (item.views / maxViews) * 80;
              return (
                <View key={idx} style={styles.chartCol}>
                  <Text style={[styles.barValueText, { color: colors.textMuted }]}>
                    {Math.round(item.views / 1000)}k
                  </Text>
                  <View style={[styles.barWrapper, { backgroundColor: colors.surfaceSubtle }]}>
                    <View style={[styles.barFill, { height: barHeight, backgroundColor: colors.accent }]} />
                  </View>
                  <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Imported & Stored Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.contentHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginBottom: 0 }]}>
              STORED & IMPORTED VIDEOS ({userUploadedVideos.length})
            </Text>
            <TouchableOpacity onPress={() => setShowModal(true)}>
              <Text style={[styles.addVideoText, { color: colors.accent }]}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {userUploadedVideos.length === 0 ? (
            <View style={[styles.emptyContentBox, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
              <Ionicons name="cloud-download-outline" size={36} color={colors.textMuted} />
              <Text style={[styles.emptyContentTitle, { color: colors.textPrimary }]}>
                No Local Videos Yet
              </Text>
              <Text style={[styles.emptyContentText, { color: colors.textMuted }]}>
                Import any YouTube video link to stream and store locally, or upload any video file directly from your device.
              </Text>
              <TouchableOpacity
                style={[styles.publishFirstBtn, { backgroundColor: colors.accent }]}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.publishFirstBtnText}>Import or Upload Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            userUploadedVideos.map((video: VideoItem) => {
              const isYT = video.id.startsWith('yt-import');
              return (
                <View
                  key={video.id}
                  style={[styles.userVideoItem, { backgroundColor: colors.surface, borderColor: colors.divider }]}
                >
                  <TouchableOpacity
                    style={styles.userVideoMainTouch}
                    onPress={() => playVideo(video)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: video.thumbnail }} style={styles.userVideoThumb} />
                    <View style={styles.userVideoMeta}>
                      <Text style={[styles.userVideoTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <View style={styles.userVideoSubRow}>
                        <View style={[styles.typeBadge, { backgroundColor: isYT ? 'rgba(255, 0, 51, 0.15)' : 'rgba(59, 130, 246, 0.15)' }]}>
                          <Ionicons
                            name={isYT ? 'logo-youtube' : 'phone-portrait'}
                            size={10}
                            color={isYT ? colors.accent : '#3B82F6'}
                          />
                          <Text style={[styles.typeBadgeText, { color: isYT ? colors.accent : '#3B82F6' }]}>
                            {isYT ? 'YouTube' : 'Device'}
                          </Text>
                        </View>
                        <Text style={[styles.userVideoStats, { color: colors.textMuted }]} numberOfLines={1}>
                          {video.duration || '05:00'} • {video.category}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Action buttons */}
                  <View style={styles.videoActionBtns}>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle }]}
                      onPress={() => playVideo(video)}
                    >
                      <Ionicons name="play" size={16} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle }]}
                      onPress={() => handleDelete(video)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Main Import / Upload Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons
                  name={activeModalTab === 'youtube' ? 'logo-youtube' : 'cloud-upload'}
                  size={20}
                  color={colors.accent}
                />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {activeModalTab === 'youtube' ? 'Import YouTube Video' : 'Upload Device Video'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={[styles.tabSwitcher, { backgroundColor: colors.surfaceSubtle }]}>
              <TouchableOpacity
                style={[
                  styles.tabSwitchBtn,
                  activeModalTab === 'youtube' && [styles.tabSwitchBtnActive, { backgroundColor: colors.accent }],
                ]}
                onPress={() => setActiveModalTab('youtube')}
              >
                <Ionicons
                  name="link"
                  size={14}
                  color={activeModalTab === 'youtube' ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabSwitchText,
                    { color: activeModalTab === 'youtube' ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  YouTube Link
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabSwitchBtn,
                  activeModalTab === 'device' && [styles.tabSwitchBtnActive, { backgroundColor: colors.accent }],
                ]}
                onPress={() => setActiveModalTab('device')}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={14}
                  color={activeModalTab === 'device' ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabSwitchText,
                    { color: activeModalTab === 'device' ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  Device Storage
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              {/* === TAB 1: YOUTUBE LINK IMPORTER === */}
              {activeModalTab === 'youtube' && (
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>YOUTUBE VIDEO OR SHORT URL</Text>
                  <View style={[styles.urlInputRow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider }]}>
                    <Ionicons name="link" size={18} color={colors.textMuted} style={styles.inputPrefixIcon} />
                    <TextInput
                      style={[styles.urlInput, { color: colors.textPrimary }]}
                      placeholder="https://youtube.com/watch?v=... or youtu.be/..."
                      placeholderTextColor={colors.textMuted}
                      value={youtubeUrl}
                      onChangeText={setYoutubeUrl}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {youtubeUrl.length > 0 && (
                      <TouchableOpacity onPress={() => setYoutubeUrl('')}>
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.fetchBtn, { backgroundColor: colors.accent }]}
                    onPress={handleFetchYoutube}
                    disabled={isFetchingMetadata}
                    activeOpacity={0.8}
                  >
                    {isFetchingMetadata ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="search" size={16} color="#FFFFFF" />
                        <Text style={styles.fetchBtnText}>Fetch Video Metadata</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Fetched Preview Card */}
                  {fetchedVideo && (
                    <View style={[styles.previewCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.cardBorder }]}>
                      <Image source={{ uri: fetchedVideo.thumbnail }} style={styles.previewThumb} />
                      <View style={styles.previewInfo}>
                        <Text style={[styles.previewTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                          {fetchedVideo.title}
                        </Text>
                        <Text style={[styles.previewChannel, { color: colors.textMuted }]}>
                          Channel: {fetchedVideo.channelTitle}
                        </Text>
                        <View style={styles.previewStatsRow}>
                          <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
                          <Text style={[styles.previewStatText, { color: colors.textMuted }]}>
                            {fetchedVideo.views} views
                          </Text>
                          <Ionicons name="thumbs-up-outline" size={12} color={colors.textMuted} style={{ marginLeft: 8 }} />
                          <Text style={[styles.previewStatText, { color: colors.textMuted }]}>
                            {fetchedVideo.likes} likes
                          </Text>
                        </View>
                      </View>

                      {/* Confirm Import Button */}
                      <TouchableOpacity
                        style={[styles.confirmImportBtn, { backgroundColor: '#10B981' }]}
                        onPress={handleConfirmImport}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="download" size={18} color="#FFFFFF" />
                        <Text style={styles.confirmImportBtnText}>Save & Download to Offline Vault</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {importStatusMsg && (
                    <Text style={[styles.statusMsgText, { color: '#10B981' }]}>{importStatusMsg}</Text>
                  )}
                </View>
              )}

              {/* === TAB 2: DEVICE STORAGE PICKER === */}
              {activeModalTab === 'device' && (
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT VIDEO FILE</Text>
                  <View style={styles.pickerBtnsRow}>
                    <TouchableOpacity
                      style={[styles.pickerBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider }]}
                      onPress={handlePickFromGallery}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="images" size={24} color={colors.accent} />
                      <Text style={[styles.pickerBoxTitle, { color: colors.textPrimary }]}>Photo & Video Gallery</Text>
                      <Text style={[styles.pickerBoxSub, { color: colors.textMuted }]}>MP4, MOV, WebM</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.pickerBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.divider }]}
                      onPress={handlePickFromFiles}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="folder-open" size={24} color="#3B82F6" />
                      <Text style={[styles.pickerBoxTitle, { color: colors.textPrimary }]}>Device File Manager</Text>
                      <Text style={[styles.pickerBoxSub, { color: colors.textMuted }]}>Pick from SD/Storage</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Selected Video Status */}
                  {deviceVideoUri && (
                    <View style={[styles.selectedVideoBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10B981' }]}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.selectedVideoName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {deviceVideoName}
                        </Text>
                        <Text style={[styles.selectedVideoDuration, { color: '#10B981' }]}>
                          Ready to play ({deviceVideoDuration ? `${Math.floor(deviceVideoDuration / 60)}m ${deviceVideoDuration % 60}s` : 'Unknown duration'})
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Title input */}
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>VIDEO TITLE</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surfaceSubtle, color: colors.textPrimary }]}
                    placeholder="Enter video title..."
                    placeholderTextColor={colors.textMuted}
                    value={localTitle}
                    onChangeText={setLocalTitle}
                  />

                  {/* Description input */}
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>DESCRIPTION</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surfaceSubtle, color: colors.textPrimary, minHeight: 60 }]}
                    placeholder="What is this video about?"
                    placeholderTextColor={colors.textMuted}
                    value={localDescription}
                    onChangeText={setLocalDescription}
                    multiline
                  />

                  {/* Category picker */}
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>CATEGORY</Text>
                  <View style={styles.categoryPickerRow}>
                    {['Technology', 'Personal', 'Gaming', 'Music', 'Education'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.catChip,
                          {
                            backgroundColor: localCategory === cat ? colors.accent : colors.surfaceSubtle,
                          },
                        ]}
                        onPress={() => setLocalCategory(cat)}
                      >
                        <Text style={[styles.catChipText, { color: localCategory === cat ? '#FFFFFF' : colors.textSecondary }]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Submit button */}
                  <TouchableOpacity
                    style={[
                      styles.submitPublishBtn,
                      { backgroundColor: deviceVideoUri && localTitle.trim() ? colors.accent : colors.surfaceSubtle },
                    ]}
                    onPress={handleConfirmDeviceUpload}
                    disabled={!deviceVideoUri || !localTitle.trim() || isUploading}
                    activeOpacity={0.8}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                        <Text style={styles.submitPublishBtnText}>Save Video to Pro Max Storage</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
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
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studioBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 10,
  },
  uploadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  uploadHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
    padding: 14,
  },
  actionBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  bannerBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bannerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  growthGreen: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  chartCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  barChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  chartCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  barValueText: {
    fontSize: 9,
    fontWeight: '600',
  },
  barWrapper: {
    width: 14,
    height: 80,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  contentSection: {
    marginBottom: 30,
  },
  contentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addVideoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContentBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyContentTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyContentText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  publishFirstBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  publishFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  userVideoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  userVideoMainTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userVideoThumb: {
    width: 80,
    height: 50,
    borderRadius: 8,
  },
  userVideoMeta: {
    flex: 1,
  },
  userVideoTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  userVideoSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  userVideoStats: {
    fontSize: 10,
  },
  videoActionBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  tabSwitcher: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  tabSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabSwitchBtnActive: {},
  tabSwitchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  inputPrefixIcon: {
    marginRight: 8,
  },
  urlInput: {
    flex: 1,
    fontSize: 13,
  },
  fetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    marginBottom: 14,
  },
  fetchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  previewThumb: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
  previewInfo: {
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  previewChannel: {
    fontSize: 12,
    marginBottom: 6,
  },
  previewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewStatText: {
    fontSize: 11,
  },
  confirmImportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  confirmImportBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statusMsgText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  pickerBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pickerBox: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  pickerBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  pickerBoxSub: {
    fontSize: 10,
  },
  selectedVideoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  selectedVideoName: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectedVideoDuration: {
    fontSize: 11,
    fontWeight: '600',
  },
  formInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitPublishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    marginTop: 8,
  },
  submitPublishBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
