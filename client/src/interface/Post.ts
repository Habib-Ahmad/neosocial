export interface PostPayload {
	content: string;
	category: string;
}

export interface Post extends PostPayload {
	id: string;
	created_at: string;
	updated_at: string;
	is_deleted: boolean;
	likes_count: number;
	comments_count: number;
	reposts_count: number;
	location: string;
	liked_by_me: boolean;
	group_name: string;
	media_urls: string[];
	author: {
		id: string;
		name: string;
		email: string;
		profile_picture: string;
	};
	comments?: {
		id: string;
		content: string;
		likes_count: number;
		created_at: string;
		updated_at: string;
		author: {
			id: string;
			profile_picture: string;
			email: string;
			name: string;
		};
	}[];
}
