import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { auth, db } from '@/src/firebase';
import { ChatMessage } from '@/src/types';
import colors from '@/constants/colors';

const C = colors.light;

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, `chatRooms/${id}/messages`),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
  }, [id]);

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || !auth.currentUser || !id) return;
    setText('');
    try {
      await addDoc(collection(db, `chatRooms/${id}/messages`), {
        senderId: auth.currentUser.uid,
        text: trimmed,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chatRooms', id), {
        lastMessage: trimmed,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Send error', e);
    }
  }

  const myId = auth.currentUser?.uid;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={60}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messageList, { paddingTop: 16 }]}
        renderItem={({ item: msg }) => {
          const isMine = msg.senderId === myId;
          return (
            <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
              <Text style={[styles.bubbleText, isMine ? styles.myBubbleText : styles.theirBubbleText]}>
                {msg.text}
              </Text>
              {msg.createdAt?.toDate && (
                <Text style={[styles.bubbleTime, isMine ? styles.myBubbleTime : styles.theirBubbleTime]}>
                  {msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          );
        }}
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0) + 8 }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={C.mutedForeground}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Feather name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  messageList: {
    padding: 16,
    gap: 8,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  myBubbleText: {
    color: '#FFFFFF',
  },
  theirBubbleText: {
    color: C.text,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myBubbleTime: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  theirBubbleTime: {
    color: C.mutedForeground,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: C.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: C.mutedForeground,
  },
});
