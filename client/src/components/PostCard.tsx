import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart, MessageSquare, Bookmark, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Post } from "@/interface/Post";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { togglePostLike } from "@/api/posts";

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(post.liked_by_me || false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: togglePostLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: true });
    },
  });

  const handleLike = async () => {
    try {
      const updatedPost = await mutateAsync(post.id);
      setIsLiked(updatedPost.liked_by_me);
      setLikesCount(updatedPost.likes_count);
    } catch (error) {
      toast({
        title: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);

    toast({
      title: isSaved ? "Post unsaved" : "Post saved",
      description: isSaved
        ? "Removed from saved posts"
        : "Added to saved posts",
    });
  };

  const formatDate = (dateString: string) => {
    // Format to DD/MM/YYYY
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={post.author.profile_picture}
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
                <span>{formatDate(post.created_at)}</span>
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

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Link to={`/post/${post.id}`} className="block">
          <p className="text-gray-800 leading-relaxed hover:text-gray-900 transition-colors">
            {post.content}
          </p>

          {post.media_urls.length ? (
            <div className="mt-2 flex">
              {post.media_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-auto rounded-lg object-cover"
                />
              ))}
            </div>
          ) : null}
        </Link>

        <div className="flex items-center justify-between pt-2 border-t border-purple-100">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked
                  ? "text-red-500 hover:text-red-600"
                  : "text-gray-500 hover:text-red-500"
              }`}
            >
              <Heart size={18} className={isLiked ? "fill-current" : ""} />
              <span>{likesCount}</span>
            </Button>

            <Link
              to={`/post/${post.id}`}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors px-3 py-2 rounded-md hover:bg-blue-50"
            >
              <MessageSquare size={18} />
              <span>{post.comments_count}</span>
            </Link>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className={`transition-colors ${
              isSaved
                ? "text-purple-500 hover:text-purple-600"
                : "text-gray-500 hover:text-purple-500"
            }`}
          >
            <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
