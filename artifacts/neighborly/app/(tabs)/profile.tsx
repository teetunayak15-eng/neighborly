import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { signOut } from '@/src/firebase';
import { db } from '@/src/firebase';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';

const C = colors.light;

const BADGES: Record<string, string> = {
  'top-helper': 'Top Helper',
  'good-samaritan': 'Good Samaritan',
  'community-hero': 'Community Hero',
  'early-adopter': 'Early Adopter',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  function openEdit() {
    setEditName(profile?.displayName || '');
    setEditModal(true);
  }

  async function handleSave() {
    if (!editName.trim() || !user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editName.trim(),
      });
      await refreshProfile();
      setEditModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEarnBadge() {
    if (!user) return;
    const options = Object.keys(BADGES);
    const badge = options[Math.floor(Math.random() * options.length)];
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        badges: arrayUnion(badge),
        neighborsHelped: (profile.neighborsHelped || 0) + 1,
      });
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  const paddingTop = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <>
      <ScrollView
        style={[styles.container, { paddingTop }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {(profile.displayName || 'N')[0].toUpperCase()}
            </Text>
            {profile.isVerified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{profile.displayName}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          <Text style={styles.memberSince}>
            Neighbor since {profile.createdAt?.toDate?.()?.getFullYear?.() || new Date().getFullYear()}
          </Text>

          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Feather name="edit-2" size={14} color={C.primary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.reliabilityScore || 100}%</Text>
            <Text style={styles.statLabel}>Reliability</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.neighborsHelped || 0}</Text>
            <Text style={styles.statLabel}>Helped</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.thankYous || 0}</Text>
            <Text style={styles.statLabel}>Thank Yous</Text>
          </View>
        </View>

        {/* Badges */}
        {(profile.badges || []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.badgeWrap}>
              {(profile.badges || []).map((b) => (
                <View key={b} style={styles.badge}>
                  <Feather name="award" size={14} color={C.primary} />
                  <Text style={styles.badgeText}>{BADGES[b] || b}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity style={styles.actionRow} onPress={handleEarnBadge}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFD700' + '20' }]}>
              <Feather name="award" size={20} color="#FFD700" />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionLabel}>Earn a Badge</Text>
              <Text style={styles.actionDesc}>Record a good deed</Text>
            </View>
            <Feather name="chevron-right" size={18} color={C.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
            <View style={[styles.actionIcon, { backgroundColor: C.error + '15' }]}>
              <Feather name="log-out" size={20} color={C.error} />
            </View>
            <View style={styles.actionBody}>
              <Text style={[styles.actionLabel, { color: C.error }]}>Sign Out</Text>
            </View>
            <Feather name="chevron-right" size={18} color={C.mutedForeground} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Feather name="x" size={22} color={C.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={C.mutedForeground}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: C.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: C.mutedForeground,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 13,
    color: C.mutedForeground,
    marginBottom: 16,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: C.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: C.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: C.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: C.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primary + '10',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: C.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: C.text,
  },
  actionDesc: {
    fontSize: 13,
    color: C.mutedForeground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: C.text,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: C.mutedForeground,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
