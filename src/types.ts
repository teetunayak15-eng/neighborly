export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  isVerified?: boolean;
  badges?: string[];
  reliabilityScore?: number;
  neighborsHelped?: number;
  thankYous?: number;
  completionCount?: number;
  createdAt: any; // Firestore Timestamp
  location?: {
    address?: string;
    latitude: number;
    longitude: number;
  };
}

export type PostType = 'request' | 'offer';
export type PostStatus = 'open' | 'accepted' | 'completed';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorIsVerified?: boolean;
  type: PostType;
  title: string;
  description: string;
  category: string;
  urgency: UrgencyLevel;
  status: PostStatus;
  createdAt: any; // Firestore Timestamp
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface ChatRoom {
  id: string;
  participants: string[];
  postId: string;
  lastMessage?: string;
  updatedAt: any; // Firestore Timestamp
  createdAt?: any;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: any; // Firestore Timestamp
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  description?: string;
  type: string;
  read: boolean;
  isRead?: boolean; // For backward compatibility in UI
  createdAt: any; // Firestore Timestamp
}
