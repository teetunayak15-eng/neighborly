import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { ShoppingBag, Heart, MapPin, PlusCircle, ShieldCheck, SlidersHorizontal } from 'lucide-react-native';
import { MotiView } from 'moti';
import { NativeButton } from './components/NativeButton';
import { NativeCard } from './components/NativeCard';
import { Post } from './types';
import { cn, formatDistance } from './lib/utils';

interface HomeFeedProps {
  posts: Post[];
  userLocation: { lat: number, lng: number };
  onPostClick: (post: Post) => void;
  onAddPost: () => void;
}

export const HomeFeed = ({ posts, userLocation, onPostClick, onAddPost }: HomeFeedProps) => {
  const [filter, setFilter] = useState<'all' | 'request' | 'offer'>('all');
  const [radius, setRadius] = useState<number>(10);
  
  const filteredPosts = posts.filter(p => {
    const typeMatch = filter === 'all' || p.type === filter;
    if (!typeMatch) return false;
    if (!p.location) return true;
    const dist = formatDistance(userLocation.lat, userLocation.lng, p.location.latitude, p.location.longitude);
    return dist <= radius;
  });

  const renderHeader = () => (
    <View className="space-y-6 mb-6">
      <View className="relative rounded-3xl overflow-hidden shadow-xl" style={{ height: 256 }}>
        <Image 
          source={{ uri: "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?auto=format&fit=crop&q=80&w=1000" }} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/40 flex flex-col justify-end p-8">
          <Text className="text-3xl font-bold text-white mb-2">Good morning, Neighbor.</Text>
          <Text className="text-white/80 text-lg">There are {posts.length} new ways to help today.</Text>
        </View>
      </View>

      <View className="space-y-4">
        <View className="flex-row gap-2 p-1 bg-surface-container rounded-full">
          {['all', 'request', 'offer'].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f as any)}
              className={cn(
                'px-6 py-2 rounded-full transition-all',
                filter === f ? 'bg-primary shadow-sm' : ''
              )}
            >
              <Text className={cn(
                'text-sm font-bold capitalize',
                filter === f ? 'text-on-primary' : 'text-on-surface-variant'
              )}>
                {f === 'all' ? 'All Activity' : f + 's'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/10">
          <View className="flex-row items-center gap-2 mb-3">
            <SlidersHorizontal size={16} color="#6750A4" />
            <Text className="text-xs font-bold text-on-surface uppercase tracking-widest">Neighborhood Radius</Text>
          </View>
          <View className="flex-row gap-2">
            {[2, 5, 10, 25, 50].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRadius(r)}
                className={cn(
                  'flex-1 py-2 rounded-xl items-center justify-center border',
                  radius === r ? 'bg-primary/10 border-primary' : 'border-outline-variant/30'
                )}
              >
                <Text className={cn(
                  'text-xs font-bold',
                  radius === r ? 'text-primary' : 'text-on-surface-variant'
                )}>
                  {r}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          <View className="items-center py-12">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
              <Heart size={40} color="#6750A4" />
            </View>
            <Text className="text-xl font-bold text-on-surface mb-2">No posts in your area</Text>
            <Text className="text-on-surface-variant text-center mb-8">Be the first to make a difference in your neighborhood!</Text>
            <NativeButton onPress={onAddPost} className="px-8">
              <Text className="text-on-primary font-bold">Create a Post</Text>
            </NativeButton>
          </View>
        )}
        renderItem={({ item: post, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 50 }}
            className="mb-4"
          >
            <TouchableOpacity onPress={() => onPostClick(post)} activeOpacity={0.9}>
              <NativeCard>
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className={cn(
                      'w-12 h-12 rounded-2xl items-center justify-center',
                      post.type === 'request' ? 'bg-primary/10' : 'bg-secondary/10'
                    )}>
                      {post.type === 'request' ? <ShoppingBag size={24} color="#6750A4" /> : <Heart size={24} color="#625B71" />}
                    </View>
                    <View>
                      <Text className={cn('text-[10px] font-bold uppercase tracking-widest', post.type === 'request' ? 'text-primary' : 'text-secondary')}>
                        {post.type}
                      </Text>
                      <Text className="font-bold text-lg leading-tight text-on-surface">{post.title}</Text>
                    </View>
                  </View>
                  {post.urgency === 'urgent' && (
                    <View className="bg-error-container px-3 py-1 rounded-sm">
                      <Text className="text-on-error-container text-[10px] font-extrabold uppercase tracking-widest">
                        Urgent
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-on-surface-variant text-sm mb-6" numberOfLines={2}>{post.description}</Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Image 
                      source={{ uri: post.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=random` }} 
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                    />
                    <View>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-xs font-bold text-on-surface">{post.authorName}</Text>
                        {post.authorIsVerified && <ShieldCheck size={12} color="#6750A4" />}
                      </View>
                      <View className="flex-row items-center gap-1">
                        <MapPin size={10} color="#79747E" />
                        <Text className="text-[10px] text-outline">
                          {post.location ? `${formatDistance(userLocation.lat, userLocation.lng, post.location.latitude, post.location.longitude)}km away` : 'Location unknown'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <NativeButton variant="primary" className="px-4 py-2" onPress={() => onPostClick(post)}>
                    <Text className="text-on-primary text-xs font-bold">
                      {post.type === 'request' ? "I can help!" : "I'm interested"}
                    </Text>
                  </NativeButton>
                </View>
              </NativeCard>
            </TouchableOpacity>
          </MotiView>
        )}
      />
    </View>
  );
};
