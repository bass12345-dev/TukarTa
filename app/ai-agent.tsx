import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  ChevronLeft,
  Music,
  Send,
  UserPlus,
  X,
  History,
  Plus,
  Circle,
  CheckCircle,
  Check,
  Camera,
  Image as ImageIcon,
  Loader2
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { readAsArrayBuffer } from '../utils/file';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/theme';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import {
  useAddSongToSetlist,
  useCreateGig,
  useGigDetails,
  useGigSetlist,
  useInviteMusician,
  useSetlistAI,
  useSetlistSongs,
  useAISessions,
  useAIChatHistory,
  useCreateAISession,
  useAddSongToKnowledge,
  useAddSongsToSetlistBulk
} from '@/utils/hooks/useMusician';
import { useAddMultipleSongs } from '@/utils/hooks/useSongs';
import { supabase } from '../utils/supabase';
import { decode } from 'base64-arraybuffer';

// ─── Types ────────────────────────────────────────────────────────────────────
type Segment = { text: string; highlight?: boolean };
type Message = {
  id: string;
  role: 'assistant' | 'user';
  segments: Segment[];
  badge?: string;
  actions?: any[];
  isAnimating?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rich(parts: (string | { h: string })[]): Segment[] {
  return parts.map((p) =>
    typeof p === 'string' ? { text: p } : { text: p.h, highlight: true }
  );
}

function TypewriterText({ segments, onComplete }: { segments: Segment[]; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  
  useEffect(() => {
    if (index >= segments.length) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      if (charIndex < segments[index].text.length) {
        setCharIndex(prev => prev + 1);
      } else {
        setIndex(prev => prev + 1);
        setCharIndex(0);
      }
    }, 8); // Significantly faster typing speed

    return () => clearTimeout(timer);
  }, [index, charIndex, segments]);

  const displayedSegments = segments.slice(0, index + 1).map((seg, i) => ({
    ...seg,
    text: i === index ? seg.text.slice(0, charIndex) : seg.text
  }));

  return <RichText segments={displayedSegments} isUser={false} />;
}

function parseAIMessage(content: string) {
  const actionRegex = /ACTIONS:\s*(\[.*\])/s;
  const match = content.match(actionRegex);
  let cleanText = content.replace(actionRegex, '').trim();
  let actions = [];
  
  if (match) {
    try {
      actions = JSON.parse(match[1]);
    } catch (e) {
      console.error('Failed to parse AI actions:', e);
    }
  }
  
  return { text: cleanText, actions };
}

