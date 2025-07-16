import { blink } from '../blink/client';
import type { User, Message, Post, Comment } from '../types';

// AI Agent personalities for different users
const AI_PERSONALITIES = {
  'user-2': {
    name: 'Jane Smith',
    personality: 'Professional UI/UX designer who loves clean design, gives thoughtful feedback, and uses design terminology. Friendly but focused on aesthetics and user experience.',
    interests: ['design', 'UI/UX', 'typography', 'color theory', 'user research'],
    responseStyle: 'professional yet warm',
  },
  'user-3': {
    name: 'Mike Johnson',
    personality: 'Adventure photographer who loves nature, outdoor activities, and sharing travel stories. Uses nature metaphors and is very enthusiastic about outdoor experiences.',
    interests: ['photography', 'hiking', 'nature', 'travel', 'adventure sports'],
    responseStyle: 'enthusiastic and adventurous',
  },
  'user-4': {
    name: 'Sarah Wilson',
    personality: 'Marketing specialist who is data-driven, loves trends, and always thinking about growth and engagement. Uses marketing terminology and is very social.',
    interests: ['marketing', 'social media', 'analytics', 'trends', 'branding'],
    responseStyle: 'energetic and trend-focused',
  },
  'user-5': {
    name: 'Alex Brown',
    personality: 'Data scientist who loves analyzing patterns, sharing insights, and explaining complex topics in simple terms. Logical but approachable.',
    interests: ['data science', 'machine learning', 'statistics', 'technology', 'research'],
    responseStyle: 'analytical yet friendly',
  },
};

// Response delay ranges (in milliseconds)
const RESPONSE_DELAYS = {
  quick: { min: 2000, max: 5000 },    // 2-5 seconds
  normal: { min: 5000, max: 15000 },  // 5-15 seconds
  slow: { min: 15000, max: 30000 },   // 15-30 seconds
};

class AIAgentService {
  private activeTimeouts: Set<NodeJS.Timeout> = new Set();

  // Generate AI response using Gemini
  private async generateResponse(
    context: string,
    personality: typeof AI_PERSONALITIES[keyof typeof AI_PERSONALITIES],
    responseType: 'message' | 'comment' | 'post_reaction'
  ): Promise<string> {
    try {
      const prompt = this.buildPrompt(context, personality, responseType);
      
      const { text } = await blink.ai.generateText({
        prompt,
        model: 'gemini-2.0-flash-exp',
        maxTokens: 150,
      });

      return text.trim();
    } catch (error) {
      console.error('AI response generation failed:', error);
      return this.getFallbackResponse(personality, responseType);
    }
  }

  private buildPrompt(
    context: string,
    personality: typeof AI_PERSONALITIES[keyof typeof AI_PERSONALITIES],
    responseType: 'message' | 'comment' | 'post_reaction'
  ): string {
    const basePrompt = `You are ${personality.name}, a ${personality.personality}

Your interests include: ${personality.interests.join(', ')}
Your response style is: ${personality.responseStyle}

Context: ${context}

Generate a ${responseType === 'message' ? 'casual message reply' : responseType === 'comment' ? 'comment on this post' : 'reaction to this post'} that:
- Matches your personality and interests
- Is natural and conversational
- Is 1-2 sentences maximum
- Uses appropriate emojis sparingly
- Feels authentic to social media interaction

Response:`;

    return basePrompt;
  }

