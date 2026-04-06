import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { ChatRoom } from '@/src/types';
import { useAuth } from '@/contexts/AuthContext';
import { timeAgo } from '@/src/lib/utils';
import colors from '@/constants/colors';

const C = colors.light;

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatRoom)));
    });
  }, [user]);

  const paddingTop = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop }]}>
      <Text style={styles.title}>Messages</Text>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="message-circle" size={48} color={C.mutedForeground} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>
              When you connect with a neighbor, your chats will appear here.
            </Text>
          </View>
        )}
        renderItem={({ item: room }) => (
          <TouchableOpacity
            style={styles.roomCard}
            onPress={() => router.push(`/chat/${room.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.roomAvatar}>
              <Feather name="message-square" size={22} color={C.primary} />
            </View>
            <View style={styles.roomInfo}>
              <View style={styles.roomTopRow}>
                <Text style={styles.roomName}>Neighbor</Text>
                {room.updatedAt?.toDate && (
                  <Text style={styles.roomTime}>{timeAgo(room.updatedAt.toDate())}</Text>
                )}
              </View>
              <Text style={styles.roomLastMsg} numberOfLines={1}>
                {room.lastMessage || 'Start a conversation...'}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={C.mutedForeground} />
          </TouchableOpacity>
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
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: C.text,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 10,
  },
  roomAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomInfo: {
    flex: 1,
  },
  roomTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: C.text,
  },
  roomTime: {
    fontSize: 12,
    color: C.mutedForeground,
  },
  roomLastMsg: {
    fontSize: 14,
    color: C.mutedForeground,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
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
    lineHeight: 20,
  },
});
