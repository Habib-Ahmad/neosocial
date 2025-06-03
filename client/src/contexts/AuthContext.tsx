import { loginUser, registerUser } from "@/api/auth";
import { User } from "@/interface/User";
import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  user: User | null;
  login: (user: User, token: string) => boolean;
  logout: () => void;
  updateProfile: (user: User) => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const updateProfile = (user: User) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
