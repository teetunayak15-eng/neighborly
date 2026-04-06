import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { Notification } from '@/src/types';
import { useAuth } from '@/contexts/AuthContext';
import { timeAgo } from '@/src/lib/utils';
import colors from '@/constants/colors';

const C = colors.light;

function getNotifIcon(type: string) {
  switch (type) {
    case 'help_requested': return 'help-circle';
    case 'offer_accepted': return 'check-circle';
    case 'message': return 'message-square';
    case 'review': return 'star';
    default: return 'bell';
  }
}

function getNotifColor(type: string) {
  switch (type) {
    case 'help_requested': return C.primary;
    case 'offer_accepted': return C.success;
    case 'message': return '#2196F3';
    case 'review': return '#FFC107';
    default: return C.primary;
  }
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)));
    });
  }, [user]);

  const paddingTop = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop }]}>
      <Text style={styles.title}>Notifications</Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="bell-off" size={48} color={C.mutedForeground} />
            <Text style={styles.emptyTitle}>All quiet here</Text>
            <Text style={styles.emptyText}>
              You'll be notified when neighbors interact with your posts.
            </Text>
          </View>
        )}
        renderItem={({ item: n }) => {
          const color = getNotifColor(n.type);
          return (
            <View style={[styles.notifCard, !n.read && styles.notifCardUnread]}>
              <View style={[styles.notifIcon, { backgroundColor: color + '15' }]}>
                <Feather name={getNotifIcon(n.type) as any} size={20} color={color} />
              </View>
              <View style={styles.notifBody}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.notifMsg}>{n.message}</Text>
                {n.createdAt?.toDate && (
                  <Text style={styles.notifTime}>{timeAgo(n.createdAt.toDate())}</Text>
                )}
              </View>
              {!n.read && <View style={styles.unreadDot} />}
            </View>
          );
        }}
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
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: C.text,
  },
  notifMsg: {
    fontSize: 13,
    color: C.mutedForeground,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: C.mutedForeground,
    marginTop: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
    marginTop: 4,
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
