import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { SkillBadge } from '../components/SkillBadge';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { AppStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { getMessages, sendMessage, getMatchProfile, unmatchUser, blockUser, reportUser, markMessagesRead } from '../services/api';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: string;
  senderId: string;
  readAt?: string | null;
  content: string;
  createdAt: string;
}

interface MatchProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string;
  interests: string;
  location: string;
  isPremium: boolean;
  offeredSkills: { name: string }[];
  learningSkills: { name: string }[];
  photos?: { id: string; url: string; sortOrder: number }[];
}

// ─── Typing Indicator Component ─────────────────────────────────────────────

const TypingIndicator = ({ name }: { name: string }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
      );

    animate(dot1, 0).start();
    animate(dot2, 200).start();
    animate(dot3, 400).start();
  }, [dot1, dot2, dot3, fadeIn]);

  const dotStyle = (anim: Animated.Value) => ({
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: 2,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <Animated.View style={[styles.typingContainer, { opacity: fadeIn }]}>
      <Text style={styles.typingName}>{name} está escribiendo</Text>
      <View style={styles.typingBubble}>
        <Animated.View style={dotStyle(dot1)} />
        <Animated.View style={dotStyle(dot2)} />
        <Animated.View style={dotStyle(dot3)} />
      </View>
    </Animated.View>
  );
};

// ─── Animated Message Bubble ────────────────────────────────────────────────

