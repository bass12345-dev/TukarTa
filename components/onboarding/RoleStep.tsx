import { Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { ROLES } from './constants';
import { StepProps } from './types';

export const RoleStep: React.FC<StepProps> = ({ data, updateData }) => {
  const toggleRole = (roleId: string) => {
    const newRoles = data.selectedRoles.includes(roleId)
      ? data.selectedRoles.filter(r => r !== roleId)
      : [...data.selectedRoles, roleId];
    updateData({ selectedRoles: newRoles });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you play?</Text>
      <Text style={styles.subtitle}>Choose all roles that apply. Bands can search for you based on this.</Text>
      
      <View style={styles.roleGrid}>
        {ROLES.map((role) => {
          const isActive = data.selectedRoles.includes(role.id);
          return (
            <TouchableOpacity
              key={role.id}
              onPress={() => toggleRole(role.id)}
              activeOpacity={0.8}
            >
              <GlassCard
                style={[styles.roleCard, { height: 70 }, isActive && styles.roleCardActive]}
                contentContainerStyle={styles.roleCardContent}
                intensity={isActive ? 30 : 12}
                noPadding
              >
                  <View style={[
                    styles.roleIconBox, 
                    { backgroundColor: `${role.color}15` }
                  ]}>
                    <role.icon size={22} color={role.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.roleLabel}>{role.label}</Text>
                    <Text style={styles.roleSub}>{role.sub}</Text>
                  </View>
                  <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                    {isActive && <Check size={14} color="#FFF" strokeWidth={3} />}
                  </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', fontFamily: 'DM Sans Bold' },
  subtitle: { fontSize: 15, color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'DM Sans', lineHeight: 22, marginBottom: 20 },
  roleGrid: { gap: 8 },
  roleCard: {
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  roleCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  roleCardActive: { 
    borderColor: '#00D4FF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
  },
  roleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#FFF', 
    fontFamily: 'DM Sans Bold',
  },
  roleSub: { 
    fontSize: 12, 
    color: 'rgba(255, 255, 255, 0.5)', 
    fontFamily: 'DM Sans' 
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { 
    backgroundColor: '#00D4FF', 
    borderColor: '#00D4FF' 
  },
});
