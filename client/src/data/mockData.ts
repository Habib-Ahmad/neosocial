
import { Post } from '@/types';

export const mockPosts: Post[] = [
  {
    id: '1',
    content: 'Just finished building an amazing React application! The feeling when everything clicks together is unmatched. 🚀 #coding #react',
    author: {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b6b4f9b5?w=150&h=150&fit=crop&crop=face'
    },
    createdAt: '2024-01-20T10:30:00Z',
    likes: 24,
    comments: 8,
    reposts: 3,
    category: 'technology'
  },
  {
    id: '2',
    content: 'Beautiful sunset from my balcony today. Sometimes you need to pause and appreciate the simple moments in life. 🌅',
    author: {
      id: '3',
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    createdAt: '2024-01-20T18:45:00Z',
    likes: 42,
    comments: 15,
    reposts: 7,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    category: 'lifestyle'
  },
  {
    id: '3',
    content: 'Excited to announce that I\'ll be speaking at the upcoming Tech Conference! Looking forward to sharing insights about modern web development.',
    author: {
      id: '4',
      name: 'Emily Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    createdAt: '2024-01-19T14:20:00Z',
    likes: 67,
    comments: 23,
    reposts: 12,
    category: 'technology'
  },
  {
    id: '4',
    content: 'Coffee shop coding session complete! There\'s something magical about the ambient noise that helps with focus. ☕️💻',
    author: {
      id: '5',
      name: 'David Park',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    createdAt: '2024-01-19T09:15:00Z',
    likes: 18,
    comments: 5,
    reposts: 2,
    image: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=600&h=400&fit=crop',
    category: 'lifestyle'
  },
  {
    id: '5',
    content: 'Just discovered this amazing hiking trail! The views were absolutely breathtaking. Nature always has a way of putting things in perspective. 🥾🏔️',
    author: {
      id: '6',
      name: 'Lisa Thompson',
      avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face'
    },
    createdAt: '2024-01-18T16:30:00Z',
    likes: 35,
    comments: 12,
    reposts: 6,
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop',
    category: 'travel'
  }
];

export const mockFriends = [
  {
    id: '2',
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b6b4f9b5?w=150&h=150&fit=crop&crop=face',
    status: 'online',
    mutualFriends: 12
  },
  {
    id: '3',
    name: 'Mike Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    status: 'offline',
    mutualFriends: 8
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    status: 'online',
    mutualFriends: 15
  }
];

export const mockNotifications = [
  {
    id: '1',
    type: 'like',
    message: 'Sarah Johnson liked your post',
    time: '2 hours ago',
    read: false,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b6b4f9b5?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2',
    type: 'comment',
    message: 'Mike Chen commented on your post',
    time: '4 hours ago',
    read: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '3',
    type: 'friend_request',
    message: 'Emily Rodriguez sent you a friend request',
    time: '1 day ago',
    read: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  }
];
