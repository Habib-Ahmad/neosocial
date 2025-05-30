
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Calendar, Users, FileText } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { mockPosts } from '@/data/mockData';

const Profile: React.FC = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  
  // If no userId in params, show current user's profile
  const isOwnProfile = !userId || userId === user?.id;
  const profileUser = isOwnProfile ? user : null; // In real app, fetch user by ID

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center p-8">
          <p className="text-gray-500">User not found</p>
        </Card>
      </div>
    );
  }

  const userPosts = mockPosts.filter(post => isOwnProfile || post.author.id === userId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
        <CardHeader className="relative">
          {/* Cover Image */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-lg opacity-10"></div>
          
          <div className="relative pt-8">
            <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <img 
                  src={profileUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'} 
                  alt={profileUser.firstName}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg"
                />
              </div>
              
              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {profileUser.firstName} {profileUser.lastName}
                </h1>
                {profileUser.bio && (
                  <p className="text-gray-600 mt-2">{profileUser.bio}</p>
                )}
                
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>Joined {new Date(profileUser.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users size={16} />
                    <span>{profileUser.friendsCount} friends</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText size={16} />
                    <span>{profileUser.postsCount} posts</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                {isOwnProfile ? (
                  <Link to="/edit-profile">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Edit size={16} className="mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                ) : (
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Add Friend
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Content */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-purple-100">
          <TabsTrigger 
            value="posts"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger 
            value="about"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            About
          </TabsTrigger>
          <TabsTrigger 
            value="friends"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            Friends
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="space-y-4 mt-6">
          {userPosts.length > 0 ? (
            userPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <Card className="text-center p-8 backdrop-blur-sm bg-white/80 border-purple-100">
              <p className="text-gray-500">No posts yet</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="about" className="mt-6">
          <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">About {profileUser.firstName}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Bio</label>
                  <p className="text-gray-800">{profileUser.bio || 'No bio available'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-800">{profileUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Member since</label>
                  <p className="text-gray-800">{new Date(profileUser.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="friends" className="mt-6">
          <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Friends ({profileUser.friendsCount})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Mock friends display */}
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="text-center">
                    <img 
                      src={`https://images.unsplash.com/photo-${1472099645785 + i}?w=100&h=100&fit=crop&crop=face`}
                      alt={`Friend ${i}`}
                      className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-purple-200"
                    />
                    <p className="text-sm font-medium">Friend {i}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
