import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/api/posts";

const CreatePost: React.FC = () => {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: true });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something before posting.",
        variant: "destructive",
      });
      return;
    }

    if (!category.trim()) {
      toast({
        title: "Category required",
        description: "Please select a category for your post.",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);

    try {
      await mutateAsync({ content, category });
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });
      setContent("");
      setCategory("");
      setIsPosting(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
      setIsPosting(false);
      return;
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          {user?.profile_picture && (
            <img
              src={user.profile_picture}
              alt={user.first_name}
              className="w-10 h-10 rounded-full border-2 border-purple-200"
            />
          )}
          <div>
            <p className="font-medium text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-sm text-gray-500">Share what's on your mind</p>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="min-h-[100px] resize-none border-purple-100 focus:border-purple-300"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Image size={18} className="mr-2" />
                Photo
              </Button>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isPosting || !content.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isPosting ? (
                "Posting..."
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default CreatePost;
