
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageSquare, UserPlus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/api/notifications';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/types';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.actor_name} liked your post`;
      case 'comment':
        return `${notification.actor_name} commented on your post`;
      case 'friend_request':
        return `${notification.actor_name} sent you a friend request`;
      default:
        return 'New notification';
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been updated.",
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse text-gray-500">Loading notifications...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                onClick={handleMarkAllAsRead}
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
                notification.is_read 
                  ? 'bg-white/60' 
                  : 'bg-white/90 border-l-4 border-l-purple-500'
              }`}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {notification.actor_name.charAt(0)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.type)}
                        <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                          {getNotificationMessage(notification)}
                        </p>
                      </div>
                      
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.created_at && formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
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
