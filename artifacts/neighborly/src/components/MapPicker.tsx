import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface MapPickerProps {
  initialLat: number;
  initialLng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

export const MapPicker = ({ initialLat, initialLng, onLocationSelect }: MapPickerProps) => {
  return (
    <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden', minHeight: 200, backgroundColor: '#F7F2FA', alignItems: 'center', justifyContent: 'center' }}>
      <MapPin size={32} color="#6750A4" />
      <Text style={{ color: '#49454F', marginTop: 8, fontSize: 13 }}>
        {initialLat.toFixed(4)}, {initialLng.toFixed(4)}
      </Text>
      <Text style={{ color: '#79747E', marginTop: 4, fontSize: 11 }}>
        Enter coordinates manually above
      </Text>
    </View>
  );
};
