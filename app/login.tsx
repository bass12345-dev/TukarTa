import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Orb } from '../components/ui/Orb';
import { Heading, Paragraph } from '../components/ui/Typography';
import { Camera, Music, Search, Zap } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();

  const handleGoogleLogin = () => {
    router.replace('/onboarding/upload');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0d2d45', '#071420']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.artSection}>
          <View style={styles.previewGrid}>
            <View style={styles.previewRow}>
              <PreviewCard 
                orbVariant="cyan" 
                icon={<Music size={14} color="#00D4FF" />} 
                title="AI Setlists" 
                subtitle="Smart generation" 
              />
              <PreviewCard 
                orbVariant="purple" 
                icon={<Camera size={14} color="#8B5CF6" />} 
                title="Screenshot" 
                subtitle="Import songs" 
              />
            </View>
            <View style={styles.previewRow}>
              <PreviewCard 
                orbVariant="green" 
                icon={<Search size={14} color="#10B981" />} 
                title="Find Players" 
                subtitle="By songs known" 
              />
              <PreviewCard 
                orbVariant="gold" 
                icon={<Zap size={14} color="#F59E0B" />} 
                title="Stage Mode" 
                subtitle="Live chords" 
              />
            </View>
          </View>

          <View style={styles.headingContainer}>
            <Heading style={styles.heading}>
              Welcome to{' '}
              <View style={styles.logoRow}>
                <Text style={styles.logoTukar}>Tukar</Text>
                <Text style={styles.logoTa}>Ta</Text>
              </View>
            </Heading>
            <Paragraph style={styles.subtitle}>
              Build smarter setlists. Find musicians who already know your songs.
            </Paragraph>
          </View>
        </View>

        <View style={styles.authSection}>
          <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8} onPress={handleGoogleLogin}>
            <View style={styles.googleIconPlaceholder}>
               <View style={styles.googleG} />
            </View>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function PreviewCard({ orbVariant, icon, title, subtitle }: any) {
  return (
    <GlassCard style={styles.previewCard} intensity={45}>
      <Orb variant={orbVariant} size={30}>
        {icon}
      </Orb>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071420',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 40,
  },
  artSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  previewGrid: {
    width: '100%',
    gap: 12,
    marginBottom: 40,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  previewCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
  },
  cardSubtitle: {
    fontSize: 9,
    color: 'rgba(200, 215, 235, 0.4)',
    fontFamily: 'DM Sans',
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  logoTukar: {
    color: '#00D4FF',
    fontFamily: 'DM Sans Medium',
  },
  logoTa: {
    color: '#F0F4FF',
    fontFamily: 'DM Sans Bold',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    color: 'rgba(200, 215, 235, 0.6)',
    fontFamily: 'DM Sans',
  },
  authSection: {
    paddingHorizontal: 24,
    gap: 16,
  },
  googleBtn: {
    backgroundColor: '#FFF',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  googleIconPlaceholder: {
    width: 20,
    height: 20,
  },
  googleG: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4285F4',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  googleBtnText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'DM Sans Bold',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(150, 175, 200, 0.35)',
    fontFamily: 'DM Sans',
  },
});
