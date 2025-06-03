export interface CommentCreate {
	content: string;
	post_id: string;
}

export interface Comment {
	id: string;
	content: string;
	likes_count: number;
	liked_by_user: boolean;
	created_at: string;
	updated_at: string;
	is_deleted: boolean;
}
