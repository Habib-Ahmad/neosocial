import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart, MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { togglePostLike, deletePostService } from "@/api/posts";
import { useAuth } from "@/contexts/AuthContext";
import { resolveImageUrl } from "@/lib/utils";

interface PostCardProps {
  post: any;
  groupName?: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, groupName }) => {
  const { user } = useAuth(); // Get current user from context

  const [isLiked, setIsLiked] = useState(post.liked_by_me || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const queryClient = useQueryClient();

  const { mutateAsync: likePost } = useMutation({
    mutationFn: togglePostLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: true });
    },
  });

  const { mutateAsync: deletePost } = useMutation({
    mutationFn: deletePostService,
    onSuccess: () => {
      toast({
        title: "Post deleted successfully",
        description: "The post has been marked as deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: true });
      window.location.reload(); // Refresh the page after deletion
    },
    onError: (error) => {
      toast({
        title: "Failed to delete post",
        description:
          error.message || "An error occurred while deleting the post.",
        variant: "destructive",
      });
    },
  });

  const handleLike = async () => {
    try {
      const updatedPost = await likePost(post.id);
      setIsLiked(updatedPost.liked_by_me);
      setLikesCount(updatedPost.likes_count);
    } catch (error) {
      toast({
        title: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async () => {
    if (!user || user.id !== post.author.id) return; // Ensure only the post owner can delete

    try {
      await deletePost(post.id);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleDeleteConfirm = () => {
    if (user?.id === post.author.id) {
      const confirmed = window.confirm(
        "Are you sure you want to delete this post?"
      );
      if (confirmed) {
        handleDeletePost(); // If confirmed, delete the post
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={resolveImageUrl(post.author.profile_picture)}
              alt={post.author.name}
              className="w-10 h-10 rounded-full border-2 border-purple-200"
            />
            <div>
              <div className="flex items-center gap-1 flex-wrap">
                <Link
                  to={`/profile/${post.author.id}`}
                  className="font-medium text-gray-900 hover:text-purple-600 transition-colors"
                >
                  {post.author.name}
                </Link>
                {groupName && (
                  <span className="text-xs text-gray-500 italic">
                    (from {groupName})
                  </span>
                )}
              </div>
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

          {user?.id === post.author.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteConfirm}
              className="text-gray-500 hover:text-red-500"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Link to={`/post/${post.id}`} className="block">
          <p className="text-gray-800 leading-relaxed hover:text-gray-900 transition-colors">
            {post.content}
          </p>

          {post.media_urls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {post.media_urls.map((url, index) => (
                <img
                  key={index}
                  src={resolveImageUrl(url)}
                  alt={`Post media ${index + 1}`}
                  className="w-40 h-40 object-cover rounded border border-purple-200"
                />
              ))}
            </div>
          )}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
