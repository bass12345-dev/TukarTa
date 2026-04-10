import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Send, Music, Sparkles, ChevronLeft, Bot, Mic, Zap } from 'lucide-react-native';
import { GlassCard } from '../components/ui/GlassCard';
import { Orb } from '../components/ui/Orb';
import { Heading, Paragraph, Label, Mono } from '../components/ui/Typography';

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
    
    // Simulate thinking
    setTimeout(() => {
       const reply = { id: (Date.now()+1).toString(), role: 'assistant', text: "I've drafted a 90-minute setlist focusing on your highest confidence OPM rock covers. Would you like to see it?" };
       setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-brand-bg"
    >
      <Stack.Screen 
        options={{ 
          title: "Setlist AI",
          headerShown: true,
          headerStyle: { backgroundColor: '#071420' },
          headerTintColor: '#F0F4FF'
        }} 
      />

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            className={`mb-6 flex-row ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <View className="mr-3">
                <Orb variant="cyan" size={32}>
                  <Bot size={16} color="#00D4FF" />
                </Orb>
              </View>
            )}
            <View className="max-w-[80%]">
              <GlassCard 
                className={`${msg.role === 'user' ? 'bg-brand-cyan/20 border-brand-cyan/30' : 'bg-brand-surface'}`}
              >
                <Text className="text-brand-text font-sans leading-5">{msg.text}</Text>
              </GlassCard>
              <Text className="text-brand-text-dim text-[10px] mt-1 ml-1 uppercase font-bold">
                {msg.role === 'assistant' ? 'Setlist AI' : 'You'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Suggestion Bubbles */}
      <View className="px-6 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
           <SuggestionChip label="Draft 90min Setlist" icon={<Sparkles size={12} color="#00D4FF" />} />
           <SuggestionChip label="Check Player Availability" icon={<Music size={12} color="#8B5CF6" />} />
           <SuggestionChip label="Optimize for Energy" icon={<Zap size={12} color="#F59E0B" />} />
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View className="p-4 bg-brand-bg2 border-t border-brand-glass-border">
         <View className="flex-row items-center gap-3">
            <TouchableOpacity className="w-10 h-10 rounded-full bg-brand-surface items-center justify-center">
               <Mic size={20} color="#94A3B8" />
            </TouchableOpacity>
            <View className="flex-1 bg-brand-surface rounded-full px-4 py-2 border border-white/5">
               <TextInput 
                 placeholder="Ask the Setlist AI..." 
                 placeholderTextColor="#94A3B8"
                 className="text-brand-text font-sans"
                 value={input}
                 onChangeText={setInput}
                 onSubmitEditing={handleSend}
               />
            </View>
            <TouchableOpacity 
              onPress={handleSend}
              className="w-10 h-10 rounded-full bg-brand-cyan items-center justify-center"
            >
               <Send size={18} color="white" />
            </TouchableOpacity>
         </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function SuggestionChip({ label, icon }: { label: string, icon: React.ReactNode }) {
  return (
    <TouchableOpacity className="bg-brand-surface border border-white/5 px-4 py-2 rounded-full flex-row items-center gap-2 mr-2">
       {icon}
       <Text className="text-brand-text text-xs font-sans font-semibold">{label}</Text>
    </TouchableOpacity>
  );
}
