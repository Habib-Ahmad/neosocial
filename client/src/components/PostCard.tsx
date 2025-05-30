
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Heart, MessageSquare, Bookmark, MoreHorizontal } from 'lucide-react';
import { Post } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const { toast } = useToast();

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    
    toast({
      title: isLiked ? "Post unliked" : "Post liked",
      description: isLiked ? "Removed from your likes" : "Added to your likes",
    });
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    
    toast({
      title: isSaved ? "Post unsaved" : "Post saved",
      description: isSaved ? "Removed from saved posts" : "Added to saved posts",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={post.author.avatar} 
              alt={post.author.name}
              className="w-10 h-10 rounded-full border-2 border-purple-200"
            />
            <div>
              <Link 
                to={`/profile/${post.author.id}`}
                className="font-medium text-gray-900 hover:text-purple-600 transition-colors"
              >
                {post.author.name}
              </Link>
              <p className="text-sm text-gray-500 flex items-center space-x-2">
                <span>{formatDate(post.createdAt)}</span>
                {post.category && (
                  <>
                    <span>•</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                      {post.category}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Link to={`/post/${post.id}`} className="block">
          <p className="text-gray-800 leading-relaxed hover:text-gray-900 transition-colors">
            {post.content}
          </p>
        </Link>
        
        {post.image && (
          <Link to={`/post/${post.id}`} className="block">
            <img 
              src={post.image} 
              alt="Post content"
              className="w-full rounded-lg border border-purple-100 hover:border-purple-200 transition-colors"
            />
          </Link>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-purple-100">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart size={18} className={isLiked ? 'fill-current' : ''} />
              <span>{likesCount}</span>
            </Button>
            
            <Link 
              to={`/post/${post.id}`}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors px-3 py-2 rounded-md hover:bg-blue-50"
            >
              <MessageSquare size={18} />
              <span>{post.comments}</span>
            </Link>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className={`transition-colors ${
              isSaved 
                ? 'text-purple-500 hover:text-purple-600' 
                : 'text-gray-500 hover:text-purple-500'
            }`}
          >
            <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
