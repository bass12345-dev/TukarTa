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
  useAddSongToKnowledge
} from '../utils/hooks/useMusician';
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
  const isSong = action.type === 'add';
  const isGig = action.type === 'proposal_create_gig';
  const isInvite = action.type === 'proposal_invite';
  const isDictionary = action.type === 'proposal_add_to_dictionary';
  const isApplied = action.isApplied;

  return (
    <GlassCard 
      intensity={isApplied ? 30 : 12} 
      style={[styles.proposalCard, isApplied && styles.proposalCardActive]}
      noPadding
    >
      <View style={styles.proposalContent}>
        <View style={[styles.proposalIconBox, { backgroundColor: isSong ? 'rgba(0,212,255,0.06)' : isGig ? 'rgba(245,158,11,0.06)' : 'rgba(139,92,246,0.06)' }]}>
          {isSong && <Music size={18} color="#00D4FF" />}
          {isGig && <Calendar size={18} color="#F59E0B" />}
          {isInvite && <UserPlus size={18} color="#8B5CF6" />}
        </View>
        
        <View style={styles.proposalTextContainer}>
          <Text style={styles.proposalTitle} numberOfLines={1}>
            {isSong ? 'SONG SUGGESTION' : isGig ? 'GIG PROPOSAL' : isDictionary ? 'ADD TO DICTIONARY' : 'RECRUITMENT'}
          </Text>
          <Text style={styles.proposalSubtitle} numberOfLines={1}>
            {isSong ? 'Song Suggestion' : isGig ? action.data.venue : isDictionary ? `${action.data.artist} • ${action.data.genre || 'Music'}` : 'Proposed recruitment'}
          </Text>
        </View>

        <View style={styles.proposalRight}>
          {!isApplied ? (
            <View style={styles.proposalActionsRow}>
              <TouchableOpacity style={styles.miniCancelBtn} onPress={onCancel}>
                <X size={14} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onApprove} style={styles.approveMiniBtn}>
                <Text style={styles.approveMiniText}>Approve</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.checkboxActive}>
              <Check size={14} color="#FFF" strokeWidth={3} />
            </View>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.msgWrapper, styles.msgWrapperAI]}>
      <GlassCard intensity={15} style={[styles.msgBubble, styles.msgBubbleAI, { paddingVertical: 12, paddingHorizontal: 16 }]}>
        <Text style={styles.aiLabel}>GIG ASSISTANT IS TYPING</Text>
        <View style={styles.dotsRow}>
          <Text style={styles.typingText}>Thinking{dots}</Text>
        </View>
      </GlassCard>
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
        badge: actions.length > 0 ? `${actions.length} proposals ready ✓` : undefined,
        isAnimating: true
      };
      
      setMessages((prev) => [...prev, aiReply]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('AI error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        segments: [{ text: "Sorry, I'm having trouble connecting right now. 🎤 Catching my breath!" }],
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handlePickImage = async () => {
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
      const { data, error } = await supabase.functions.invoke('extract-songs', {
        body: { filePath }
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
      if (action.type === 'add') {
        const nextPosition = (currentSongs?.length || 0) + 1;
        await addSongToSetlist.mutateAsync({
          setlistId: setlist?.id || '',
          songId: action.songId,
          position: nextPosition
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 20), height: 74 + insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.agentAvatar}>
            <Text style={styles.agentAvatarIcon}>✦</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>✦ AI Gig Assistant</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerStatus}>
                {sessionId ? `Active Session` : 'Creating Session...'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.historyBtn} 
          onPress={() => setIsHistoryVisible(true)}
        >
          <History size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isHistoryVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHistoryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard intensity={40} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat History</Text>
              <TouchableOpacity onPress={() => setIsHistoryVisible(false)}>
                <X size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.newChatBtn} 
              onPress={() => {
                setIsHistoryVisible(false);
                handleNewChat();
              }}
            >
              <Plus size={20} color="#00D4FF" />
              <Text style={styles.newChatText}>Start New Conversation</Text>
            </TouchableOpacity>

            {isLoadingSessions ? (
              <ActivityIndicator color="#00D4FF" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredSessions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.sessionItem, sessionId === item.id && styles.activeSessionItem]}
                    onPress={() => {
                      setSessionId(item.id);
                      setIsHistoryVisible(false);
                    }}
                  >
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.sessionDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {sessionId === item.id && <Circle size={8} color="#00D4FF" fill="#00D4FF" />}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptySessionsWrapper}>
                    <Text style={styles.emptySessions}>No past conversations found.</Text>
                    <Text style={styles.emptySessionsSub}>Start a conversation to see it here.</Text>
                  </View>
                }
              />
            )}
          </GlassCard>
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
              <View style={styles.agentAvatarLarge}>
                <Text style={styles.agentAvatarIconLarge}>✦</Text>
              </View>
              <Text style={styles.welcomeTitle}>
                {gig ? `Planning for ${gig.name}` : 'How can I help today?'}
              </Text>
              <Text style={styles.welcomeSub}>
                I can help you build setlists, hire musicians, or plan your next performance.
              </Text>
            </View>
          )}

          {isLoadingHistory && sessionId && (
             <ActivityIndicator color="#00D4FF" style={{ marginTop: 20 }} />
          )}

          {messages.map((msg) => (
            <View key={msg.id}>
              <View style={[styles.msgWrapper, msg.role === 'user' ? styles.msgWrapperUser : styles.msgWrapperAI]}>
                <View style={[styles.msgBubble, msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleAI]}>
                  {msg.role === 'assistant' && (
                    <Text style={styles.aiLabel}>GIG ASSISTANT</Text>
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
                    <RichText segments={msg.segments} isUser={msg.role === 'user'} />
                  )}
                  
                  {msg.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{msg.badge}</Text>
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

        <View style={[styles.inputOuter, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
          <View style={styles.inputInner}>
            <View style={styles.actionBtns}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCaptureImage} disabled={isExtracting}>
                <Camera size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handlePickImage} disabled={isExtracting}>
                <ImageIcon size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder={isExtracting ? "Extracting songs..." : "e.g. 'Plan a bar gig for next Friday'"}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={input}
              onChangeText={setInput}
              multiline
              editable={!aiMutation.isPending && !!sessionId && !isExtracting}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, (!input.trim() || !sessionId || isExtracting) && { opacity: 0.5 }]} 
              onPress={() => handleSend()}
              disabled={!input.trim() || aiMutation.isPending || !sessionId || isExtracting}
            >
              {aiMutation.isPending || isExtracting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function RichText({ segments, isUser }: { segments: Segment[]; isUser: boolean }) {
  return (
    <Text style={[styles.msgText, isUser && styles.msgTextUser]}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <Text key={i} style={styles.highlight}>{seg.text}</Text>
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
    backgroundColor: '#071420',
  },
  header: {
    backgroundColor: 'rgba(7, 20, 32, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 12,
  },
  backText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  agentAvatarIcon: {
    color: '#8B5CF6',
    fontSize: 18,
  },
  headerInfo: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerStatus: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  agentAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  agentAvatarIconLarge: {
    fontSize: 40,
    color: '#8B5CF6',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  msgBubbleUser: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  aiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
  },
  msgTextUser: {
    color: '#FFF',
  },
  highlight: {
    color: '#00D4FF',
    fontWeight: '700',
  },
  badge: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  badgeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  proposalsContainer: {
    paddingHorizontal: 14,
    marginBottom: 24,
    gap: 8,
  },
  proposalCard: {
    height: 70,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  proposalCardActive: {
    borderColor: '#00D4FF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
  },
  proposalContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  proposalIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  proposalTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  proposalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  proposalSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 1,
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
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  approveMiniText: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  miniCancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  checkboxActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputOuter: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: '#071420',
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    maxHeight: 120,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,212,255,0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    marginBottom: 20,
  },
  newChatText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00D4FF',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 10,
    gap: 12,
  },
  activeSessionItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  emptySessionsWrapper: {
    alignItems: 'center',
    paddingTop: 40,
    opacity: 0.5,
  },
  emptySessions: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySessionsSub: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
});
