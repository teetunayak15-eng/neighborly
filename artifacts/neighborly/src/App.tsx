import React, { useState, useEffect } from 'react';
import "./index.css";
import { View, Text, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { Home, Bell, MessageSquare, User, PlusCircle, MapPin, ChevronRight, ArrowLeft, Search } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import * as Location from 'expo-location';
import { 
  auth, 
  db, 
  OperationType, 
  handleFirestoreError,
  isMockConfig,
  testConnection
} from './components/firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp
} from 'firebase/firestore';
import { 
  Post, 
  UserProfile, 
  Notification, 
  ChatRoom
} from './types';
import { cn } from './lib/utils';

import { AuthScreen } from './components/screens/AuthScreen';
import { HomeFeed } from './HomeFeed';
import { CreatePostScreen } from './components/screens/CreatePostScreen';
import { ChatRoomScreen } from './components/screens/ChatRoomScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { MessagesScreen } from './components/screens/MessagesScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MapPicker } from './components/MapPicker';

const SetupScreen = () => (
  <View className="flex-1 items-center justify-center p-6 bg-surface">
    <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-8">
      <MapPin size={40} color="#6750A4" />
    </View>
    <Text className="text-3xl font-bold mb-4 text-on-surface">Setup Required</Text>
    <Text className="text-on-surface-variant mb-12 text-center text-lg">
      Please configure your Firebase settings to start using Neighborly.
    </Text>
  </View>
);

