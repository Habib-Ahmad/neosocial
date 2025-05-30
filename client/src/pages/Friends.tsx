
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, UserMinus, Check, X } from 'lucide-react';
import { mockFriends } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const Friends: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const mockFriendRequests = [
    {
      id: '1',
      name: 'Alex Wilson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 5,
      type: 'received' as const
    },
    {
      id: '2',
      name: 'Emma Davis',
      avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 3,
      type: 'sent' as const
    }
  ];

  const filteredFriends = mockFriends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAcceptRequest = (friendId: string, friendName: string) => {
    toast({
      title: "Friend request accepted",
      description: `You are now friends with ${friendName}`,
    });
  };

  const handleRejectRequest = (friendId: string, friendName: string) => {
    toast({
      title: "Friend request rejected",
      description: `Rejected friend request from ${friendName}`,
    });
  };

  const handleCancelRequest = (friendId: string, friendName: string) => {
    toast({
      title: "Friend request cancelled",
      description: `Cancelled friend request to ${friendName}`,
    });
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    toast({
      title: "Friend removed",
      description: `Removed ${friendName} from your friends`,
      variant: "destructive",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Friends
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-purple-100">
          <TabsTrigger 
            value="friends"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            My Friends ({mockFriends.length})
          </TabsTrigger>
          <TabsTrigger 
            value="requests"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            Requests (2)
          </TabsTrigger>
          <TabsTrigger 
            value="discover"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4 mt-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-purple-100"
            />
          </div>

          {/* Friends List */}
          <div className="grid gap-4">
            {filteredFriends.map(friend => (
              <Card key={friend.id} className="backdrop-blur-sm bg-white/80 border-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img 
                          src={friend.avatar} 
                          alt={friend.name}
                          className="w-12 h-12 rounded-full border-2 border-purple-200"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                        <p className="text-sm text-gray-500">{friend.mutualFriends} mutual friends</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemoveFriend(friend.id, friend.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus size={16} className="mr-2" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 mt-6">
          <div className="space-y-6">
            {/* Received Requests */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Received Requests</h3>
              <div className="space-y-4">
                {mockFriendRequests.filter(req => req.type === 'received').map(request => (
                  <Card key={request.id} className="backdrop-blur-sm bg-white/80 border-purple-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={request.avatar} 
                            alt={request.name}
                            className="w-12 h-12 rounded-full border-2 border-purple-200"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{request.name}</h3>
                            <p className="text-sm text-gray-500">{request.mutualFriends} mutual friends</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id, request.name)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check size={16} className="mr-2" />
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRejectRequest(request.id, request.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X size={16} className="mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sent Requests */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Sent Requests</h3>
              <div className="space-y-4">
                {mockFriendRequests.filter(req => req.type === 'sent').map(request => (
                  <Card key={request.id} className="backdrop-blur-sm bg-white/80 border-purple-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={request.avatar} 
                            alt={request.name}
                            className="w-12 h-12 rounded-full border-2 border-purple-200"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{request.name}</h3>
                            <p className="text-sm text-gray-500">Request pending</p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancelRequest(request.id, request.name)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          Cancel Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discover" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {/* Mock suggested friends */}
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="backdrop-blur-sm bg-white/80 border-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={`https://images.unsplash.com/photo-${1500648767791 + i}?w=150&h=150&fit=crop&crop=face`}
                        alt={`Suggested ${i}`}
                        className="w-12 h-12 rounded-full border-2 border-purple-200"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">Suggested Friend {i}</h3>
                        <p className="text-sm text-gray-500">{Math.floor(Math.random() * 10) + 1} mutual friends</p>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <UserPlus size={16} className="mr-2" />
                      Add Friend
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Friends;
