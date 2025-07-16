import { useState } from 'react';
import { Image, Smile, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface CreatePostProps {
  currentUser?: any;
  onCreatePost: (content: string, imageUrl?: string) => void;
}

export function CreatePost({ currentUser, onCreatePost }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    if (content.trim()) {
      onCreatePost(content);
      setContent('');
      setIsExpanded(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar>
            <AvatarImage src={currentUser?.avatarUrl} />
            <AvatarFallback>
              {currentUser?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder={`What's on your mind, ${currentUser?.displayName?.split(' ')[0] || 'there'}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="min-h-[50px] resize-none border-none shadow-none text-lg placeholder:text-gray-500"
              rows={isExpanded ? 3 : 1}
            />
            
            {isExpanded && (
              <>
                <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm" className="text-gray-600">
                    <Image className="h-5 w-5 mr-2 text-green-500" />
                    Photo/Video
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600">
                    <Smile className="h-5 w-5 mr-2 text-yellow-500" />
                    Feeling/Activity
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600">
                    <MapPin className="h-5 w-5 mr-2 text-red-500" />
                    Check In
                  </Button>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(false);
                      setContent('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!content.trim()}
                  >
                    Post
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}