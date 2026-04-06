import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, Send, User } from 'lucide-react-native';
import { ChatRoom, ChatMessage } from '../../types';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { cn } from '../../lib/utils';

interface ChatRoomScreenProps {
  room: ChatRoom;
  onBack: () => void;
}

export const ChatRoomScreen = ({ room, onBack }: ChatRoomScreenProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const q = query(collection(db, `chatRooms/${room.id}/messages`), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    }, (error) => {
      console.error('Error fetching messages:', error);
      handleFirestoreError(error, OperationType.LIST, `chatRooms/${room.id}/messages`);
    });
  }, [room.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !auth.currentUser) return;
    const text = newMessage;
    setNewMessage('');
    try {
      await addDoc(collection(db, `chatRooms/${room.id}/messages`), {
        senderId: auth.currentUser.uid,
        text,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'chatRooms', room.id), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface"
      keyboardVerticalOffset={100}
    >
      <View className="flex-row items-center gap-4 p-6 border-b border-outline-variant/10">
        <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-surface-container">
          <ArrowLeft size={24} color="#1D1B20" />
        </TouchableOpacity>
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <User size={20} color="#6750A4" />
          </View>
          <View>
            <Text className="font-bold text-on-surface">Chat</Text>
            <Text className="text-[10px] text-outline">Active now</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item: msg }) => (
          <View className={cn(
            'flex flex-col max-w-[80%] mb-4',
            msg.senderId === auth.currentUser?.uid ? 'self-end items-end' : 'self-start items-start'
          )}>
            <View className={cn(
              'p-4 rounded-2xl',
              msg.senderId === auth.currentUser?.uid ? 'bg-primary rounded-tr-none' : 'bg-surface-container-highest rounded-tl-none'
            )}>
              <Text className={cn(
                'text-sm',
                msg.senderId === auth.currentUser?.uid ? 'text-on-primary' : 'text-on-surface'
              )}>
                {msg.text}
              </Text>
            </View>
            <Text className="text-[8px] text-outline mt-1">
              {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      />

      <View className="p-4 border-t border-outline-variant/10 flex-row items-center gap-3">
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#79747E"
          className="flex-1 p-4 bg-surface-container-low rounded-2xl text-on-surface"
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!newMessage.trim()}
          className="w-12 h-12 bg-primary rounded-full items-center justify-center shadow-md"
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
