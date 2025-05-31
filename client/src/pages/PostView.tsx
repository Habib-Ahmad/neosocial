import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, Bookmark, Send, ArrowLeft } from "lucide-react";
import { mockPosts } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@/interface/Post";
import { getPostById } from "@/api/posts";

const PostView: React.FC = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: post,
    isError,
    isPending,
  } = useQuery<Post>({
    queryKey: [`post/${postId}`],
    queryFn: () => getPostById(postId),
  });

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post?.comments || []);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center p-8">
          <p className="text-gray-500">Post not found</p>
          <Link
            to="/home"
            className="text-purple-600 hover:text-purple-700 mt-4 inline-block"
          >
            Return to Home
          </Link>
        </Card>
      </div>
    );
  }

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));

    toast({
      title: isLiked ? "Post unliked" : "Post liked",
      description: isLiked ? "Removed from your likes" : "Added to your likes",
    });
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

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      content: comment,
      author: {
        name: `${user?.first_name} ${user?.last_name}`,
        avatar:
          user?.profile_picture ||
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      },
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setComments((prev) => [newComment, ...prev]);
    setComment("");

    toast({
      title: "Comment added",
      description: "Your comment has been posted.",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/home"
        className="flex items-center text-purple-600 hover:text-purple-700 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Home
      </Link>

      {/* Post */}
      <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <img
              src={
                post.author.profile_picture || "https://via.placeholder.com/150"
              }
              alt={post.author.name}
              className="w-12 h-12 rounded-full border-2 border-purple-200"
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
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-800 leading-relaxed text-lg">
            {post.content}
          </p>

          {post.media_urls.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {post.media_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-auto rounded-lg object-cover border border-purple-100"
                />
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-4 border-t border-purple-100">
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
                <Heart size={20} className={isLiked ? "fill-current" : ""} />
                <span>{likesCount}</span>
              </Button>

              <div className="flex items-center space-x-2 text-gray-500 px-3 py-2">
                <MessageSquare size={20} />
                <span>{comments.length}</span>
              </div>
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
              <Bookmark size={20} className={isSaved ? "fill-current" : ""} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Comment */}
      <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
        <CardContent className="p-4">
          <form onSubmit={handleComment} className="space-y-4">
            <div className="flex space-x-3">
              {user?.profile_picture && (
                <img
                  src={user.profile_picture}
                  alt={user.first_name}
                  className="w-10 h-10 rounded-full border-2 border-purple-200"
                />
              )}
              <div className="flex-1">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[80px] resize-none border-purple-100 focus:border-purple-300"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!comment.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Send size={16} className="mr-2" />
                Comment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Comments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>

        {comments.map((comment) => (
          <Card
            key={comment.id}
            className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg"
          >
            <CardContent className="p-4">
              <div className="flex space-x-3">
                <img
                  src={
                    comment.author.profile_picture ||
                    "https://preview.redd.it/milr969373561.jpg?width=640&crop=smart&auto=webp&s=0489105bbefd3decd68950da2334507dc25490fe"
                  }
                  alt={comment.author.name}
                  className="w-10 h-10 rounded-full border-2 border-purple-200"
                />

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {comment.author.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>

                  <p className="text-gray-800 mb-2">{comment.content}</p>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-red-500 transition-colors p-0 h-auto"
                  >
                    <Heart size={16} className="mr-1" />
                    <span>{comment.likes_count}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PostView;