// ─── Proposal Card Component ─────────────────────────────────────────────────
function ProposalCard({ action, onApprove, onCancel }: any) {
  const { colors, isDark } = useAppTheme();
  const type = action.type?.toLowerCase() || '';
  const isSong = type === 'add' || type === 'add_song' || type === 'proposal_add_song';
  const isGig = type === 'proposal_create_gig' || type === 'create_gig';
  const isInvite = type === 'proposal_invite' || type === 'invite_musician';
  const isDictionary = type === 'proposal_add_to_dictionary' || type === 'add_to_dictionary' || type === 'proposal_add_to_dictionary';
  const isApplied = action.isApplied;

  return (
    <View 
      style={[
        styles.proposalCard, 
        { 
          backgroundColor: colors.bgCard, 
          borderColor: isApplied ? colors.primary : colors.border 
        },
        isApplied && { backgroundColor: colors.primaryLight }
      ]}
    >
      <View style={styles.proposalContent}>
        <View style={[styles.proposalIconBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          {isSong && <Music size={18} color={colors.primary} />}
          {isGig && <Calendar size={18} color="#F59E0B" />}
          {isInvite && <UserPlus size={18} color={colors.primaryDark} />}
          {isDictionary && <Check size={18} color={colors.primary} />}
        </View>
        
        <View style={styles.proposalTextContainer}>
          <Text style={[styles.proposalTitle, { color: colors.text }]} numberOfLines={1}>
            {isSong ? (action.data?.title || action.title || 'SONG SUGGESTION') : 
             isGig ? (action.data?.name || 'GIG PROPOSAL') : 
             isDictionary ? (action.data?.title || 'ADD TO DICTIONARY') : 
             isInvite ? (action.data?.musicianName || 'RECRUITMENT') : 'PROPOSAL'}
          </Text>
          <Text style={[styles.proposalSubtitle, { color: colors.textDim }]} numberOfLines={1}>
            {isSong ? (action.data?.artist || action.artist || 'Proposed addition') : 
             isGig ? (action.data?.venue || 'Proposed event') : 
             isDictionary ? `${action.data?.artist || ''} • ${action.data?.genre || 'Music'}` : 
             isInvite ? (action.data?.message || 'Proposed recruitment') : 'AI Suggestion'}
          </Text>
        </View>

        <View style={styles.proposalRight}>
          {!isApplied ? (
            <View style={styles.proposalActionsRow}>
              <TouchableOpacity 
                style={[styles.miniCancelBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]} 
                onPress={onCancel}
              >
                <X size={14} color={colors.textDim} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onApprove} 
                style={[styles.approveMiniBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Text style={[styles.approveMiniText, { color: colors.primaryDark }]}>Approve</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.checkboxActive, { backgroundColor: colors.primary }]}>
              <Check size={14} color="#FFF" strokeWidth={3} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  const { colors } = useAppTheme();
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.msgWrapper, styles.msgWrapperAI]}>
      <View style={[styles.msgBubble, styles.msgBubbleAI, { backgroundColor: colors.bgCard, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 16 }]}>
        <Text style={[styles.aiLabel, { color: colors.primary }]}>TUKARTA BOT IS TYPING</Text>
        <View style={styles.dotsRow}>
          <Text style={[styles.typingText, { color: colors.textDim }]}>Thinking{dots}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AIAgentScreen() {
  const router = useRouter();
  const { gigId } = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [lastSyncedSessionId, setLastSyncedSessionId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const isCreatingSession = useRef(false);
  const autoCreatedSessionRef = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  // 1. Data Hooks
  const { data: gig } = useGigDetails(gigId as string);
  const { data: setlist } = useGigSetlist(gigId as string);
  const { data: currentSongs } = useSetlistSongs(setlist?.id);
  
  const { data: sessions, isLoading: isLoadingSessions } = useAISessions();
  const { data: historyMessages, isLoading: isLoadingHistory } = useAIChatHistory(sessionId || undefined);
  const createSession = useCreateAISession();
  const aiMutation = useSetlistAI();
  const addSongToSetlist = useAddSongToSetlist();
  const addSongToKnowledge = useAddSongToKnowledge();
  const createGig = useCreateGig();
  const inviteMusician = useInviteMusician();
  const addSongsBulk = useAddSongsToSetlistBulk();
  const addMultipleSongs = useAddMultipleSongs();

  // 2. Sync history to local state
  useEffect(() => {
    if (historyMessages && !isLoadingHistory && !isCreatingSession.current) {
      const isInitialLoad = !lastSyncedSessionId && messages.length === 0;
      const isSessionSwitch = sessionId && sessionId !== lastSyncedSessionId;
      
      const isFirstLoadForSession = sessionId && sessionId === lastSyncedSessionId && messages.length === 0 && historyMessages.length > 0;

      if (isInitialLoad || isSessionSwitch || isFirstLoadForSession) {
        const mapped: Message[] = historyMessages.map((m: any) => {
          const { text, actions } = parseAIMessage(m.content);
          return {
            id: m.id,
            role: m.role as 'user' | 'assistant',
            segments: [{ text }],
            actions,
            isAnimating: false,
          };
        });
        setMessages(mapped);
        setLastSyncedSessionId(sessionId);
      } else if (isSessionSwitch && historyMessages.length === 0) {
        setMessages([]);
        setLastSyncedSessionId(sessionId);
      }
    }
  }, [historyMessages, isLoadingHistory, sessionId, lastSyncedSessionId, messages.length]);

  // 3. Auto-select or Auto-create session on mount
  useEffect(() => {
    if (!sessionId && sessions !== undefined && !isLoadingSessions) {
      // Find latest session for this gig
      const gigSessions = (sessions as any[] || []).filter((s: any) => s.gig_id === gigId);
      
      if (gigSessions.length > 0) {
        setSessionId(gigSessions[0].id);
      } else if (!autoCreatedSessionRef.current) {
        // Create a new session ONLY ONCE if none exist for this gig
        const autoCreate = async () => {
          if (isCreatingSession.current) return;
          isCreatingSession.current = true;
          try {
            const newSession = await createSession.mutateAsync({ 
              gigId: gigId as string,
              title: gig ? `Chat for ${gig.name}` : 'New Planning Session'
            });
            autoCreatedSessionRef.current = newSession.id;
            setSessionId(newSession.id);
            setLastSyncedSessionId(newSession.id);
          } catch (e) {
            console.error("Auto-session creation failed:", e);
          } finally {
            isCreatingSession.current = false;
          }
        };
        autoCreate();
      }
    }
  }, [sessions, isLoadingSessions, gigId, sessionId, gig]);

  // Scroll to bottom
  useEffect(() => {
    if (messages.length > 0 || aiMutation.isPending) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, aiMutation.isPending]);

  const showWelcome = messages.length === 0 && !isLoadingHistory && !isLoadingSessions && sessionId;

  const handleNewChat = async () => {
    try {
      const newSession = await createSession.mutateAsync({ 
        gigId: gigId as string,
        title: gig ? `Chat for ${gig.name}` : 'New Planning Session'
      });
      setSessionId(newSession.id);
      setLastSyncedSessionId(newSession.id);
      setMessages([]);
    } catch (e) {
      console.error("Failed to create session:", e);
    }
  };

  const handleSend = async (overrideMsg?: string) => {
    const text = overrideMsg || input.trim();
    if (!text || !sessionId) return;

    // INTERCEPT: Approve All Command
    const cleanText = text.toLowerCase().trim().replace(/[.!?]$/, '');
    const approveAllTriggers = ['approve all', 'add all', 'yes please', 'sure', 'go ahead', 'do it', 'approved'];
    if (approveAllTriggers.includes(cleanText)) {
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.actions && m.actions.length > 0);
      if (lastAssistantMsg) {
        const unappliedActions = lastAssistantMsg.actions?.filter(a => !a.isApplied) || [];
        if (unappliedActions.length > 0) {
          // Show user message
          const userMsg: Message = { id: Date.now().toString(), role: 'user', segments: [{ text }] };
          setMessages(prev => [...prev, userMsg]);
          setInput('');

          // Batch apply actions (Optimized for O(1) requests where possible)
          const songActions = unappliedActions.filter(a => {
            const t = a.type?.toLowerCase();
            return t === 'add' || t === 'add_song' || t === 'proposal_add_song';
          });
          const dictActions = unappliedActions.filter(a => {
            const t = a.type?.toLowerCase();
            return t === 'proposal_add_to_dictionary' || t === 'add_to_dictionary';
          });
          const otherActions = unappliedActions.filter(a => !songActions.includes(a) && !dictActions.includes(a));

          // 1. Bulk Songs
          if (songActions.length > 0 && setlist?.id) {
            await addSongsBulk.mutateAsync({
              setlistId: setlist.id,
              songs: songActions.map((a, i) => ({
                songId: a.songId,
                position: (currentSongs?.length || 0) + i + 1
              }))
            });
          }

          // 2. Bulk Dictionary
          if (dictActions.length > 0) {
            await addMultipleSongs.mutateAsync(
              dictActions.map(a => ({
                title: a.data?.title || a.title || '',
                artist: a.data?.artist || a.artist || '',
                genre: a.data?.genre || 'Music'
              }))
            );
          }

          // 3. Others (One by one)
          for (const action of otherActions) {
            await applySingleAction(lastAssistantMsg.id, action);
          }

          // Mark all as applied in local state
          setMessages(prev => prev.map(m => 
            m.id === lastAssistantMsg.id ? { 
              ...m, 
              actions: m.actions?.map(a => 
                unappliedActions.includes(a) ? { ...a, isApplied: true } : a
              ),
              badge: 'All actions approved! ✓' 
            } : m
          ));

          // Confirmation
          const aiReply: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            segments: [{ text: `Done! I've approved all ${unappliedActions.length} suggestions for you. 🎸` }],
          };
          setMessages(prev => [...prev, aiReply]);
          return;
        }
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      segments: [{ text }],
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await aiMutation.mutateAsync({
        gigId: gigId as string,
        setlistId: setlist?.id,
        message: text,
        sessionId: sessionId
      });

      const { text: cleanReply, actions } = parseAIMessage(response.reply);

      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        segments: [{ text: cleanReply }],
        actions,
        badge: actions.length > 0 
          ? `${actions.length} proposals ready ✓ ${actions.length > 1 ? '(Type "Approve All" to add all)' : ''}` 
          : undefined,
        isAnimating: true
      };
      
      setMessages((prev) => [...prev, aiReply]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      console.error('AI error:', error);
      const replyText = "Sorry, I'm having trouble connecting right now. 🎤 Catching my breath! Please try sending your message again in a moment.";

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        segments: [{ text: replyText }],
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need photo library permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      processExtraction(result.assets[0].uri);
    }
  };

  const handleCaptureImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      processExtraction(result.assets[0].uri);
    }
  };

  const processExtraction = async (uri: string) => {
    setIsExtracting(true);
    try {
      // 1. Resize Image (Critical for memory and upload speed)
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1600 } }], // Reasonable resolution for AI extraction
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const fileName = `${Date.now()}.jpg`;
      const filePath = `extractions/${fileName}`;
      // 2. Read file as ArrayBuffer safely (Universal helper)
      const arrayBuffer = await readAsArrayBuffer(manipulated.uri);

      // 3. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('song-screenshots')
        .upload(filePath, arrayBuffer, { 
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 4. Trigger AI Analysis
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const { data, error } = await supabase.functions.invoke('extract-songs', {
        body: { filePath },
        headers: {
          'X-Auth-Token': token || ''
        }
      });

      if (error) throw error;

      if (data.songs && data.songs.length > 0) {
        const songList = data.songs.map((s: any) => `- ${s.title} by ${s.artist} (${s.genre || 'Music'})`).join('\n');
        handleSend(`I've uploaded a screenshot. Please help me add these extracted songs to my music dictionary:\n${songList}`);
      } else {
        handleSend("I uploaded an image but couldn't find any songs. Can you help me check if it's clear enough?");
      }
    } catch (e: any) {
      console.error("Extraction failed:", e);
      // Enhanced feedback for troubleshooting
      const errorMsg = e.message?.includes('status 500') 
        ? "The analysis service is currently overwhelmed. Could you try again in a moment?"
        : "Sorry, I had trouble reading that image. Could you try uploading it again?";
      handleSend(errorMsg);
    } finally {
      setIsExtracting(false);
    }
  };

  const applySingleAction = async (msgId: string, action: any) => {
    try {
      if (action.type === 'add' || action.type === 'reorder') {
        const isReorder = action.type === 'reorder';
        const nextPosition = (currentSongs?.length || 0) + 1;
        const targetPosition = action.position || (isReorder ? 1 : nextPosition); // Default to start if reorder, end if add

        await addSongToSetlist.mutateAsync({
          setlistId: setlist?.id || '',
          songId: action.songId,
          position: targetPosition
        });
      } else if (action.type === 'proposal_create_gig') {
        await createGig.mutateAsync({
          bandId: action.data.bandId,
          name: action.data.name,
          venue: action.data.venue,
          date: action.data.date,
        });
      } else if (action.type === 'proposal_invite') {
        await inviteMusician.mutateAsync({
          bandId: action.data.bandId,
          musicianId: action.data.musicianId,
          message: action.data.message
        });
      } else if (action.type === 'proposal_add_to_dictionary') {
        await addSongToKnowledge.mutateAsync({
          title: action.data.title,
          artist: action.data.artist,
          genre: action.data.genre
        });
      }

      setMessages(prev => prev.map(m => 
        m.id === msgId ? { 
          ...m, 
          actions: m.actions?.map(a => 
            // Better matching for actions
            (a === action) ? { ...a, isApplied: true } : a
          ),
          badge: 'Action approved! ✓' 
        } : m
      ));
    } catch (error) {
       console.error('Failed to apply action:', error);
    }
  };

  // Filter sessions to only show those WITH messages in the history UI
  const filteredSessions = (sessions as any[] || []).filter((s: any) => s.ai_messages && s.ai_messages.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border, paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 20), height: 74 + insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.agentAvatar, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
            <Text style={[styles.agentAvatarIcon, { color: colors.primaryDark }]}>✦</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>✦ TukarTa Bot</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={[styles.headerStatus, { color: colors.textDim }]}>
                {sessionId ? `Active Session` : 'Creating Session...'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.historyBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border, borderWidth: 1 }]} 
          onPress={() => setIsHistoryVisible(true)}
          activeOpacity={0.7}
        >
          <History size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isHistoryVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHistoryVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chat History</Text>
              <TouchableOpacity onPress={() => setIsHistoryVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.newChatBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]} 
              onPress={() => {
                setIsHistoryVisible(false);
                handleNewChat();
              }}
            >
              <Plus size={20} color={colors.primaryDark} />
              <Text style={[styles.newChatText, { color: colors.primaryDark }]}>Start New Conversation</Text>
            </TouchableOpacity>

            {isLoadingSessions ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredSessions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.sessionItem, 
                      { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                      sessionId === item.id && { borderColor: colors.primary, borderWidth: 1.5 }
                    ]}
                    onPress={() => {
                      setSessionId(item.id);
                      setIsHistoryVisible(false);
                    }}
                  >
                    <View style={styles.sessionInfo}>
                      <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.sessionDate, { color: colors.textDim }]}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {sessionId === item.id && <Circle size={8} color={colors.primary} fill={colors.primary} />}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptySessionsWrapper}>
                    <Text style={[styles.emptySessions, { color: colors.text }]}>No past conversations found.</Text>
                    <Text style={[styles.emptySessionsSub, { color: colors.textDim }]}>Start a conversation to see it here.</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 74 + insets.top : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
        >
          {showWelcome && (
            <View style={styles.welcomeContainer}>
              <View style={[styles.agentAvatarLarge, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
                <Text style={[styles.agentAvatarIconLarge, { color: colors.primary }]}>✦</Text>
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                {gig ? `Planning for ${gig.name}` : 'How can I help today?'}
              </Text>
              <Text style={[styles.welcomeSub, { color: colors.textDim }]}>
                I can help you build setlists, hire musicians, or plan your next performance.
              </Text>
            </View>
          )}

          {isLoadingHistory && sessionId && (
             <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          )}

          {messages.map((msg) => (
            <View key={msg.id}>
              <View style={[styles.msgWrapper, msg.role === 'user' ? styles.msgWrapperUser : styles.msgWrapperAI]}>
                <View 
                  style={[
                    styles.msgBubble, 
                    msg.role === 'user' 
                      ? [styles.msgBubbleUser, { backgroundColor: colors.primary }] 
                      : [styles.msgBubbleAI, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }]
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <Text style={[styles.aiLabel, { color: colors.primary }]}>TUKARTA BOT</Text>
                  )}
                  
                  {msg.role === 'assistant' && msg.isAnimating ? (
                    <TypewriterText 
                      segments={msg.segments} 
                      onComplete={() => {
                        setMessages(prev => prev.map(m => 
                          m.id === msg.id ? { ...m, isAnimating: false } : m
                        ));
                      }} 
                    />
                  ) : (
                    <RichText segments={msg.segments} isUser={msg.role === 'user'} colors={colors} />
                  )}
                  
                  {msg.badge && (
                    <View style={[styles.badge, { borderTopColor: colors.border }]}>
                      <Text style={[styles.badgeText, { color: colors.primaryDark }]}>{msg.badge}</Text>
                    </View>
                  )}
                </View>
              </View>

              {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                <View style={styles.proposalsContainer}>
                  {msg.actions.map((action, idx) => (
                    <ProposalCard 
                      key={idx} 
                      action={action} 
                      onApprove={() => applySingleAction(msg.id, action)}
                      onCancel={() => {
                        setMessages(prev => prev.map(m => 
                          m.id === msg.id ? { ...m, actions: m.actions?.filter((_, i) => i !== idx) } : m
                        ));
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
          
          {aiMutation.isPending && <TypingIndicator />}
        </ScrollView>

        <View style={[styles.inputOuter, { backgroundColor: colors.bg, paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
          <View style={[styles.inputInner, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <View style={styles.actionBtns}>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }]} 
                onPress={handleCaptureImage} 
                disabled={isExtracting}
                activeOpacity={0.7}
              >
                <Camera size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }]} 
                onPress={handlePickImage} 
                disabled={isExtracting}
                activeOpacity={0.7}
              >
                <ImageIcon size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                { color: colors.inputText },
                Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
              ]}
              placeholder={isExtracting ? "Extracting songs..." : "e.g. 'Plan a bar gig for next Friday'"}
              placeholderTextColor={colors.inputPlaceholder}
              value={input}
              onChangeText={setInput}
              multiline
              editable={!aiMutation.isPending && !!sessionId && !isExtracting}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, { backgroundColor: colors.primary }, (!input.trim() || !sessionId || isExtracting) && { opacity: 0.5 }]} 
              onPress={() => handleSend()}
              disabled={!input.trim() || aiMutation.isPending || !sessionId || isExtracting}
            >
              {aiMutation.isPending || isExtracting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function RichText({ segments, isUser, colors }: { segments: Segment[]; isUser: boolean; colors?: any }) {
  const textColor = isUser ? '#FFFFFF' : (colors?.text || '#166534');
  const highlightColor = isUser ? '#FFFFFF' : (colors?.primaryDark || '#065F46');

  return (
    <Text style={[styles.msgText, { color: textColor }]}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <Text key={i} style={[styles.highlight, { color: highlightColor }]}>{seg.text}</Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  agentAvatarIcon: {
    fontSize: 18,
  },
  headerInfo: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  headerStatus: {
    fontSize: 11,
    fontFamily: 'DM Sans',
  },
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  agentAvatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  agentAvatarIconLarge: {
    fontSize: 36,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'DM Sans',
  },
  welcomeSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'DM Sans',
  },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  msgWrapperAI: {
    justifyContent: 'flex-start',
  },
  msgWrapperUser: {
    justifyContent: 'flex-end',
  },
  msgBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
  },
  msgBubbleAI: {
    borderBottomLeftRadius: 4,
  },
  msgBubbleUser: {
    borderBottomRightRadius: 4,
  },
  aiLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 1.2,
    fontFamily: 'DM Sans',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'DM Sans',
  },
  msgTextUser: {
    color: '#FFFFFF',
  },
  highlight: {
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  badge: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: 'DM Sans',
  },
  proposalsContainer: {
    paddingHorizontal: 10,
    marginBottom: 18,
    gap: 8,
  },
  proposalCard: {
    height: 70,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  proposalCardActive: {
    borderWidth: 1.5,
  },
  proposalContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  proposalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  proposalTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  proposalTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  proposalSubtitle: {
    fontSize: 12,
    marginTop: 1,
    fontFamily: 'DM Sans',
  },
  proposalRight: {
    marginLeft: 10,
  },
  proposalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approveMiniBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  approveMiniText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontFamily: 'DM Sans',
  },
  miniCancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  checkboxActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputOuter: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 4,
    borderWidth: 1,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 4,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    fontFamily: 'DM Sans',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '70%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'DM Sans',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  newChatText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  activeSessionItem: {
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'DM Sans',
  },
  sessionDate: {
    fontSize: 12,
    fontFamily: 'DM Sans',
  },
  emptySessionsWrapper: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptySessions: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DM Sans',
  },
  emptySessionsSub: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'DM Sans',
  },
});
