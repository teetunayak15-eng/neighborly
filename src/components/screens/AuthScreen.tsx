import React, { useState } from 'react';
import { View, Text, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { HeartHandshake, CheckSquare, Square } from 'lucide-react-native';
import { MotiView } from 'moti';
import { signInWithGoogle } from '../firebase';

export const AuthScreen = () => {
  const [agreed, setAgreed] = useState(false);

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
            <View className="w-14 h-14 bg-primary rounded-2xl items-center justify-center mr-4 shadow-lg shadow-primary/50">
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
              <Square size={24} color="#FFFFFF" opacity={0.6} />
            )}
            <Text className="text-white/90 ml-3 text-sm font-medium flex-1">
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={signInWithGoogle} 
            disabled={!agreed}
            activeOpacity={0.8}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-xl transition-all ${agreed ? 'bg-white' : 'bg-white/40'}`}
          >
            <Image 
              source={{ uri: "https://www.google.com/favicon.ico" }} 
              className={`w-6 h-6 mr-3 ${!agreed ? 'opacity-50' : ''}`} 
              style={{ width: 24, height: 24 }}
            />
            <Text className={`font-bold text-lg ${agreed ? 'text-gray-900' : 'text-gray-900/50'}`}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        </MotiView>
      </ImageBackground>
    </View>
  );
};
