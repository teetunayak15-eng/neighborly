import React, { useState, useEffect } from 'react';
import { View, Text, Image, ImageBackground, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { HeartHandshake, CheckSquare, Square, Info } from 'lucide-react-native';
import { MotiView } from 'moti';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { signInWithGoogleCredential, checkRateLimit } from '../firebase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = "885271296090-7ot0r53kmh4800j4atgopjnl0h6bv6jf.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "885271296090-7ot0r53kmh4800j4atgopjnl0h6bv6jf.apps.googleusercontent.com";

const redirectUri = makeRedirectUri({ useProxy: true });

export const AuthScreen = () => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        setLoading(true);
        signInWithGoogleCredential(id_token)
          .catch((err: Error) => {
            Alert.alert('Sign-in Error', err.message);
          })
          .finally(() => setLoading(false));
      }
    } else if (response?.type === 'error') {
      Alert.alert('Sign-in Error', response.error?.message || 'Google Sign-In failed. Please try again.');
    }
  }, [response]);

  const handleSignIn = async () => {
    if (!agreed) return;
    try {
      checkRateLimit();
      await promptAsync({ useProxy: true });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const showRedirectUri = () => {
    Alert.alert(
      'Redirect URI (add to Google Cloud)',
      redirectUri,
      [
        { text: 'Copy', onPress: () => Clipboard.setString(redirectUri) },
        { text: 'OK' },
      ]
    );
  };

  return (
    <View className="flex-1 bg-black">
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop' }}
        className="flex-1 justify-end"
        resizeMode="cover"
        imageStyle={{ opacity: 0.5 }}
      >
        <MotiView
          from={{ translateY: 50, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, delay: 100 }}
          className="p-8 pb-16 w-full max-w-md mx-auto"
        >
          <View className="flex-row items-center mb-6">
            <View className="w-14 h-14 bg-primary rounded-2xl items-center justify-center mr-4 shadow-lg">
              <HeartHandshake size={32} color="#FFFFFF" />
            </View>
            <Text className="text-5xl font-extrabold tracking-tight text-white">Neighborly</Text>
          </View>

          <Text className="text-white/90 mb-8 text-xl font-medium leading-relaxed">
            Connect with your neighbors, share resources, and build a stronger community together.
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setAgreed(!agreed)}
            className="flex-row items-center mb-8"
          >
            {agreed ? (
              <CheckSquare size={24} color="#FFFFFF" />
            ) : (
              <Square size={24} color="#FFFFFF" />
            )}
            <Text className="text-white/90 ml-3 text-sm font-medium flex-1">
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignIn}
            disabled={!agreed || loading || !request}
            activeOpacity={0.8}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-xl ${agreed && !loading ? 'bg-white' : 'bg-white/40'}`}
          >
            <Image
              source={{ uri: "https://www.google.com/favicon.ico" }}
              style={{ width: 24, height: 24, marginRight: 12, opacity: agreed ? 1 : 0.5 }}
            />
            <Text className={`font-bold text-lg ${agreed && !loading ? 'text-gray-900' : 'text-gray-900/50'}`}>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={showRedirectUri}
            className="flex-row items-center justify-center mt-4 opacity-60"
          >
            <Info size={14} color="#FFFFFF" />
            <Text className="text-white text-xs ml-1">Show redirect URI for Google Cloud setup</Text>
          </TouchableOpacity>
        </MotiView>
      </ImageBackground>
    </View>
  );
};
