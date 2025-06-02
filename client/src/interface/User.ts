export interface SignupPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface User extends SignupPayload {
  id: string;
  profile_picture: string;
  bio?: string;
  friend_count: number;
  post_count: number;
  mutual_friends_count?: number;
  created_at: {
    nanosecond: { low: number; high: number };
    second: { low: number; high: number };
    minute: { low: number; high: number };
    hour: { low: number; high: number };
    day: { low: number; high: number };
    month: { low: number; high: number };
    year: { low: number; high: number };
    timeZoneOffsetSeconds: { low: number; high: number };
  };
}

export interface FriendRequest {
  id: string;
  type: "sent" | "received";
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string;
  mutual_friends_count: number;
}
