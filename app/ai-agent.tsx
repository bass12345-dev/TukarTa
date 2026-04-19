import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  ChevronLeft,
  Music,
  Send,
  UserPlus,
  X
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import {
  useAddSongToSetlist,
  useCreateGig,
  useGigDetails,
  useGigSetlist,
  useInviteMusician,
  useSetlistAI,
  useSetlistSongs
} from '../utils/hooks/useMusician';

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
function ProposalCard({ action, onApprove, onCancel, isApplied }: any) {
  const isSong = action.type === 'add';
  const isGig = action.type === 'proposal_create_gig';
  const isInvite = action.type === 'proposal_invite';

  if (isApplied) return null;

  return (
    <GlassCard intensity={20} style={styles.proposalCard}>
      <View style={styles.proposalHeader}>
        {isSong && <Music size={18} color="#00D4FF" />}
        {isGig && <Calendar size={18} color="#F59E0B" />}
        {isInvite && <UserPlus size={18} color="#8B5CF6" />}
        <Text style={styles.proposalType}>
          {isSong ? 'Song Suggestion' : isGig ? 'Gig Proposal' : 'Recruitment Proposal'}
        </Text>
      </View>
      
      <View style={styles.proposalBody}>
        {isSong && <Text style={styles.proposalTitle}>{action.title || 'Unknown Song'}</Text>}
        {isGig && (
          <>
            <Text style={styles.proposalTitle}>{action.data.name}</Text>
            <Text style={styles.proposalMeta}>{action.data.venue} · {action.data.date}</Text>
          </>
        )}
        {isInvite && (
          <>
            <Text style={styles.proposalTitle}>Invite Musician</Text>
            <Text style={styles.proposalMeta}>Proposed to join your band</Text>
          </>
        )}
      </View>

      <View style={styles.proposalActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <X size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
        <Button 
          title="Approve" 
          size="sm" 
          variant="glass" 
          style={styles.approveBtn}
          onPress={onApprove} 
        />
      </View>
    </GlassCard>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  const [dots, setDots] = useState('');
  
  React.useEffect(() => {
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

  // 1. Data Hooks
  const { data: gig } = useGigDetails(gigId as string);
  const { data: setlist } = useGigSetlist(gigId as string);
  const { data: currentSongs } = useSetlistSongs(setlist?.id);
  
  const aiMutation = useSetlistAI();
  const addSong = useAddSongToSetlist();
  const createGig = useCreateGig();
  const inviteMusician = useInviteMusician();

  // Scroll to bottom whenever messages or isPending change
  React.useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, aiMutation.isPending]);

  // Initialize welcome message
  React.useEffect(() => {
    if (gigId && gig) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          segments: rich([
            `Hey rockstar! 🎸 I'm ready to help with your setlist for `,
            { h: gig.name },
            `. What's the vibe today?`,
          ]),
          isAnimating: true
        }
      ]);
    } else if (!gigId) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          segments: rich([
            `Welcome to your AI Gig Assistant! ✦ I can help you plan new gigs, find band members, or build setlists. What are we working on?`,
          ]),
          isAnimating: true
        }
      ]);
    }
  }, [gigId, gig]);

  const handleSend = async (overrideMsg?: string) => {
    const text = overrideMsg || input.trim();
    if (!text) return;

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

  const applySingleAction = async (msgId: string, action: any) => {
    try {
      if (action.type === 'add') {
        const nextPosition = (currentSongs?.length || 0) + 1;
        await addSong.mutateAsync({
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
      }

      // Remove specific action from the message list after approval
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { 
          ...m, 
          actions: m.actions?.filter(a => a !== action),
          badge: m.actions?.length === 1 ? 'Action approved! ✓' : m.badge 
        } : m
      ));
    } catch (error) {
       console.error('Failed to apply action:', error);
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
            <Text style={styles.headerTitle}>✦ AI Gig Assistant</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerStatus}>
                {gigId ? `In Gig: ${gig?.name || '...'}` : 'General Planning Mode'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
        >
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

              {/* Action Proposals for this message */}
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

        {/* ── Input Area ── */}
        <View style={styles.inputOuter}>
          <View style={styles.inputInner}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 'Plan a bar gig for next Friday'"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]} 
              onPress={() => handleSend()}
              disabled={!input.trim() || aiMutation.isPending}
            >
              {aiMutation.isPending ? (
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
    height: 100,
    backgroundColor: 'rgba(7, 20, 32, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
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
    fontFamily: 'DM Sans',
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
    fontFamily: 'DM Sans Bold',
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
    fontFamily: 'DM Sans',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
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
    fontFamily: 'DM Sans',
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
    fontFamily: 'DM Sans Bold',
  },
  proposalsContainer: {
    paddingLeft: 20,
    marginBottom: 24,
    gap: 12,
  },
  proposalCard: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  proposalHeader: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proposalType: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    position: 'absolute',
    top: -20,
    left: 0,
  },
  proposalBody: {
    flex: 1,
  },
  proposalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
    marginBottom: 2,
  },
  proposalMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'DM Sans',
  },
  proposalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approveBtn: {
    height: 32,
    paddingHorizontal: 12,
  },
  cancelBtn: {
    height: 32,
    width: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'DM Sans',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  typingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'DM Sans Medium',
    fontStyle: 'italic',
  }
});
