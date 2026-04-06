import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { User, ShieldCheck, Award, Heart, LogOut, ChevronRight, Star, CheckCircle, Edit2, X } from 'lucide-react-native';
import { UserProfile } from '../../types';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { NativeButton } from '../NativeButton';
import { NativeCard } from '../NativeCard';

interface ProfileScreenProps {
  profile: UserProfile | null;
}

export const ProfileScreen = ({ profile }: ProfileScreenProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!profile) return null;

  const handleVerify = async () => {
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        isVerified: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const handleEarnBadge = async () => {
    const badges = ['top-helper', 'good-samaritan', 'community-hero', 'early-adopter'];
    const randomBadge = badges[Math.floor(Math.random() * badges.length)];
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        badges: arrayUnion(randomBadge)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  const openEditModal = () => {
    setEditName(profile.displayName || '');
    setEditPhotoUrl(profile.photoURL || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName: editName.trim(),
        ...(editPhotoUrl.trim() ? { photoURL: editPhotoUrl.trim() } : {})
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-6 bg-surface">
      <View className="items-center mb-10">
        <View className="relative">
          <Image 
            source={{ uri: profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=random` }} 
            className="w-32 h-32 rounded-full border-4 border-primary/10"
            style={{ width: 128, height: 128, borderRadius: 64 }}
          />
          {profile.isVerified && (
            <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-4 border-surface shadow-lg">
              <ShieldCheck size={20} color="white" />
            </View>
          )}
          <TouchableOpacity 
            onPress={openEditModal}
            className="absolute top-0 right-0 bg-surface-container-high p-2 rounded-full shadow-md border border-outline-variant"
          >
            <Edit2 size={16} color="#49454F" />
          </TouchableOpacity>
        </View>
        <Text className="text-3xl font-bold mt-6 text-on-surface">{profile.displayName}</Text>
        <Text className="text-on-surface-variant text-lg">Neighbor since {profile.createdAt?.toDate().getFullYear()}</Text>
      </View>

      <View className="flex-row gap-4 mb-10">
        <View className="flex-1 bg-surface-container-low p-6 rounded-3xl items-center shadow-sm">
          <Text className="text-2xl font-bold text-primary">{profile.reliabilityScore || 100}%</Text>
          <Text className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">Reliability</Text>
        </View>
        <View className="flex-1 bg-surface-container-low p-6 rounded-3xl items-center shadow-sm">
          <Text className="text-2xl font-bold text-primary">{profile.neighborsHelped || 0}</Text>
          <Text className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">Helped</Text>
        </View>
        <View className="flex-1 bg-surface-container-low p-6 rounded-3xl items-center shadow-sm">
          <Text className="text-2xl font-bold text-primary">{profile.thankYous || 0}</Text>
          <Text className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">Thanks</Text>
        </View>
      </View>

      <View className="space-y-4 mb-8">
        {!profile.isVerified && (
          <TouchableOpacity onPress={handleVerify} activeOpacity={0.8}>
            <NativeCard className="flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                <ShieldCheck size={24} color="#6750A4" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-on-surface">Verify Your Identity</Text>
                <Text className="text-sm text-on-surface-variant">Build trust in your community</Text>
              </View>
              <ChevronRight size={20} color="#79747E" />
            </NativeCard>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleEarnBadge} activeOpacity={0.8}>
          <NativeCard className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full bg-secondary/10 items-center justify-center">
              <Award size={24} color="#625B71" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-on-surface">Earn a Badge</Text>
              <Text className="text-sm text-on-surface-variant">Complete tasks to earn recognition</Text>
            </View>
            <ChevronRight size={20} color="#79747E" />
          </NativeCard>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => signOut(auth)} activeOpacity={0.8}>
          <NativeCard className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full bg-error/10 items-center justify-center">
              <LogOut size={24} color="#B3261E" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-error">Sign Out</Text>
              <Text className="text-sm text-on-surface-variant">See you next time, neighbor!</Text>
            </View>
          </NativeCard>
        </TouchableOpacity>
      </View>

      {profile.badges && profile.badges.length > 0 && (
        <View className="mb-8">
          <Text className="text-sm font-bold text-outline uppercase tracking-widest mb-4">Badges</Text>
          <View className="flex-row flex-wrap gap-2">
            {profile.badges.map((badge, i) => (
              <View key={i} className="bg-primary/10 px-4 py-2 rounded-full">
                <Text className="text-primary text-xs font-bold">{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Modal visible={isEditing} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-surface rounded-t-3xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-on-surface">Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)} className="p-2 bg-surface-container rounded-full">
                <X size={24} color="#49454F" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4 mb-8">
              <View>
                <Text className="text-sm font-bold text-on-surface-variant mb-2">Display Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor="#79747E"
                  className="bg-surface-container-low p-4 rounded-2xl text-on-surface font-medium border border-outline-variant"
                />
              </View>

              <View>
                <Text className="text-sm font-bold text-on-surface-variant mb-2">Profile Photo URL (Optional)</Text>
                <TextInput
                  value={editPhotoUrl}
                  onChangeText={setEditPhotoUrl}
                  placeholder="https://example.com/photo.jpg"
                  placeholderTextColor="#79747E"
                  className="bg-surface-container-low p-4 rounded-2xl text-on-surface font-medium border border-outline-variant"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            <NativeButton 
              onPress={handleSaveProfile} 
              disabled={isSaving || !editName.trim()}
              className="w-full py-4"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </NativeButton>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};
