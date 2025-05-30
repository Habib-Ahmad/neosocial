
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CreatePost: React.FC = () => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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
    
    setIsPosting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Post created!",
      description: "Your post has been shared successfully.",
    });
    
    setContent('');
    setCategory('');
    setIsPosting(false);
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          {user?.avatar && (
            <img 
              src={user.avatar} 
              alt={user.firstName}
              className="w-10 h-10 rounded-full border-2 border-purple-200"
            />
          )}
          <div>
            <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
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
                'Posting...'
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
