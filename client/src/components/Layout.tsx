import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "@/components/NotificationDropdown";
import {
  Home,
  User,
  Users,
  Bell,
  LogOut,
  GroupIcon,
  MessageSquareText,
} from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/home"
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
            >
              NeoSocial
            </Link>

            <nav className="hidden lg:flex items-center space-x-6">
              <Link
                to="/home"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isActive("/home")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
              >
                <Home size={20} />
                <span>Home</span>
              </Link>

              <Link
                to="/profile"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isActive("/profile")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
              >
                <User size={20} />
                <span>Profile</span>
              </Link>

              <Link
                to="/friends"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isActive("/friends")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
              >
                <Users size={20} />
                <span>Friends</span>
              </Link>

              {/* <Link
                to="/notifications"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isActive("/notifications")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
              >
                <Bell size={20} />
                <span>Notifications</span>
              </Link> */}
              <Link
                to="/groups"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isActive("/groups")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
              >
                <GroupIcon size={20} />
                <span>Groups</span>
              </Link>
              <Link
                to="/messages"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isActive("/messages")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
              >
                <MessageSquareText size={20} />
                <span>Messages</span>
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              
              <div className="flex items-center space-x-2">
                <img
                  src={resolveImageUrl(user?.profile_picture || "")}
                  alt={user.first_name}
                  className="w-8 h-8 rounded-full border-2 border-purple-200"
                />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.first_name} {user?.last_name}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-purple-100">
        <div className="flex justify-around py-3">
          <Link
            to="/home"
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
              isActive("/home") ? "text-purple-600" : "text-gray-600"
            }`}
          >
            <Home size={20} />
            <span className="text-xs">Home</span>
          </Link>

          <Link
            to={`/profile/${user.id}`}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
              isActive("/profile") ? "text-purple-600" : "text-gray-600"
            }`}
          >
            <User size={20} />
            <span className="text-xs">Profile</span>
          </Link>

          <Link
            to="/friends"
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
              isActive("/friends") ? "text-purple-600" : "text-gray-600"
            }`}
          >
            <Users size={20} />
            <span className="text-xs">Friends</span>
          </Link>

          <Link
            to="/groups"
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
              isActive("/groups") ? "text-purple-600" : "text-gray-600"
            }`}
          >
            <GroupIcon size={20} />
            <span className="text-xs">Groups</span>
          </Link>

          <Link
            to="/messages"
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
              isActive("/messages") ? "text-purple-600" : "text-gray-600"
            }`}
          >
            <MessageSquareText size={20} />
            <span className="text-xs">Messages</span>
          </Link>

          {/* <Link
            to="/notifications"
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
              isActive("/notifications") ? "text-purple-600" : "text-gray-600"
            }`}
          >
            <Bell size={20} />
            <span className="text-xs">Notifications</span>
          </Link> */}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
