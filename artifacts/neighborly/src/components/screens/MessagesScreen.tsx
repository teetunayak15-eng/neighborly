import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { MessageSquare, ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';
import { ChatRoom } from '../../types';
import { NativeCard } from '../NativeCard';
import { formatDistanceToNow } from 'date-fns';

interface MessagesScreenProps {
  chatRooms: ChatRoom[];
  onRoomClick: (room: ChatRoom) => void;
  currentUserId: string;
}

export const MessagesScreen = ({ chatRooms, onRoomClick, currentUserId }: MessagesScreenProps) => {
  return (
    <View className="flex-1 bg-surface">
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-on-surface mb-2">Messages</Text>
        <Text className="text-on-surface-variant text-sm">Your active conversations with neighbors.</Text>
      </View>

      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
              <MessageSquare size={32} color="#6750A4" />
            </View>
            <Text className="text-lg font-bold text-on-surface">No messages yet</Text>
            <Text className="text-sm text-on-surface-variant text-center px-10">
              When you offer help or request it, your conversations will appear here.
            </Text>
          </View>
        )}
        renderItem={({ item: room }) => (
          <MotiView
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            className="mb-3"
          >
            <TouchableOpacity onPress={() => onRoomClick(room)} activeOpacity={0.7}>
              <NativeCard className="flex-row items-center gap-4 py-4">
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                  <MessageSquare size={24} color="#6750A4" />
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="font-bold text-on-surface">Neighbor</Text>
                    {room.updatedAt && (
                      <Text className="text-[10px] text-outline">
                        {formatDistanceToNow(room.updatedAt.toDate(), { addSuffix: true })}
                      </Text>
                    )}
                  </View>
                  <Text className="text-sm text-on-surface-variant" numberOfLines={1}>
                    {room.lastMessage || 'Start a conversation...'}
                  </Text>
                </View>
                <ChevronRight size={16} color="#79747E" />
              </NativeCard>
            </TouchableOpacity>
          </MotiView>
        )}
      />
    </View>
  );
};
