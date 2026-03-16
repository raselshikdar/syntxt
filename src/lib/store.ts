import { create } from 'zustand';
import { mockUsers, mockPosts, CURRENT_USER_ID, type User, type Post } from './mockData';

interface AppState {
  users: User[];
  posts: Post[];
  currentUserId: string;
  savedPosts: string[];
  
  // Actions
  addPost: (content: string) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (targetUserId: string) => void;
  repost: (postId: string) => void;
  getUser: (userId: string) => User | undefined;
  getUserByHandle: (handle: string) => User | undefined;
  getPostsByUser: (userId: string) => Post[];
  isFollowing: (targetUserId: string) => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  users: mockUsers,
  posts: mockPosts,
  currentUserId: CURRENT_USER_ID,
  savedPosts: [],

  addPost: (content: string) => {
    const user = get().users.find(u => u.id === CURRENT_USER_ID)!;
    const newPost: Post = {
      id: `p${Date.now()}`,
      userId: CURRENT_USER_ID,
      handle: user.handle,
      content,
      createdAt: new Date(),
      likes: [],
      reposts: [],
    };
    set(state => ({ posts: [newPost, ...state.posts] }));
  },

  toggleLike: (postId: string) => {
    set(state => ({
      posts: state.posts.map(p =>
        p.id === postId
          ? { ...p, likes: p.likes.includes(CURRENT_USER_ID) ? p.likes.filter(id => id !== CURRENT_USER_ID) : [...p.likes, CURRENT_USER_ID] }
          : p
      ),
    }));
  },

  toggleSave: (postId: string) => {
    set(state => ({
      savedPosts: state.savedPosts.includes(postId)
        ? state.savedPosts.filter(id => id !== postId)
        : [...state.savedPosts, postId],
    }));
  },

  toggleFollow: (targetUserId: string) => {
    set(state => ({
      users: state.users.map(u => {
        if (u.id === CURRENT_USER_ID) {
          const isFollowing = u.following.includes(targetUserId);
          return { ...u, following: isFollowing ? u.following.filter(id => id !== targetUserId) : [...u.following, targetUserId] };
        }
        if (u.id === targetUserId) {
          const isFollowed = u.followers.includes(CURRENT_USER_ID);
          return { ...u, followers: isFollowed ? u.followers.filter(id => id !== CURRENT_USER_ID) : [...u.followers, CURRENT_USER_ID] };
        }
        return u;
      }),
    }));
  },

  repost: (postId: string) => {
    const post = get().posts.find(p => p.id === postId);
    if (!post) return;
    const user = get().users.find(u => u.id === CURRENT_USER_ID)!;
    const repostEntry: Post = {
      id: `rp${Date.now()}`,
      userId: CURRENT_USER_ID,
      handle: user.handle,
      content: post.content,
      createdAt: new Date(),
      likes: [],
      reposts: [],
      repostOf: postId,
    };
    set(state => ({
      posts: [repostEntry, ...state.posts.map(p => p.id === postId ? { ...p, reposts: [...p.reposts, CURRENT_USER_ID] } : p)],
    }));
  },

  getUser: (userId: string) => get().users.find(u => u.id === userId),
  getUserByHandle: (handle: string) => get().users.find(u => u.handle === handle),
  getPostsByUser: (userId: string) => get().posts.filter(p => p.userId === userId),
  isFollowing: (targetUserId: string) => {
    const current = get().users.find(u => u.id === CURRENT_USER_ID);
    return current?.following.includes(targetUserId) ?? false;
  },
}));
