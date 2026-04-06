import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/src/firebase';
import { PostType, UrgencyLevel } from '@/src/types';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';

const C = colors.light;

const CATEGORIES = ['General', 'Food', 'Tools', 'Transport', 'Skills', 'Pet Care', 'Other'];
const URGENCIES: { value: UrgencyLevel; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#4CAF50' },
  { value: 'medium', label: 'Medium', color: '#FF9800' },
  { value: 'high', label: 'High', color: '#F44336' },
  { value: 'urgent', label: 'Urgent!', color: '#B71C1C' },
];

const userLocation = { lat: 47.6062, lng: -122.3321 };

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [type, setType] = useState<PostType>('request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!auth.currentUser) {
      Alert.alert('Not signed in', 'Please sign in to post.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing info', 'Title and description are required.');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Neighbor',
        authorPhoto: auth.currentUser.photoURL || '',
        authorIsVerified: profile?.isVerified || false,
        type,
        title: title.trim(),
        category,
        description: description.trim(),
        urgency,
        location: { latitude: userLocation.lat, longitude: userLocation.lng },
        status: 'open',
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setDescription('');
      setCategory('General');
      setUrgency('medium');
      Alert.alert('Posted!', 'Your post is now live in your neighborhood.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const paddingTop = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <ScrollView
      style={[styles.container, { paddingTop }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>New Post</Text>

      {/* Type selector */}
      <View style={styles.typeRow}>
        {(['request', 'offer'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, type === t && styles.typeBtnActive]}
            onPress={() => setType(t)}
          >
            <Feather
              name={t === 'request' ? 'help-circle' : 'gift'}
              size={18}
              color={type === t ? '#FFFFFF' : C.mutedForeground}
            />
            <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
              {t === 'request' ? 'I need help' : 'I can help'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="What do you need or want to share?"
          placeholderTextColor={C.mutedForeground}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe it in more detail..."
          placeholderTextColor={C.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
      </View>

      {/* Category */}
      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipWrap}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Urgency */}
      <View style={styles.field}>
        <Text style={styles.label}>Urgency</Text>
        <View style={styles.urgencyRow}>
          {URGENCIES.map((u) => (
            <TouchableOpacity
              key={u.value}
              style={[
                styles.urgencyBtn,
                urgency === u.value && { backgroundColor: u.color + '20', borderColor: u.color },
              ]}
              onPress={() => setUrgency(u.value)}
            >
              <Text style={[styles.urgencyText, urgency === u.value && { color: u.color, fontWeight: '700' as const }]}>
                {u.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Feather name="send" size={18} color="#FFFFFF" />
            <Text style={styles.submitText}>Post to Neighborhood</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: C.text,
    marginBottom: 20,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  typeBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: C.mutedForeground,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: C.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
  },
  textarea: {
    minHeight: 100,
    paddingTop: 14,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.primary + '15',
    borderColor: C.primary,
  },
  chipText: {
    fontSize: 13,
    color: C.mutedForeground,
  },
  chipTextActive: {
    color: C.primary,
    fontWeight: '700' as const,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  urgencyText: {
    fontSize: 13,
    color: C.mutedForeground,
    fontWeight: '500' as const,
  },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
