import { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import type { Post, Comment } from '@/types';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  comments: Comment[];
}

export function PostCard({ post, onLike, onComment, comments }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleComment = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const postComments = comments.filter(c => c.postId === post.id);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.user?.avatarUrl} />
              <AvatarFallback>
                {post.user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.user?.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm mb-3">{post.content}</p>
        
        {post.imageUrl && (
          <div className="mb-3">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="w-full rounded-lg max-h-96 object-cover"
            />
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3 pt-2 border-t">
          <span>{post.likesCount} likes</span>
          <span>{postComments.length} comments</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 mb-3 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike(post.id)}
            className={`flex-1 ${post.isLiked ? 'text-red-500' : ''}`}
          >
            <Heart className={`h-4 w-4 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
            Like
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Comment Input */}
        <div className="flex space-x-2 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex space-x-2">
            <Textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[32px] resize-none"
              rows={1}
            />
            <Button size="sm" onClick={handleComment} disabled={!commentText.trim()}>
              Post
            </Button>
          </div>
        </div>

        {/* Comments */}
        {showComments && postComments.length > 0 && (
          <div className="space-y-3">
            {postComments.map((comment) => (
              <div key={comment.id} className="flex space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.avatarUrl} />
                  <AvatarFallback>
                    {comment.user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <p className="font-semibold text-sm">{comment.user?.displayName || 'Unknown User'}</p>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-3">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}