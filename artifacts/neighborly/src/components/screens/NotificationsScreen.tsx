import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Bell, ShoppingBag, CheckCircle2, MessageSquare, Star, Megaphone } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Notification } from '../../types';
import { NativeCard } from '../NativeCard';

interface NotificationsScreenProps {
  notifications: Notification[];
}

export const NotificationsScreen = ({ notifications }: NotificationsScreenProps) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'help_requested': return <ShoppingBag size={20} color="#6750A4" />;
      case 'offer_accepted': return <CheckCircle2 size={20} color="#4CAF50" />;
      case 'message': return <MessageSquare size={20} color="#2196F3" />;
      case 'review': return <Star size={20} color="#FFC107" />;
      default: return <Megaphone size={20} color="#6750A4" />;
    }
  };

  return (
    <View className="flex-1 p-6 bg-surface">
      <View className="flex-row items-center justify-between mb-8">
        <Text className="text-3xl font-bold text-on-surface">Notifications</Text>
        <View className="w-10 h-10 rounded-full bg-surface-container items-center justify-center">
          <Bell size={20} color="#1D1B20" />
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <View className="items-center py-12">
            <Text className="text-on-surface-variant text-lg">No notifications yet.</Text>
          </View>
        )}
        renderItem={({ item: n }) => (
          <MotiView
            from={{ opacity: 0, translateY: 5 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="mb-4"
          >
            <TouchableOpacity activeOpacity={0.8}>
              <NativeCard unread={!n.read}>
                <View className="flex-row gap-4">
                  <View className="w-12 h-12 rounded-full bg-surface-container items-center justify-center">
                    {getIcon(n.type)}
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-on-surface mb-1">{n.title}</Text>
                    <Text className="text-sm text-on-surface-variant mb-2">{n.message}</Text>
                    <Text className="text-[10px] text-outline uppercase tracking-widest">
                      {n.createdAt?.toDate().toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </NativeCard>
            </TouchableOpacity>
          </MotiView>
        )}
      />
    </View>
  );
};
