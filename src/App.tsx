import { useState, useEffect, useCallback } from 'react';
import { blink } from './blink/client';
import { Header } from './components/layout/Header';
import { CreatePost } from './components/feed/CreatePost';
import { PostCard } from './components/feed/PostCard';
import { FriendsList } from './components/friends/FriendsList';
import { MessagesList } from './components/chat/MessagesList';
import { ChatWindow } from './components/chat/ChatWindow';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { aiAgentService, AI_PERSONALITIES } from './services/aiAgents';
import type { User, Post, Comment, FriendRequest, Message, ChatConversation } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<User[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Helper functions for AI users
  const getAvatarForUser = (userId: string): string => {
    const avatars: Record<string, string> = {
      'user-2': 'https://images.unsplash.com/photo-1494790108755-2616b9c5e8e1?w=150&h=150&fit=crop&crop=face',
      'user-3': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'user-4': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      'user-5': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    };
    return avatars[userId] || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
  };

  const getLocationForUser = (userId: string): string => {
    const locations: Record<string, string> = {
      'user-2': 'New York, NY',
      'user-3': 'Denver, CO',
      'user-4': 'Los Angeles, CA',
      'user-5': 'Seattle, WA',
    };
    return locations[userId] || 'Unknown';
  };

  // Handle AI-generated comments
  const handleAIComment = useCallback((postId: string, content: string, userId: string) => {
    try {
      const aiPersonality = AI_PERSONALITIES[userId as keyof typeof AI_PERSONALITIES];
      if (!aiPersonality) return;

      const aiUser: User = {
        id: userId,
        email: `${aiPersonality.name.toLowerCase().replace(' ', '.')}@example.com`,
        displayName: aiPersonality.name,
        avatarUrl: getAvatarForUser(userId),
        bio: aiPersonality.personality,
        location: getLocationForUser(userId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newComment: Comment = {
        id: `comment-${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 9)}`,
        postId,
        userId,
        content,
        createdAt: new Date().toISOString(),
        user: aiUser,
      };

      setComments(prev => [...prev, newComment]);
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return { ...post, commentsCount: post.commentsCount + 1 };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error handling AI comment:', error);
    }
  }, []);

  // Handle AI-generated likes
  const handleAILike = useCallback((postId: string, userId: string) => {
    try {
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likesCount: post.likesCount + 1,
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error handling AI like:', error);
    }
  }, []);

  // Handle AI-generated messages
  const handleAIMessage = useCallback((senderId: string, receiverId: string, content: string) => {
    try {
      const newMessage: Message = {
        id: `msg-${Date.now()}-ai-${Math.random().toString(36).substr(2, 9)}`,
        senderId,
        receiverId,
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newMessage]);

      // Update conversations
      setConversations(prev => prev.map(conv => {
        if (conv.user.id === senderId) {
          return {
            ...conv,
            lastMessage: newMessage,
            unreadCount: conv.unreadCount + 1,
          };
        }
        return conv;
      }));
    } catch (error) {
      console.error('Error handling AI message:', error);
    }
  }, []);

  // Handle typing indicators
  const handleTypingStart = useCallback((userId: string) => {
    setTypingUsers(prev => new Set([...prev, userId]));
  }, []);

  const handleTypingEnd = useCallback((userId: string) => {
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  }, []);

  // Handle AI-generated posts
  const handleAICreatePost = useCallback((content: string, imageUrl: string | undefined, userId: string) => {
    try {
      const aiUser = Object.values(AI_PERSONALITIES).find(p => 
        Object.keys(AI_PERSONALITIES).find(id => AI_PERSONALITIES[id as keyof typeof AI_PERSONALITIES] === p) === userId
      );
      
      if (!aiUser) return;

      const newPost: Post = {
        id: `post-${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        content,
        imageUrl,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: userId,
          email: `${aiUser.name.toLowerCase().replace(' ', '.')}@example.com`,
          displayName: aiUser.name,
          avatarUrl: getAvatarForUser(userId),
          bio: aiUser.personality,
          location: getLocationForUser(userId),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isLiked: false,
      };

      setPosts(prev => [newPost, ...prev]);
      
      // Trigger AI responses to AI posts
      if (user) {
        aiAgentService.handleNewPost(newPost, user, handleAIComment);
        aiAgentService.handlePostLikes(newPost, user, handleAILike);
      }
    } catch (error) {
      console.error('Error handling AI post creation:', error);
    }
  }, [user, handleAIComment, handleAILike]);

  // Mock data for demonstration
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate auth state
        const mockUser: User = {
          id: 'user-1',
          email: 'john.doe@example.com',
          displayName: 'John Doe',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          bio: 'Software developer and tech enthusiast',
          location: 'San Francisco, CA',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser(mockUser);

        // Mock posts
        const mockPosts: Post[] = [
          {
            id: 'post-1',
            userId: 'user-2',
            content: 'Just finished building an amazing React app! The new features are incredible. 🚀',
            imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop',
            likesCount: 24,
            commentsCount: 5,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            user: {
              id: 'user-2',
              email: 'jane.smith@example.com',
              displayName: 'Jane Smith',
              avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b9c5e8e1?w=150&h=150&fit=crop&crop=face',
              bio: 'UI/UX Designer',
              location: 'New York, NY',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isLiked: false,
          },
          {
            id: 'post-2',
            userId: 'user-3',
            content: 'Beautiful sunset from my weekend hike! Nature never fails to amaze me. 🌅',
            imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
            likesCount: 42,
            commentsCount: 8,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            user: {
              id: 'user-3',
              email: 'mike.johnson@example.com',
              displayName: 'Mike Johnson',
              avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
              bio: 'Adventure photographer',
              location: 'Denver, CO',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isLiked: true,
          },
        ];
        setPosts(mockPosts);

        // Mock friends
        const mockFriends: User[] = [
          {
            id: 'user-2',
            email: 'jane.smith@example.com',
            displayName: 'Jane Smith',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b9c5e8e1?w=150&h=150&fit=crop&crop=face',
            bio: 'UI/UX Designer',
            location: 'New York, NY',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'user-3',
            email: 'mike.johnson@example.com',
            displayName: 'Mike Johnson',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            bio: 'Adventure photographer',
            location: 'Denver, CO',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setFriends(mockFriends);

        // Mock suggested friends
        const mockSuggested: User[] = [
          {
            id: 'user-4',
            email: 'sarah.wilson@example.com',
            displayName: 'Sarah Wilson',
            avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            bio: 'Marketing specialist',
            location: 'Los Angeles, CA',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'user-5',
            email: 'alex.brown@example.com',
            displayName: 'Alex Brown',
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
            bio: 'Data scientist',
            location: 'Seattle, WA',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setSuggestedFriends(mockSuggested);

        // Mock conversations
        const mockConversations: ChatConversation[] = [
          {
            user: mockFriends[0],
            lastMessage: {
              id: 'msg-1',
              senderId: 'user-2',
              receiverId: 'user-1',
              content: 'Hey! How are you doing?',
              isRead: false,
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
            unreadCount: 2,
          },
          {
            user: mockFriends[1],
            lastMessage: {
              id: 'msg-2',
              senderId: 'user-1',
              receiverId: 'user-3',
              content: 'Great photos from your hike!',
              isRead: true,
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            unreadCount: 0,
          },
        ];
        setConversations(mockConversations);

        // Mock comments
        const mockComments: Comment[] = [
          {
            id: 'comment-1',
            postId: 'post-1',
            userId: 'user-1',
            content: 'This looks amazing! Great work!',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            user: mockUser,
          },
          {
            id: 'comment-2',
            postId: 'post-2',
            userId: 'user-2',
            content: 'Absolutely stunning view! 😍',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            user: mockFriends[0],
          },
        ];
        setComments(mockComments);

      } catch (error) {
        console.error('Failed to initialize app:', error);
        toast({
          title: 'Error',
          description: 'Failed to load app data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    // Cleanup AI agents on unmount
    return () => {
      try {
        aiAgentService.cleanup();
      } catch (error) {
        console.error('Error during AI agent cleanup:', error);
      }
    };
  }, [toast]);

  // Start AI agent after user is set (disabled to prevent infinite re-renders)
  // useEffect(() => {
  //   if (user && handleAICreatePost) {
  //     try {
  //       aiAgentService.startRandomPostGeneration(handleAICreatePost);
  //     } catch (error) {
  //       console.error('Failed to start AI agent post generation:', error);
  //     }
  //   }
  // }, [user, handleAICreatePost]);

  const handleCreatePost = useCallback((content: string, imageUrl?: string) => {
    if (!user) return;

    const newPost: Post = {
      id: `post-${Date.now()}`,
      userId: user.id,
      content,
      imageUrl,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user,
      isLiked: false,
    };

    setPosts(prev => [newPost, ...prev]);
    toast({
      title: 'Success',
      description: 'Post created successfully!',
    });

    // Trigger AI agent responses
    aiAgentService.handleNewPost(newPost, user, handleAIComment);
    aiAgentService.handlePostLikes(newPost, user, handleAILike);
  }, [user, toast, handleAIComment, handleAILike]);

  const handleLikePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
        };
      }
      return post;
    }));
  }, []);

  const handleComment = useCallback((postId: string, content: string) => {
    if (!user) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId,
      userId: user.id,
      content,
      createdAt: new Date().toISOString(),
      user,
    };

    setComments(prev => [...prev, newComment]);
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, commentsCount: post.commentsCount + 1 };
      }
      return post;
    }));
  }, [user]);

  const handleSendFriendRequest = useCallback((userId: string) => {
    if (!user) return;

    const newRequest: FriendRequest = {
      id: `req-${Date.now()}`,
      senderId: user.id,
      receiverId: userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFriendRequests(prev => [...prev, newRequest]);
    toast({
      title: 'Friend request sent',
      description: 'Your friend request has been sent!',
    });
  }, [user, toast]);

  const handleAcceptFriendRequest = useCallback((requestId: string) => {
    setFriendRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' as const } : req
    ));
    toast({
      title: 'Friend request accepted',
      description: 'You are now friends!',
    });
  }, [toast]);

  const handleRejectFriendRequest = useCallback((requestId: string) => {
    setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    toast({
      title: 'Friend request declined',
      description: 'Friend request has been declined.',
    });
  }, [toast]);

  const handleSendMessage = useCallback((receiverId: string, content: string) => {
    if (!user) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      receiverId,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);

    // Trigger AI response if messaging an AI agent
    if (AI_PERSONALITIES[receiverId as keyof typeof AI_PERSONALITIES]) {
      aiAgentService.handleIncomingMessage(
        newMessage, 
        user, 
        handleAIMessage,
        handleTypingStart,
        handleTypingEnd
      );
    }
  }, [user, handleAIMessage, handleTypingStart, handleTypingEnd]);

  const handleStartChat = useCallback((chatUser: User | string) => {
    if (typeof chatUser === 'string') {
      const foundUser = [...friends, ...suggestedFriends].find(u => u.id === chatUser);
      if (foundUser) {
        setActiveChatUser(foundUser);
      }
    } else {
      setActiveChatUser(chatUser);
    }
  }, [friends, suggestedFriends]);

  const getChatMessages = useCallback((userId: string) => {
    if (!user) return [];
    return messages.filter(msg => 
      (msg.senderId === user.id && msg.receiverId === userId) ||
      (msg.senderId === userId && msg.receiverId === user.id)
    );
  }, [user, messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">facebook</div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-4">facebook</div>
          <div className="text-muted-foreground mb-4">Please sign in to continue</div>
          <button 
            onClick={() => blink.auth.login()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const unreadMessages = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  const pendingRequests = friendRequests.filter(req => req.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentUser={user}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        unreadMessages={unreadMessages}
        friendRequests={pendingRequests}
      />

      <main className="pt-4">
        {activeTab === 'home' && (
          <div className="max-w-2xl mx-auto px-4">
            <CreatePost currentUser={user} onCreatePost={handleCreatePost} />
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLikePost}
                  onComment={handleComment}
                  comments={comments}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <FriendsList
            friends={friends}
            friendRequests={friendRequests}
            suggestedFriends={suggestedFriends}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onRejectFriendRequest={handleRejectFriendRequest}
            onStartChat={handleStartChat}
          />
        )}

        {activeTab === 'messages' && (
          <MessagesList
            conversations={conversations}
            onStartChat={handleStartChat}
          />
        )}
      </main>

      {activeChatUser && (
        <ChatWindow
          user={activeChatUser}
          messages={getChatMessages(activeChatUser.id)}
          onSendMessage={handleSendMessage}
          onClose={() => setActiveChatUser(null)}
          currentUserId={user.id}
          isTyping={typingUsers.has(activeChatUser.id)}
        />
      )}

      <Toaster />
    </div>
  );
}

export default App;