  private getFallbackResponse(
    personality: typeof AI_PERSONALITIES[keyof typeof AI_PERSONALITIES],
    responseType: 'message' | 'comment' | 'post_reaction'
  ): string {
    const fallbacks = {
      message: [
        "Hey! How's it going?",
        "Thanks for reaching out!",
        "That sounds interesting!",
        "I'd love to hear more about that.",
      ],
      comment: [
        "Great post! 👍",
        "Love this!",
        "Thanks for sharing!",
        "This is awesome!",
      ],
      post_reaction: [
        "Nice work!",
        "Looks great!",
        "Awesome!",
        "Love it!",
      ],
    };

    const responses = fallbacks[responseType];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getRandomDelay(type: keyof typeof RESPONSE_DELAYS): number {
    const range = RESPONSE_DELAYS[type];
    return Math.random() * (range.max - range.min) + range.min;
  }

  // Auto-respond to messages
  async handleIncomingMessage(
    message: Message,
    currentUser: User,
    onResponse: (senderId: string, receiverId: string, content: string) => void,
    onTypingStart?: (userId: string) => void,
    onTypingEnd?: (userId: string) => void
  ): Promise<void> {
    // Don't respond to our own messages or if sender is not an AI agent
    if (message.senderId === currentUser.id || !AI_PERSONALITIES[message.receiverId as keyof typeof AI_PERSONALITIES]) {
      return;
    }

    const personality = AI_PERSONALITIES[message.receiverId as keyof typeof AI_PERSONALITIES];
    const delay = this.getRandomDelay('normal');

    // Show typing indicator after a short delay
    const typingTimeout = setTimeout(() => {
      onTypingStart?.(message.receiverId);
      this.activeTimeouts.delete(typingTimeout);
    }, 1000);

    this.activeTimeouts.add(typingTimeout);

    const timeout = setTimeout(async () => {
      try {
        onTypingEnd?.(message.receiverId);
        
        const context = `Someone sent you a message: "${message.content}"`;
        const response = await this.generateResponse(context, personality, 'message');
        
        onResponse(message.receiverId, message.senderId, response);
      } catch (error) {
        console.error('Failed to generate message response:', error);
        onTypingEnd?.(message.receiverId);
      }
      this.activeTimeouts.delete(timeout);
    }, delay);

    this.activeTimeouts.add(timeout);
  }

  // Auto-comment on posts
  async handleNewPost(
    post: Post,
    currentUser: User,
    onComment: (postId: string, content: string, userId: string) => void
  ): Promise<void> {
    // Don't comment on our own posts
    if (post.userId === currentUser.id) {
      return;
    }

    // Randomly select 1-2 AI agents to comment
    const availableAgents = Object.keys(AI_PERSONALITIES).filter(id => id !== post.userId);
    const numComments = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 0; // 70% chance of 1 comment, 20% chance of 2, 10% no comments
    
    if (numComments === 0) return;

    const selectedAgents = availableAgents
      .sort(() => Math.random() - 0.5)
      .slice(0, numComments);

    selectedAgents.forEach((agentId, index) => {
      const personality = AI_PERSONALITIES[agentId as keyof typeof AI_PERSONALITIES];
      const delay = this.getRandomDelay(index === 0 ? 'quick' : 'normal');

      const timeout = setTimeout(async () => {
        try {
          const context = `Someone posted: "${post.content}"${post.imageUrl ? ' with an image' : ''}`;
          const response = await this.generateResponse(context, personality, 'comment');
          
          onComment(post.id, response, agentId);
        } catch (error) {
          console.error('Failed to generate comment response:', error);
        }
        this.activeTimeouts.delete(timeout);
      }, delay);

      this.activeTimeouts.add(timeout);
    });
  }

  // Auto-like posts
  async handlePostLikes(
    post: Post,
    currentUser: User,
    onLike: (postId: string, userId: string) => void
  ): Promise<void> {
    // Don't like our own posts
    if (post.userId === currentUser.id) {
      return;
    }

    // Randomly select AI agents to like the post (60% chance each agent likes it)
    const availableAgents = Object.keys(AI_PERSONALITIES).filter(id => id !== post.userId);
    
    availableAgents.forEach((agentId) => {
      if (Math.random() < 0.6) { // 60% chance to like
        const delay = this.getRandomDelay('quick');
        
        const timeout = setTimeout(() => {
          onLike(post.id, agentId);
          this.activeTimeouts.delete(timeout);
        }, delay);

        this.activeTimeouts.add(timeout);
      }
    });
  }

  // Generate random posts from AI agents
  async generateRandomPost(
    onCreatePost: (content: string, imageUrl: string | undefined, userId: string) => void
  ): Promise<void> {
    const agentIds = Object.keys(AI_PERSONALITIES);
    const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
    const personality = AI_PERSONALITIES[randomAgent as keyof typeof AI_PERSONALITIES];

    try {
      const context = `Create a social media post about one of your interests: ${personality.interests.join(', ')}. Make it engaging and personal.`;
      const postContent = await this.generateResponse(context, personality, 'post_reaction');
      
      // Sometimes add an image URL based on the content
      let imageUrl: string | undefined;
      if (personality.interests.includes('photography') && Math.random() < 0.7) {
        imageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop';
      } else if (personality.interests.includes('design') && Math.random() < 0.5) {
        imageUrl = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop';
      }
      
      onCreatePost(postContent, imageUrl, randomAgent);
    } catch (error) {
      console.error('Failed to generate random post:', error);
    }
  }

  // Start random post generation
  startRandomPostGeneration(
    onCreatePost: (content: string, imageUrl: string | undefined, userId: string) => void
  ): void {
    const generatePost = () => {
      this.generateRandomPost(onCreatePost);
      
      // Schedule next post (5-15 minutes)
      const nextDelay = Math.random() * (15 * 60 * 1000 - 5 * 60 * 1000) + 5 * 60 * 1000;
      const timeout = setTimeout(generatePost, nextDelay);
      this.activeTimeouts.add(timeout);
    };

    // Start with first post after 30 seconds
    const timeout = setTimeout(generatePost, 30000);
    this.activeTimeouts.add(timeout);
  }

  // Clean up all timeouts
  cleanup(): void {
    this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.activeTimeouts.clear();
  }
}

export const aiAgentService = new AIAgentService();
export { AI_PERSONALITIES };