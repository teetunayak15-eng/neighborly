import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { NativeButton } from '../NativeButton';
import { PostType, UrgencyLevel, UserProfile } from '../../types';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';

interface CreatePostScreenProps {
  onBack: () => void;
  userLocation: { lat: number, lng: number };
  profile: UserProfile | null;
}

export const CreatePostScreen = ({ onBack, userLocation, profile }: CreatePostScreenProps) => {
  const [type, setType] = useState<PostType>('request');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in to post.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const postData = {
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Neighbor',
        authorPhoto: auth.currentUser.photoURL || '',
        authorIsVerified: profile?.isVerified || false,
        type,
        title: title.trim(),
        category,
        description: description.trim(),
        urgency,
        location: {
          latitude: userLocation.lat,
          longitude: userLocation.lng
        },
        status: 'open',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'posts'), postData);
      onBack();
    } catch (err: any) {
      console.error('Error creating post:', err);
      let msg = 'Failed to create post. Please try again.';
      if (err.message && err.message.includes('permission-denied')) {
        msg = 'Permission denied. Please check your account permissions.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-6 bg-surface">
      <View className="flex-row items-center gap-4 mb-8">
        <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-surface-container">
          <ArrowLeft size={24} color="#1D1B20" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-on-surface">Create Post</Text>
      </View>

      <View className="space-y-6">
        <View className="flex-row gap-2 p-1 bg-surface-container rounded-full w-full">
          {['request', 'offer'].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t as any)}
              className={cn(
                'flex-1 py-3 rounded-full items-center justify-center',
                type === t ? 'bg-primary shadow-sm' : ''
              )}
            >
              <Text className={cn(
                'font-bold capitalize',
                type === t ? 'text-on-primary' : 'text-on-surface-variant'
              )}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View>
          <Text className="text-sm font-bold text-outline uppercase tracking-widest mb-2">Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need or want to share?"
            placeholderTextColor="#79747E"
            className="w-full p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-on-surface"
          />
        </View>

        <View>
          <Text className="text-sm font-bold text-outline uppercase tracking-widest mb-2">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add more details..."
            placeholderTextColor="#79747E"
            multiline
            numberOfLines={4}
            className="w-full p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-on-surface min-h-[120px]"
          />
        </View>

        <View>
          <Text className="text-sm font-bold text-outline uppercase tracking-widest mb-2">Urgency</Text>
          <View className="flex-row gap-2">
            {['low', 'medium', 'urgent'].map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => setUrgency(u as any)}
                className={cn(
                  'flex-1 py-2 rounded-lg items-center justify-center border transition-all',
                  urgency === u ? 'bg-primary/10 border-primary' : 'border-outline-variant'
                )}
              >
                <Text className={cn(
                  'text-[10px] font-bold uppercase tracking-widest',
                  urgency === u ? 'text-primary' : 'text-outline'
                )}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {error && (
          <View className="p-4 bg-error/10 border border-error/20 rounded-2xl">
            <Text className="text-error text-sm text-center">{error}</Text>
          </View>
        )}

        <NativeButton 
          onPress={handleSubmit} 
          loading={loading} 
          className="w-full py-4"
        >
          Post to Neighborhood
        </NativeButton>
      </View>
    </ScrollView>
  );
};
