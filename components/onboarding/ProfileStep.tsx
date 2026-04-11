import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, ChevronRight } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { TextField } from '../ui/TextField';
import { Pill } from '../ui/Pill';
import { StepProps } from './types';
import { useAuth } from '../../context/auth';

export const ProfileStep: React.FC<StepProps> = ({ data, updateData }) => {
  const { user } = useAuth();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Build your profile</Text>
      <Text style={styles.subtitle}>This is how bands and musicians see you in the marketplace.</Text>
      
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarCircle}>
          <Camera size={28} color="rgba(0, 212, 255, 0.4)" />
          <Text style={styles.avatarText}>ADD PHOTO</Text>
        </TouchableOpacity>
        <View style={styles.avatarContent}>
          <Text style={styles.avatarNote}>A profile photo helps bands recognize you. Pulled from Google by default.</Text>
          <Pill label="✓ From Google account" variant="cyan" />
        </View>
      </View>

      <View style={styles.formContainer}>
        <TextField
          label="Stage name / Display name"
          placeholder="Marco Rivera"
          value={data.stageName}
          onChangeText={(val) => updateData({ stageName: val })}
        />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Use a stage name</Text>
            <Text style={styles.switchSub}>Different from your real name?</Text>
          </View>
          <TouchableOpacity 
             onPress={() => updateData({ useStageName: !data.useStageName })}
             style={[styles.switch, data.useStageName && styles.switchOn]}
          >
             <View style={[styles.switchKnob, data.useStageName && styles.switchKnobOn]} />
          </TouchableOpacity>
        </View>

        <TextField
          label="Short bio (optional)"
          placeholder="Acoustic singer-guitarist from Cebu. 8 years of live gigging..."
          multiline
          numberOfLines={3}
          style={{ height: 100, textAlignVertical: 'top' }}
          value={data.bio}
          onChangeText={(val) => updateData({ bio: val })}
        />

        <View style={styles.rateRow}>
          <View style={{ flex: 1.5 }}>
            <TextField
              label="Per-gig rate (optional)"
              placeholder="₱ 1,500"
              keyboardType="numeric"
              value={data.rate}
              onChangeText={(val) => updateData({ rate: val })}
            />
          </View>
          <View style={{ flex: 1, paddingTop: 30 }}>
            <GlassCard style={styles.selectCard}>
              <Text style={styles.selectText}>Per gig</Text>
              <ChevronRight size={16} color="rgba(255, 255, 255, 0.5)" />
            </GlassCard>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  subtitle: { fontSize: 15, color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'DM Sans', lineHeight: 22, marginBottom: 20 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 20, marginVertical: 10 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(0, 212, 255, 0.2)',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  avatarText: { fontSize: 9, fontWeight: '700', color: 'rgba(0, 212, 255, 0.5)', fontFamily: 'DM Sans Bold' },
  avatarContent: { flex: 1, gap: 8 },
  avatarNote: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'DM Sans', lineHeight: 18 },
  formContainer: { gap: 20, marginTop: 10 },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  switchLabel: { fontSize: 15, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  switchSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'DM Sans' },
  switch: { width: 50, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 2 },
  switchOn: { backgroundColor: '#00D4FF' },
  switchKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF' },
  switchKnobOn: { alignSelf: 'flex-end' },
  rateRow: { flexDirection: 'row', gap: 12 },
  selectCard: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderRadius: 12 },
  selectText: { color: '#FFF', fontSize: 14, fontFamily: 'DM Sans Medium' },
});
