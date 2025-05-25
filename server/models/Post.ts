export interface Post {
  id: string;
  content: string;
  created_at: string; // ISO format
  updated_at: string; // ISO format
  is_deleted: boolean;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
}
