import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Send, Music, Sparkles, Bot, Mic, Zap, ChevronLeft } from 'lucide-react-native';
import { GlassCard } from '../components/ui/GlassCard';
import { Orb } from '../components/ui/Orb';
import { Pill } from '../components/ui/Pill';

const INITIAL_MESSAGES = [
  { id: '1', role: 'assistant', text: "Hello Marco! I'm your Setlist AI assistant. I've analyzed your band's repertoire. Ready to build a setlist for tomorrow's gig?" },
];

export default function AIAgentScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now().toString(), role: 'user', text: input };
    setMessages([...messages, newMsg]);
    setInput('');
    
    setTimeout(() => {
       const reply = { id: (Date.now()+1).toString(), role: 'assistant', text: "I've drafted a 90-minute setlist focusing on your highest confidence OPM rock covers. Would you like to see it?" };
       setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false
        }} 
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <ChevronLeft size={24} color="var(--color-text)" />
        </TouchableOpacity>
        <Orb variant="purple" size={36}>
          <Bot size={18} color="#8B5CF6" />
        </Orb>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Setlist AI Agent</Text>
          <Text style={styles.headerStatus}>Online · Typically responds instantly</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          {messages.map((msg) => (
            <View 
              key={msg.id} 
              style={[
                styles.messageRow, 
                msg.role === 'user' ? styles.userRow : styles.assistantRow
              ]}
            >
              <View style={msg.role === 'user' ? styles.userMsgContainer : styles.assistantMsgContainer}>
                <GlassCard 
                  style={styles.messageCard}
                  intensity={msg.role === 'user' ? 30 : 15}
                >
                  <Text style={styles.messageText}>{msg.text}</Text>
                </GlassCard>
                <Text style={styles.msgLabel}>
                  {msg.role === 'assistant' ? 'Setlist AI' : 'You'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Suggestion Bubbles */}
        <View style={styles.suggestionArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionScroll}>
             <SuggestionChip label="Draft 90min Setlist" icon={<Sparkles size={12} color="#00D4FF" />} />
             <SuggestionChip label="Optimize for Energy" icon={<Zap size={12} color="#F59E0B" />} />
             <SuggestionChip label="Check Availability" icon={<Music size={12} color="#8B5CF6" />} />
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
           <View style={styles.inputInner}>
              <TouchableOpacity style={styles.micBtn}>
                 <Mic size={20} color="var(--color-text-dim)" />
              </TouchableOpacity>
              <TextInput 
                placeholder="Ask the AI agent..." 
                placeholderTextColor="rgba(150, 175, 200, 0.35)"
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity 
                onPress={handleSend}
                style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]}
              >
                 <Send size={18} color="white" />
              </TouchableOpacity>
           </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function SuggestionChip({ label, icon }: any) {
  return (
    <TouchableOpacity style={styles.chip}>
       {icon}
       <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'var(--color-bg)',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'var(--color-glass-border)',
    gap: 12,
  },
  backBtn: {
    marginRight: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'var(--color-text)',
    fontFamily: 'DM Sans',
  },
  headerStatus: {
    fontSize: 11,
    color: '#10B981',
    fontFamily: 'DM Sans',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageRow: {
    marginBottom: 24,
    flexDirection: 'row',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantMsgContainer: {
    maxWidth: '85%',
  },
  userMsgContainer: {
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  messageCard: {
    padding: 14,
    backgroundColor: 'var(--color-glass)',
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: 'var(--color-text)',
    fontFamily: 'DM Sans',
  },
  msgLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'var(--color-text-dim)',
    marginTop: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
  },
  suggestionArea: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'var(--color-glass-border)',
  },
  suggestionScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    backgroundColor: 'var(--color-surface)',
    borderWidth: 1,
    borderColor: 'var(--color-glass-border)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'var(--color-text)',
    fontFamily: 'DM Sans',
  },
  inputBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    backgroundColor: 'var(--color-bg)',
    borderTopWidth: 1,
    borderTopColor: 'var(--color-glass-border)',
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 28,
    paddingHorizontal: 12,
    height: 52,
    gap: 10,
    borderWidth: 1,
    borderColor: 'var(--color-glass-border)',
  },
  micBtn: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: 'var(--color-text)',
    fontFamily: 'DM Sans',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
