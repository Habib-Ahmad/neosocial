export interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  is_deleted: boolean;
  liked_by_user?: boolean;
  author: {
    id: string;
    name: string;
    email: string;
    profile_picture: string;
  };
}
