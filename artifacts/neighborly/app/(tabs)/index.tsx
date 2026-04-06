import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/src/firebase';
import { Post, ChatRoom } from '@/src/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistance, timeAgo } from '@/src/lib/utils';
import colors from '@/constants/colors';

const C = colors.light;
const CATEGORIES = ['All', 'Food', 'Tools', 'Transport', 'Skills', 'Pet Care', 'Other'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'request' | 'offer'>('all');
  const [category, setCategory] = useState('All');
  const userLocation = { lat: 47.6062, lng: -122.3321 };

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  async function openOrCreateChat(post: Post) {
    if (!user) return;
    if (post.authorId === user.uid) return;
    try {
      const roomId = [user.uid, post.authorId].sort().join('_') + '_' + post.id;
      const roomRef = doc(db, 'chatRooms', roomId);
      await setDoc(
        roomRef,
        {
          participants: [user.uid, post.authorId],
          postId: post.id,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      router.push(`/chat/${roomId}`);
    } catch (e) {
      console.error('Chat open error', e);
    }
  }

  const filtered = posts.filter((p) => {
    if (filter !== 'all' && p.type !== filter) return false;
    if (category !== 'All' && p.category !== category) return false;
    return true;
  });

  const paddingBottom = insets.bottom + 64 + 16;

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, Neighbor</Text>
          <Text style={styles.subGreeting}>{filtered.length} posts nearby</Text>
        </View>
        <View style={styles.avatarBox}>
          <Feather name="map-pin" size={20} color={C.primary} />
        </View>
      </View>

      {/* Type filter */}
      <View style={styles.filterRow}>
        {(['all', 'request', 'offer'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f === 'all' ? 'All' : f === 'request' ? 'Requests' : 'Offers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catBtn, category === item && styles.catBtnActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.catBtnText, category === item && styles.catBtnTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.categoryBar}
      />

      {/* Posts */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(true)}
            tintColor={C.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={C.mutedForeground} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Be the first to post in your neighborhood!</Text>
          </View>
        )}
        renderItem={({ item: post }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={[styles.typeBadge, post.type === 'request' ? styles.requestBadge : styles.offerBadge]}>
                <Text style={[styles.typeBadgeText, post.type === 'request' ? styles.requestBadgeText : styles.offerBadgeText]}>
                  {post.type.toUpperCase()}
                </Text>
              </View>
              {post.urgency === 'urgent' && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </View>

            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postDesc} numberOfLines={2}>{post.description}</Text>

            <View style={styles.postFooter}>
              <View style={styles.authorRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>
                    {(post.authorName || 'N')[0].toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  {post.location && (
                    <Text style={styles.distance}>
                      {formatDistance(userLocation.lat, userLocation.lng, post.location.latitude, post.location.longitude)}km away
                    </Text>
                  )}
                </View>
              </View>

              {user && post.authorId !== user.uid && (
                <TouchableOpacity
                  style={styles.helpBtn}
                  onPress={() => openOrCreateChat(post)}
                >
                  <Text style={styles.helpBtnText}>
                    {post.type === 'request' ? 'Help' : 'Interested'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {post.createdAt?.toDate && (
              <Text style={styles.timeAgo}>{timeAgo(post.createdAt.toDate())}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'web' ? 67 : 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: C.text,
  },
  subGreeting: {
    fontSize: 14,
    color: C.mutedForeground,
    marginTop: 2,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
  },
  filterBtnActive: {
    backgroundColor: C.primary,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: C.mutedForeground,
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
  },
  categoryBar: {
    maxHeight: 44,
    marginBottom: 8,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.muted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catBtnActive: {
    backgroundColor: C.primary + '15',
    borderColor: C.primary,
  },
  catBtnText: {
    fontSize: 13,
    color: C.mutedForeground,
    fontWeight: '500' as const,
  },
  catBtnTextActive: {
    color: C.primary,
    fontWeight: '700' as const,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requestBadge: {
    backgroundColor: C.primary + '15',
  },
  offerBadge: {
    backgroundColor: C.success + '15',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  requestBadgeText: {
    color: C.primary,
  },
  offerBadgeText: {
    color: C.success,
  },
  urgentBadge: {
    backgroundColor: C.errorContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: C.error,
    letterSpacing: 0.5,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: C.text,
    marginBottom: 6,
  },
  postDesc: {
    fontSize: 14,
    color: C.mutedForeground,
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: C.primary,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: C.text,
  },
  distance: {
    fontSize: 11,
    color: C.mutedForeground,
  },
  helpBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  helpBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  timeAgo: {
    fontSize: 11,
    color: C.mutedForeground,
    marginTop: 10,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: C.text,
  },
  emptyText: {
    fontSize: 14,
    color: C.mutedForeground,
    textAlign: 'center',
  },
});

