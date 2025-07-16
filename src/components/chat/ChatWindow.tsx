import { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, Info, Minimize2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { formatDistanceToNow } from 'date-fns';
import type { Message, User } from '@/types';

interface ChatWindowProps {
  user: User;
  messages: Message[];
  onSendMessage: (receiverId: string, content: string) => void;
  onClose: () => void;
  currentUserId: string;
  isTyping?: boolean;
}

export function ChatWindow({ user, messages, onSendMessage, onClose, currentUserId, isTyping = false }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(user.id, newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="fixed bottom-0 right-4 w-80 h-96 shadow-lg z-50">
      <CardHeader className="p-3 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{user.displayName}</p>
              <p className="text-xs opacity-80">
                {isTyping ? 'typing...' : 'Active now'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20">
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onClose}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-80">
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.content}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!isOwn && (
                    <Avatar className="h-6 w-6 order-1 mr-2">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[70%] order-1">
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <TypingIndicator />
                  </div>
                </div>
                <Avatar className="h-6 w-6 order-1 mr-2">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t">
          <div className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button size="sm" onClick={handleSend} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}