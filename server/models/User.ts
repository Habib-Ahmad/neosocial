export interface BirthDate {
  year: number;
  month: number;
  day: number;
}

export interface Timestamp extends BirthDate {
  hour: number;
  minute: number;
  second: number;
  nanosecond: number;
  timeZoneOffsetSeconds: number;
  timeZoneId: string | null;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  username?: string;
  bio?: string;
  profile_picture?: string;
  cover_photo?: string;
  location?: string;
  birth_date?: BirthDate;
  created_at?: Timestamp;
  last_active?: Timestamp;
  privacy_level?: "public" | "private" | "friends_only";
  status?: "active" | "inactive" | "banned";
}
