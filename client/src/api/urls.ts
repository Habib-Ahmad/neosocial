import { get } from 'http';
import { searchUsers } from './auth';

export const urls = {
	auth: {
		register: '/users',
		login: '/users/login',
		logout: '/users/logout',
		getById: (id: string) => `/users/${id}`,
		getFriends: (id: string) => `/users/friends/${id}`,
		getFriendRequests: '/users/friend-requests',
		update: '/users/update',
		updatePassword: '/users/update/password',
		sendFriendRequest: '/users/friend-request',
		acceptFriendRequest: '/users/friend-request/accept',
		rejectFriendRequest: '/users/friend-request/reject',
		cancelFriendRequest: '/users/friend-request/cancel',
		removeFriend: '/users/friends/remove',
		suggestFriends: '/users/friend-suggestions',

		searchUsers: (query: string) =>
			`/users/search?query=${encodeURIComponent(query)}`,
	},
	posts: {
		create: '/posts',
		getAll: '/posts',
		getLatestFeed: '/posts/latest',
		getDiscoverFeed: '/posts/discover',
		getByUserId: (userId: string) => `/posts/user/${userId}`,
		getRepostedPostsByUserId: (userId: string) =>
			`/posts/user/${userId}/reposts`, // <-- Add this line for reposted posts
		getById: (id: string) => `/posts/${id}`,
		update: (id: string) => `/posts/${id}`,
		delete: (id: string) => `/posts/${id}`,
		toggleLike: (id: string) => `/posts/${id}/like`,
		toggleCommentLike: (commentId: string) =>
			`posts/${commentId}/comments/like`,
		createComment: (postId: string) => `/posts/${postId}/comments`,
		createGroupPost: (groupId: string) => `/posts/${groupId}`,
		repost: (postId: string) => `/posts/${postId}/repost`, // <-- Add this line for repost
	},
	groups: {
		create: '/groups',
		getMembers: (groupId: string) => `/groups/${groupId}/members`,
		join: (groupId: string) => `/groups/${groupId}/join`,
		getSentRequests: () => `/groups/sent-requests`,
		getReceivedRequests: () => `/groups/received-requests`,
		acceptJoinRequest: (requestId: string) => `/groups/${requestId}/accept`,
		rejectJoinRequest: (requestId: string) => `/groups/${requestId}/reject`,
		cancelJoinRequest: (requestId: string) => `/groups/${requestId}/cancel`,
		reviewJoinRequest: (groupId: string, requestId: string) =>
			`/groups/${groupId}/requests/${requestId}`,
		search: (query: string) =>
			`/groups/search?query=${encodeURIComponent(query)}`,
		getUserGroups: '/users/me/groups',
		getGroupById: (groupId: string) => `/groups/${groupId}`,
		leave: (groupId: string) => `/groups/${groupId}/leave`,
		suggestGroups: '/groups/suggest',
		removeMember: (groupId: string, memberId: string) =>
			`/groups/${groupId}/remove/${memberId}`,
		updateGroup: (groupId: string) => `/groups/${groupId}`, // <-- Add this line for update group
	},
};
