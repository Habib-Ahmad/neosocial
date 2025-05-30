
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageSquare, UserPlus, Check } from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const { toast } = useToast();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="text-red-500" size={20} />;
      case 'comment':
        return <MessageSquare className="text-blue-500" size={20} />;
      case 'friend_request':
        return <UserPlus className="text-green-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    
    toast({
      title: "All notifications marked as read",
      description: "Your notifications have been updated.",
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center">
              <Bell className="mr-2" size={24} />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Check size={16} className="mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <Card 
              key={notification.id} 
              className={`backdrop-blur-sm border-purple-100 shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                notification.read 
                  ? 'bg-white/60' 
                  : 'bg-white/90 border-l-4 border-l-purple-500'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <img 
                    src={notification.avatar} 
                    alt="User"
                    className="w-10 h-10 rounded-full border-2 border-purple-200"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.type)}
                        <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                          {notification.message}
                        </p>
                      </div>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    
                    {notification.type === 'friend_request' && !notification.read && (
                      <div className="flex space-x-2 mt-3">
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center p-8 backdrop-blur-sm bg-white/80 border-purple-100">
            <Bell className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up! Check back later for new notifications.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Notifications;
