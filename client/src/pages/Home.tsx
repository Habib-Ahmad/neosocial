
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import { mockPosts } from '@/data/mockData';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState('latest');

  const filterPosts = (filter: string) => {
    switch (filter) {
      case 'top':
        return [...mockPosts].sort((a, b) => b.likes - a.likes);
      case 'recommended':
        return mockPosts.filter(post => post.likes > 15);
      case 'discover':
        return mockPosts.filter(post => post.category && post.category !== 'general');
      default:
        return [...mockPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post */}
      <CreatePost />
      
      {/* Post Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-purple-100">
          <TabsTrigger 
            value="latest" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            Latest
          </TabsTrigger>
          <TabsTrigger 
            value="top" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            Top
          </TabsTrigger>
          <TabsTrigger 
            value="recommended" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            Recommended
          </TabsTrigger>
          <TabsTrigger 
            value="discover" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            Discover
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="latest" className="space-y-4 mt-6">
          {filterPosts('latest').map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>
        
        <TabsContent value="top" className="space-y-4 mt-6">
          {filterPosts('top').map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>
        
        <TabsContent value="recommended" className="space-y-4 mt-6">
          {filterPosts('recommended').map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>
        
        <TabsContent value="discover" className="space-y-4 mt-6">
          {filterPosts('discover').map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;
