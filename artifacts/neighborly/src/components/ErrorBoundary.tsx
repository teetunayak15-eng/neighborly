import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { NativeButton } from './NativeButton';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-6 bg-surface">
          <Text className="text-2xl font-bold text-error mb-4">Something went wrong.</Text>
          <ScrollView className="max-h-64 w-full bg-surface-container p-4 rounded-2xl mb-6">
            <Text className="text-xs font-mono text-on-surface-variant">
              {this.state.error?.toString()}
            </Text>
          </ScrollView>
          <NativeButton 
            onPress={() => this.setState({ hasError: false, error: null })}
            className="w-full"
          >
            Try Again
          </NativeButton>
        </View>
      );
    }

    return this.props.children;
  }
}