const AnimatedMessage = ({
  item,
  isMe,
  formatTime,
}: {
  item: Message;
  isMe: boolean;
  formatTime: (d: string) => string;
}) => {
  const slideIn = useRef(new Animated.Value(isMe ? 30 : -30)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideIn, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideIn, fadeIn]);

  return (
    <Animated.View
      style={[
        styles.msgRow,
        isMe ? styles.msgRowMe : styles.msgRowThem,
        {
          opacity: fadeIn,
          transform: [{ translateX: slideIn }],
        },
      ]}
    >
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
          {item.content}
        </Text>
        <View style={styles.msgFooter}>
          <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampThem]}>
            {formatTime(item.createdAt)}
          </Text>
          {isMe && (
            <Ionicons
              name={item.readAt ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={item.readAt ? '#60A5FA' : 'rgba(255,255,255,0.5)'}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Main ChatScreen ────────────────────────────────────────────────────────

export const ChatScreen = ({ navigation, route }: Props) => {
  const { matchName, matchId, matchAvatar } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [photoViewer, setPhotoViewer] = useState<{ visible: boolean; index: number }>({ visible: false, index: 0 });
  const listRef = useRef<FlatList>(null);

  const nameParts = matchName.split(' ');

  const loadMessages = useCallback(async () => {
    try {
      const data = await getMessages(matchId);
      setMessages(data);
    } catch (err) {
      console.log('[Chat] Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    loadMessages();
    getMatchProfile(matchId).then(setProfile).catch(() => {});
    markMessagesRead(matchId).catch(() => {});
  }, [loadMessages, matchId]);

  const loadProfile = async () => {
    try {
      const data = await getMatchProfile(matchId);
      setProfile(data);
      setShowProfile(true);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el perfil.');
    }
  };

  const [showUnmatchReasons, setShowUnmatchReasons] = useState(false);

  const unmatchReasons = [
    'No tenemos intereses compatibles',
    'No responde a los mensajes',
    'Comportamiento inapropiado',
    'Ya encontré a mi cofundador/a',
    'Otro motivo',
  ];

  const handleUnmatch = () => {
    setShowUnmatchReasons(true);
  };

  const confirmUnmatch = async (_reason: string) => {
    setShowUnmatchReasons(false);
    try {
      await unmatchUser(matchId);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo deshacer el match.');
    }
  };

  const handleBlock = () => {
    Alert.alert(
      'Bloquear usuario',
      `¿Seguro que quieres bloquear a ${nameParts[0]}? No podrás volver a ver su perfil ni recibir mensajes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = profile?.id;
              if (userId) {
                await blockUser(userId, 'Bloqueado desde chat');
              } else {
                const p = await getMatchProfile(matchId);
                await blockUser(p.id, 'Bloqueado desde chat');
              }
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo bloquear al usuario.');
            }
          },
        },
      ],
    );
  };

  const [showReportReasons, setShowReportReasons] = useState(false);

  const reportReasons = [
    'Spam o publicidad',
    'Contenido ofensivo',
    'Suplantación de identidad',
    'Acoso',
    'Otro motivo',
  ];

  const handleReport = () => {
    setShowReportReasons(true);
  };

  const [showReportConfirm, setShowReportConfirm] = useState(false);

  const confirmReport = async (reason: string) => {
    setShowReportReasons(false);
    try {
      let userId = profile?.id;
      if (!userId) {
        const p = await getMatchProfile(matchId);
        userId = p.id;
        setProfile(p);
      }
      await reportUser(userId!, reason);
      setTimeout(() => setShowReportConfirm(true), 300);
    } catch (err) {
      console.log('[Chat] Report error:', err);
      setTimeout(() => Alert.alert('Error', 'No se pudo enviar la denuncia.'), 300);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      const { userMessage, autoReply } = await sendMessage(matchId, content);
      setMessages((prev) => [...prev, userMessage]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

      // Show typing indicator then auto reply
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, autoReply]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }, 1500 + Math.random() * 2000);
    } catch (err) {
      console.log('[Chat] Error sending message:', err);
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    return <AnimatedMessage item={item} isMe={isMe} formatTime={formatTime} />;
  };

  const headerContent = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerProfile} onPress={loadProfile}>
        <Avatar firstName={nameParts[0] ?? '?'} lastName={nameParts[1] ?? '?'} avatarUrl={matchAvatar} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{matchName}</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerStatus}>En línea</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowMenu(true)}>
        <Ionicons name="ellipsis-vertical" size={22} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {headerContent}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {headerContent}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 && !isTyping ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyAvatarCircle}>
              <Avatar
                firstName={nameParts[0] ?? '?'}
                lastName={nameParts[1] ?? '?'}
                avatarUrl={matchAvatar}
                size={64}
              />
            </View>
            <Text style={styles.emptyTitle}>¡Empezad a hablar!</Text>
            <Text style={styles.emptySubtitle}>
              Envía el primer mensaje a {nameParts[0]} y comienza la conversación
            </Text>
            <View style={styles.suggestionRow}>
              {['¡Hola! 👋', '¿En qué trabajas?', 'Me interesa tu proyecto'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestion}
                  onPress={() => setText(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={
              isTyping ? <TypingIndicator name={nameParts[0]} /> : null
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons name="send" size={20} color={text.trim() ? colors.background : colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); loadProfile(); }}>
              <Ionicons name="person-outline" size={20} color={colors.text} />
              <Text style={styles.menuText}>Ver perfil</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); handleUnmatch(); }}>
              <Ionicons name="heart-dislike-outline" size={20} color={colors.danger} />
              <Text style={[styles.menuText, { color: colors.danger }]}>Deshacer match</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); handleBlock(); }}>
              <Ionicons name="ban-outline" size={20} color={colors.danger} />
              <Text style={[styles.menuText, { color: colors.danger }]}>Bloquear</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); handleReport(); }}>
              <Ionicons name="flag-outline" size={20} color={colors.danger} />
              <Text style={[styles.menuText, { color: colors.danger }]}>Denunciar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report Confirmation Modal */}
      <Modal visible={showReportConfirm} transparent animationType="fade" onRequestClose={() => setShowReportConfirm(false)}>
        <View style={styles.reasonsOverlay}>
          <View style={styles.confirmCard}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            <Text style={styles.confirmTitle}>Denuncia enviada</Text>
            <Text style={styles.confirmText}>
              Gracias por reportar. Nuestro equipo revisará el caso lo antes posible.
            </Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowReportConfirm(false)}>
              <Text style={styles.confirmBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Report Reasons Modal */}
      <Modal visible={showReportReasons} transparent animationType="fade" onRequestClose={() => setShowReportReasons(false)}>
        <TouchableOpacity style={styles.reasonsOverlay} activeOpacity={1} onPress={() => setShowReportReasons(false)}>
          <View style={styles.reasonsCard}>
            <Text style={styles.reasonsTitle}>¿Por qué quieres denunciar?</Text>
            <Text style={styles.reasonsSubtitle}>Tu denuncia será revisada por nuestro equipo</Text>
            {reportReasons.map((reason, i) => (
              <React.Fragment key={reason}>
                {i > 0 && <View style={styles.menuDivider} />}
                <TouchableOpacity style={styles.reasonItem} onPress={() => confirmReport(reason)}>
                  <Text style={styles.reasonText}>{reason}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.reasonCancel} onPress={() => setShowReportReasons(false)}>
              <Text style={styles.reasonCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Unmatch Reasons Modal */}
      <Modal visible={showUnmatchReasons} transparent animationType="fade" onRequestClose={() => setShowUnmatchReasons(false)}>
        <TouchableOpacity style={styles.reasonsOverlay} activeOpacity={1} onPress={() => setShowUnmatchReasons(false)}>
          <View style={styles.reasonsCard}>
            <Text style={styles.reasonsTitle}>¿Por qué quieres deshacer el match?</Text>
            <Text style={styles.reasonsSubtitle}>Se eliminarán todos los mensajes con {nameParts[0]}</Text>
            {unmatchReasons.map((reason, i) => (
              <React.Fragment key={reason}>
                {i > 0 && <View style={styles.menuDivider} />}
                <TouchableOpacity style={styles.reasonItem} onPress={() => confirmUnmatch(reason)}>
                  <Text style={styles.reasonText}>{reason}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.reasonCancel} onPress={() => setShowUnmatchReasons(false)}>
              <Text style={styles.reasonCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Profile Modal */}
      <Modal visible={showProfile} animationType="slide" onRequestClose={() => setShowProfile(false)}>
        <View style={[styles.profileModal, { paddingTop: insets.top }]}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              onPress={() => setShowProfile(false)}
              style={styles.profileCloseBtn}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              activeOpacity={0.6}
            >
              <Ionicons name="close" size={26} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.profileHeaderTitle}>Perfil</Text>
            <View style={styles.profileHeaderSpacer} />
          </View>

          {profile ? (
            <ScrollView contentContainerStyle={styles.profileContent}>
              <View style={styles.profileAvatarSection}>
                <Avatar
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                  avatarUrl={profile.avatarUrl}
                  size={100}
                />
                <Text style={styles.profileName}>
                  {profile.firstName} {profile.lastName}
                  {profile.isPremium ? ' ⭐' : ''}
                </Text>
                {profile.location ? (
                  <View style={styles.profileLocationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.profileLocation}>{profile.location}</Text>
                  </View>
                ) : null}
              </View>

              {profile.photos && profile.photos.length > 0 && (
                <View style={styles.photoGrid}>
                  {profile.photos.map((photo, idx) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={styles.photoThumb}
                      onPress={() => setPhotoViewer({ visible: true, index: idx })}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: photo.url }} style={styles.photoThumbImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {profile.bio ? (
                <View style={styles.profileCard}>
                  <Text style={styles.profileCardTitle}>Sobre mí</Text>
                  <Text style={styles.profileCardText}>{profile.bio}</Text>
                </View>
              ) : null}

              {profile.interests ? (
                <View style={styles.profileCard}>
                  <Text style={styles.profileCardTitle}>Intereses</Text>
                  <Text style={styles.profileCardText}>{profile.interests}</Text>
                </View>
              ) : null}

              {profile.offeredSkills.length > 0 && (
                <View style={styles.profileCard}>
                  <Text style={styles.profileCardTitle}>Habilidades que ofrece</Text>
                  <View style={styles.skillRow}>
                    {profile.offeredSkills.map((s) => (
                      <SkillBadge key={s.name} label={s.name} variant="offer" />
                    ))}
                  </View>
                </View>
              )}

              {profile.learningSkills.length > 0 && (
                <View style={styles.profileCard}>
                  <Text style={styles.profileCardTitle}>Quiere aprender</Text>
                  <View style={styles.skillRow}>
                    {profile.learningSkills.map((s) => (
                      <SkillBadge key={s.name} label={s.name} variant="learn" />
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {/* Fullscreen Photo Viewer (nested so it renders above the profile modal on iOS) */}
          <Modal
            visible={photoViewer.visible}
            transparent={false}
            animationType="fade"
            onRequestClose={() => setPhotoViewer((s) => ({ ...s, visible: false }))}
          >
            <View style={styles.photoViewerContainer}>
              <TouchableOpacity
                onPress={() => setPhotoViewer((s) => ({ ...s, visible: false }))}
                style={[styles.photoViewerClose, { top: insets.top + 12 }]}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                activeOpacity={0.6}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <FlatList
                data={profile?.photos ?? []}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={photoViewer.index}
                getItemLayout={(_, idx) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * idx, index: idx })}
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => (
                  <View style={styles.photoFullWrap}>
                    <Image source={{ uri: item.url }} style={styles.photoFull} resizeMode="contain" />
                  </View>
                )}
              />
            </View>
          </Modal>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: { padding: 6 },
  headerProfile: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  headerStatus: { fontSize: 12, color: colors.success, fontWeight: '500' },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyAvatarCircle: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 36,
    padding: 2,
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  suggestion: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Typing indicator
  typingContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  typingName: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginLeft: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },

  // Messages
  messageList: { padding: spacing.md, gap: spacing.xs },
  msgRow: { marginBottom: 2 },
  msgRowMe: { alignItems: 'flex-end' },
  msgRowThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  bubbleMe: { backgroundColor: colors.pink, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: colors.surfaceLight, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: colors.white },
  bubbleTextThem: { color: colors.text },
  msgFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  timestamp: { fontSize: 11 },
  timestampMe: { color: 'rgba(255,255,255,0.6)' },
  timestampThem: { color: colors.textMuted },

  // Input
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.sm, gap: spacing.sm },
  input: { flex: 1, minHeight: 44, maxHeight: 100, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceLight, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.border },

  // Menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 90, paddingRight: spacing.md },
  menuCard: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, minWidth: 200, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 14 },
  menuText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: colors.border },

  reasonsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  confirmCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center', gap: spacing.md, width: '85%', maxWidth: 320 },
  confirmTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  confirmText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  confirmBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginTop: spacing.sm },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: colors.background },

  reasonsCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, width: '90%', maxWidth: 360, overflow: 'hidden', alignSelf: 'center' },
  reasonsTitle: { fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 4 },
  reasonsSubtitle: { fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  reasonItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 14 },
  reasonText: { fontSize: 15, color: colors.text, flex: 1 },
  reasonCancel: { paddingVertical: 14, alignItems: 'center' },
  reasonCancelText: { fontSize: 15, fontWeight: '600', color: colors.primary },

  // Profile modal
  profileModal: { flex: 1, backgroundColor: colors.background },
  profileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  profileCloseBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  profileHeaderSpacer: { width: 44, height: 44 },
  profileHeaderTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  profileContent: { padding: spacing.lg, gap: spacing.lg },
  profileAvatarSection: { alignItems: 'center', gap: spacing.sm },
  profileName: { fontSize: 24, fontWeight: '800', color: colors.text },
  profileLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileLocation: { fontSize: 14, color: colors.textMuted },
  profileCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  profileCardTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  profileCardText: { fontSize: 15, color: colors.text, lineHeight: 22 },

  // Photo grid (3 cols)
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  photoThumb: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.xs * 2) / 3,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photoThumbImage: { width: '100%', height: '100%' },

  // Fullscreen viewer
  photoViewerContainer: { flex: 1, backgroundColor: '#000' },
  photoViewerClose: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  photoFullWrap: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFull: { width: SCREEN_WIDTH, height: '100%' },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
