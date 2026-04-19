import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Send, Sparkles, Zap, Music2, Check } from 'lucide-react-native';
import { useGigDetails, useGigSetlist, useSetlistAI, useAddSongToSetlist, useSetlistSongs } from '../utils/hooks/useMusician';

// ─── Types ────────────────────────────────────────────────────────────────────
type Segment = { text: string; highlight?: boolean };
type Message = {
  id: string;
  role: 'assistant' | 'user';
  segments: Segment[];
  badge?: string;
  actions?: any[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rich(parts: (string | { h: string })[]): Segment[] {
  return parts.map((p) =>
    typeof p === 'string' ? { text: p } : { text: p.h, highlight: true }
  );
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

const SUGGESTIONS = [
  { label: 'Suggest high-energy songs', icon: Zap, color: '#F59E0B' },
  { label: 'Suggest OPM classics', icon: Music2, color: '#8B5CF6' },
  { label: 'Optimize setlist for 90 mins', icon: Sparkles, color: '#00D4FF' },
];

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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AIAgentScreen() {
  const router = useRouter();
  const { gigId } = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // 1. Data Hooks
  const { data: gig } = useGigDetails(gigId as string);
  const { data: setlist } = useGigSetlist(gigId as string);
  const { data: currentSongs } = useSetlistSongs(setlist?.id);
  
  const aiMutation = useSetlistAI();
  const addSong = useAddSongToSetlist();

  // Initialize welcome message
  React.useEffect(() => {
    if (gig) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          segments: rich([
            `Hey rockstar! 🎸 I'm ready to help with your setlist for `,
            { h: gig.name },
            `. What's the vibe today?`,
          ]),
        }
      ]);
    }
  }, [gig]);

  const handleSend = async (overrideMsg?: string) => {
    const text = overrideMsg || input.trim();
    if (!text) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      segments: [{ text }],
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Call AI Agent Edge Function
      const response = await aiMutation.mutateAsync({
        gigId: gigId as string,
        setlistId: setlist?.id,
        message: text,
      });

      const { text: cleanReply, actions } = parseAIMessage(response.reply);

      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        segments: [{ text: cleanReply }],
        actions,
        badge: actions.length > 0 ? `${actions.length} suggestions ready ✓` : undefined,
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

  const applyActions = async (msgId: string, actions: any[]) => {
    try {
      let nextPosition = (currentSongs?.length || 0) + 1;
      
      for (const action of actions) {
        if (action.type === 'add') {
          await addSong.mutateAsync({
            setlistId: setlist?.id,
            songId: action.songId,
            position: nextPosition
          });
          nextPosition++;
        }
      }
      
      // Update message badge to show success and hide apply button
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, badge: 'Changes applied! ✓', actions: [] } : m
      ));
    } catch (error) {
      console.error('Failed to apply AI actions:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.agentAvatar}>
            <Text style={styles.agentAvatarIcon}>✦</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>✦ AI Setlist Agent</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerStatus}>Online · {gig?.name}</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={msg.id}
                style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}
              >
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
                  <RichText segments={msg.segments} isUser={isUser} />
                  
                  {msg.actions && msg.actions.length > 0 && (
                    <View style={styles.actionsContainer}>
                      {msg.actions.map((act, idx) => (
                        <View key={idx} style={styles.actionItem}>
                          <Music2 size={12} color="#00D4FF" />
                          <Text style={styles.actionItemText}>{act.title}</Text>
                        </View>
                      ))}
                      <TouchableOpacity 
                        style={styles.applyBtn}
                        onPress={() => applyActions(msg.id, msg.actions!)}
                        disabled={addSong.isPending}
                      >
                        {addSong.isPending ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Check size={14} color="#FFF" />
                            <Text style={styles.applyBtnText}>Apply to Setlist</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {msg.badge && (
                    <Text style={styles.badgeText}>{msg.badge}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.suggestionsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {SUGGESTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <TouchableOpacity
                  key={s.label}
                  style={styles.suggestionChip}
                  activeOpacity={0.7}
                  onPress={() => handleSend(s.label)}
                >
                  <Icon size={12} color={s.color} />
                  <Text style={styles.suggestionText}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.inputBar}>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Ask the AI to change your setlist..."
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              style={[styles.sendBtn, (!input.trim() || aiMutation.isPending) && styles.sendBtnDisabled]}
              activeOpacity={0.8}
              disabled={aiMutation.isPending}
            >
              {aiMutation.isPending ? (
                <ActivityIndicator size="small" color="#071420" />
              ) : (
                <Send size={17} color="#071420" strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    color: '#00D4FF',
    fontFamily: 'DM Sans',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(139,92,246,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarIcon: {
    fontSize: 18,
    color: '#8B5CF6',
  },
  headerInfo: {
    gap: 3,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM Sans Bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerStatus: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  msgRow: {
    flexDirection: 'row',
  },
  msgRowAI: {
    justifyContent: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 8,
  },
  bubbleAI: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderTopLeftRadius: 6,
  },
  bubbleUser: {
    backgroundColor: '#00D4FF',
    borderTopRightRadius: 6,
  },
  msgText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
    fontFamily: 'DM Sans',
  },
  msgTextUser: {
    color: '#071420',
    fontWeight: '600',
  },
  highlight: {
    color: '#00D4FF',
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00D4FF',
    fontFamily: 'DM Sans Bold',
    marginTop: 6,
  },
  actionsContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionItemText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'DM Sans',
  },
  applyBtn: {
    backgroundColor: '#00D4FF',
    height: 36,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  suggestionsWrap: {
    height: 48,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    height: 48,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    height: 34,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'DM Sans',
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#0A0F1E',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingLeft: 20,
    paddingRight: 6,
    height: 56,
    gap: 10,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'DM Sans',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