export function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [screen, setScreen] = useState<'home' | 'create' | 'chat' | 'profile' | 'notifications' | 'chat_room' | 'messages'>('home');
  const [lastScreen, setLastScreen] = useState<'home' | 'messages'>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [userLocation, setUserLocation] = useState({ lat: 47.6062, lng: -122.3321 });
  const [locationName, setLocationName] = useState('Detecting...');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [manualLat, setManualLat] = useState('47.61');
  const [manualLng, setManualLng] = useState('-122.33');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        setManualLat(latitude.toFixed(4));
        setManualLng(longitude.toFixed(4));
      }
    } catch (error) {
      console.warn("Geocoding error", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('Location Access Denied');
          return;
        }
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude
        });
        try {
          const reverseResults = await Location.reverseGeocodeAsync({ 
            latitude: location.coords.latitude, 
            longitude: location.coords.longitude 
          });
          if (reverseResults && reverseResults.length > 0) {
            const place = reverseResults[0];
            setLocationName(place.city || place.name || place.region || 'Current Location');
          } else {
            setLocationName('Current Location');
          }
        } catch (e) {
          setLocationName('Current Location');
        }
      } catch (error) {
        console.warn("Error getting location:", error);
        setLocationName('Location Unavailable');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    testConnection();
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const newProfile: Partial<UserProfile> = {
              uid: u.uid,
              displayName: u.displayName || 'Neighbor',
              email: u.email || '',
              photoURL: u.photoURL || '',
              reliabilityScore: 100,
              neighborsHelped: 0,
              thankYous: 0,
              completionCount: 0,
              isVerified: false,
              badges: [],
              role: 'user',
              createdAt: serverTimestamp() as any
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile as UserProfile);
          } else {
            setProfile(docSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error('Error fetching/creating profile:', error);
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    return onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    }, (error) => {
      console.error('Error fetching posts:', error);
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(20));
    return onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    }, (error) => {
      console.error('Error fetching notifications:', error);
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chatRooms'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'), limit(20));
    return onSnapshot(q, (snapshot) => {
      setChatRooms(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatRoom)));
    }, (error) => {
      console.error('Error fetching chat rooms:', error);
      handleFirestoreError(error, OperationType.LIST, 'chatRooms');
    });
  }, [user]);

  if (isMockConfig) return <SetupScreen />;
  if (!user) return <AuthScreen />;

  const handlePostClick = async (post: Post) => {
    if (post.authorId === user.uid) return;
    try {
      const roomId = [user.uid, post.authorId].sort().join('_') + '_' + post.id;
      const roomRef = doc(db, 'chatRooms', roomId);
      const roomSnap = await getDoc(roomRef);
      
      const roomData: ChatRoom = roomSnap.exists() 
        ? { id: roomSnap.id, ...roomSnap.data() } as ChatRoom
        : {
            id: roomId,
            postId: post.id,
            participants: [user.uid, post.authorId],
            updatedAt: serverTimestamp() as any,
            createdAt: serverTimestamp() as any
          };

      if (!roomSnap.exists()) {
        await setDoc(roomRef, roomData);
      }
      
      setActiveChat(roomData);
      setLastScreen(screen === 'chat_room' ? lastScreen : screen as any);
      setScreen('chat_room');
    } catch (error) {
      console.error('Error handling post click:', error);
      handleFirestoreError(error, OperationType.WRITE, 'chatRooms');
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <HomeFeed posts={posts} userLocation={userLocation} onPostClick={handlePostClick} onAddPost={() => setScreen('create')} />;
      case 'create': return <CreatePostScreen onBack={() => setScreen('home')} userLocation={userLocation} profile={profile} />;
      case 'chat_room': return activeChat ? <ChatRoomScreen room={activeChat} onBack={() => setScreen(lastScreen)} /> : null;
      case 'messages': return <MessagesScreen chatRooms={chatRooms} currentUserId={user?.uid || ''} onRoomClick={(room) => { setActiveChat(room); setLastScreen('messages'); setScreen('chat_room'); }} />;
      case 'notifications': return <NotificationsScreen notifications={notifications} />;
      case 'profile': return <ProfileScreen profile={profile} />;
      default: return <HomeFeed posts={posts} userLocation={userLocation} onPostClick={handlePostClick} onAddPost={() => setScreen('create')} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, height: '100%' }} className="bg-surface overflow-hidden">
      <StatusBar barStyle="dark-content" />
      
      {screen !== 'create' && screen !== 'chat_room' && (
        <View className="bg-surface/80 px-6 py-4 border-b border-outline-variant/10 flex-row justify-between items-center h-16">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity 
              onPress={() => setIsLocationModalOpen(true)}
              className="p-2 rounded-full bg-primary/5"
            >
              <MapPin size={20} color="#6750A4" />
            </TouchableOpacity>
            <View>
              <Text className="text-[10px] font-bold text-outline uppercase tracking-widest leading-none mb-1">{locationName}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold tracking-tight text-on-surface leading-none">
                  {locationName === 'Current Location' ? `${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)}` : 'The Tactile Commons'}
                </Text>
                {locationName === 'Detecting...' && (
                  <TouchableOpacity 
                    onPress={() => {
                      setUserLocation({ lat: 47.6062, lng: -122.3321 });
                      setLocationName('Default Location');
                    }}
                  >
                    <Text className="text-xs text-primary font-bold underline">Use Default</Text>
                  </TouchableOpacity>
                )}
                {(locationName.includes('Denied') || locationName.includes('Unavailable')) && (
                  <TouchableOpacity onPress={() => setIsLocationModalOpen(true)}>
                    <Text className="text-xs text-primary font-bold underline">Set Manually</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => setScreen('notifications')}
            className="p-2 rounded-full bg-surface-container relative"
          >
            <Bell size={20} color="#1D1B20" />
            {notifications.some(n => !n.read) && (
              <View className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface" />
            )}
          </TouchableOpacity>
        </View>
      )}

      <View className="flex-1 overflow-hidden">
        <AnimatePresence>
          <MotiView
            key={screen}
            from={{ opacity: 0, translateY: 5 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -5 }}
            transition={{ type: 'timing', duration: 150 }}
            style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {renderScreen()}
          </MotiView>
        </AnimatePresence>
      </View>

      {isLocationModalOpen && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center p-4 z-50" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 pr-4">
                <Text className="text-xl font-bold text-on-surface mb-1">Set Location</Text>
                <Text className="text-sm text-on-surface-variant">Enter coordinates or search.</Text>
              </View>
              <TouchableOpacity 
                onPress={async () => {
                  try {
                    let { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') return;
                    let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    setManualLat(location.coords.latitude.toFixed(4));
                    setManualLng(location.coords.longitude.toFixed(4));
                  } catch (error) {
                    console.warn("Location error", error);
                  }
                }}
                className="p-3 bg-primary/10 rounded-full"
              >
                <MapPin size={20} color="#6750A4" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-surface-container-low rounded-xl border border-outline-variant/30 px-3 mb-4">
              <Search size={18} color="#49454F" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchLocation}
                placeholder="Search for a city or address..."
                placeholderTextColor="#49454F"
                className="flex-1 p-3 text-on-surface text-sm"
              />
              <TouchableOpacity 
                onPress={handleSearchLocation}
                disabled={isSearching || !searchQuery.trim()}
                className={`px-3 py-1.5 rounded-lg ${searchQuery.trim() ? 'bg-primary' : 'bg-surface-variant'}`}
              >
                <Text className={`text-xs font-bold ${searchQuery.trim() ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                  {isSearching ? '...' : 'Search'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ height: 200, marginBottom: 24, borderRadius: 16, overflow: 'hidden' }}>
              <MapPicker 
                initialLat={parseFloat(manualLat) || userLocation.lat} 
                initialLng={parseFloat(manualLng) || userLocation.lng}
                onLocationSelect={(lat, lng) => {
                  setManualLat(lat.toFixed(4));
                  setManualLng(lng.toFixed(4));
                }}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => setIsLocationModalOpen(false)}
                className="flex-1 py-4 rounded-2xl items-center justify-center border border-outline-variant"
              >
                <Text className="font-bold text-on-surface-variant">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={async () => {
                  const lat = parseFloat(manualLat);
                  const lng = parseFloat(manualLng);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    setIsConfirming(true);
                    try {
                      const reverseResults = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
                      let newName = 'Custom Location';
                      if (reverseResults && reverseResults.length > 0) {
                        const place = reverseResults[0];
                        newName = place.city || place.name || place.region || 'Custom Location';
                      }
                      setUserLocation({ lat, lng });
                      setLocationName(newName);
                      setIsLocationModalOpen(false);
                    } catch (error) {
                      setUserLocation({ lat, lng });
                      setLocationName('Custom Location');
                      setIsLocationModalOpen(false);
                    } finally {
                      setIsConfirming(false);
                    }
                  }
                }}
                disabled={isConfirming}
                className={`flex-1 py-4 rounded-2xl items-center justify-center shadow-md ${isConfirming ? 'bg-primary/50' : 'bg-primary'}`}
              >
                <Text className="font-bold text-on-primary">{isConfirming ? 'Confirming...' : 'Confirm Location'}</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      )}

      {screen !== 'create' && screen !== 'chat_room' && (
        <View className="bg-surface/90 border-t border-outline-variant/10 flex-row justify-around py-4 pb-8 shadow-2xl h-24">
          {[
            { id: 'home', icon: Home, label: 'Feed' },
            { id: 'messages', icon: MessageSquare, label: 'Messages' },
            { id: 'create', icon: PlusCircle, label: 'Post' },
            { id: 'notifications', icon: Bell, label: 'Alerts' },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map((item) => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => setScreen(item.id as any)}
              className="items-center gap-1"
            >
              <item.icon 
                size={24} 
                color={screen === item.id ? '#6750A4' : '#79747E'} 
                strokeWidth={screen === item.id ? 2.5 : 2}
              />
              <Text className={cn(
                'text-[10px] font-bold uppercase tracking-widest',
                screen === item.id ? 'text-primary' : 'text-outline'
              )}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

export default AppContent;
