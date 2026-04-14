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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Send, Sparkles, Zap, Music2 } from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
type Segment = { text: string; highlight?: boolean };
type Message = {
  id: string;
  role: 'assistant' | 'user';
  segments: Segment[];
  badge?: string;
};

// ─── Rich text helper ─────────────────────────────────────────────────────────
function rich(parts: (string | { h: string })[]): Segment[] {
  return parts.map((p) =>
    typeof p === 'string' ? { text: p } : { text: p.h, highlight: true }
  );
}

// ─── Initial conversation ──────────────────────────────────────────────────────
const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    segments: rich([
      'Hey Marco 🎸 I\'m working on your setlist for ',
      { h: 'Handuraw Café' },
      '. What would you like to change?',
    ]),
  },
  {
    id: '2',
    role: 'user',
    segments: rich(['Make it more OPM heavy. We want to connect with the local crowd tonight.']),
  },
  {
    id: '3',
    role: 'assistant',
    segments: rich([
      'Got it. Adding more OPM songs that ',
      { h: 'everyone in the band knows' },
      '. Moving Kundiman to slot 2, Paraluman to slot 3. Hotel California stays as opener.',
    ]),
    badge: 'Updated: 7 OPM · 4 international ✓',
  },
  {
    id: '4',
    role: 'user',
    segments: rich(['Remove the slow songs in the middle.']),
  },
  {
    id: '5',
    role: 'assistant',
    segments: rich([
      'Removed Tadhana and More Than Words. Replaced with ',
      { h: 'Narda' },
      ' and ',
      { h: 'Harana' },
      ' — both known by all 4 members, higher energy.',
    ]),
    badge: 'Duration: 91 min ✓',
  },
];

const SUGGESTIONS = [
  { label: 'Draft 90min Setlist', icon: Sparkles, color: '#00D4FF' },
  { label: 'Optimize for Energy', icon: Zap, color: '#F59E0B' },
  { label: 'Check Song Availability', icon: Music2, color: '#8B5CF6' },
];

// ─── Rich text renderer ───────────────────────────────────────────────────────
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
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      segments: [{ text: input.trim() }],
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        segments: rich([
          'I\'ve updated the setlist based on your request. Check out the new arrangement — ',
          { h: '8 OPM songs' },
          ' now lead the set.',
        ]),
        badge: 'Setlist ready ✓',
      };
      setMessages((prev) => [...prev, aiReply]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 900);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
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
          {/* AI avatar bubble */}
          <View style={styles.agentAvatar}>
            <Text style={styles.agentAvatarIcon}>✦</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>✦ AI Setlist Agent</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerStatus}>Online · Acoustic Vibes Mix</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* ── Chat ── */}
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
                  {msg.badge && (
                    <Text style={styles.badgeText}>{msg.badge}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* ── Suggestion chips ── */}
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
                  onPress={() => setInput(s.label)}
                >
                  <Icon size={12} color={s.color} />
                  <Text style={styles.suggestionText}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Ask the AI to change your setlist..."
              placeholderTextColor="rgba(255,255,255,0.28)"
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              activeOpacity={0.8}
            >
              <Send size={17} color="#071420" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },

  /* Header */
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

  /* Chat */
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

  /* Bubbles */
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
    marginTop: 2,
  },

  /* Suggestions */
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

  /* Input bar */
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
    ...Platform.select({ web: { outline: 'none' } as any }),
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
