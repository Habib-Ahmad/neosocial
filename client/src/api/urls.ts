export const urls = {

  auth: {
    register: "/users",
    login: "/users/login",
    logout: "/users/logout",
    getById: (id: string) => `/users/${id}`,
    getFriends: (id: string) => `/users/friends/${id}`,
    getFriendRequests: "/users/friend-requests",
    update: "/users/update",
    updatePassword: "/users/update/password",
    sendFriendRequest: "/users/friend-request",
    acceptFriendRequest: "/users/friend-request/accept",
    rejectFriendRequest: "/users/friend-request/reject",
    cancelFriendRequest: "/users/friend-request/cancel",
    removeFriend: "/users/friends/remove",
    suggestFriends: "/users/friend-suggestions",
  },
  posts: {
    create: "/posts",
   	getAll: '/posts',
    getLatestFeed: "/posts/latest",
    getDiscoverFeed: "/posts/discover",
    getByUserId: (userId: string) => `/posts/user/${userId}`,
    getById: (id: string) => `/posts/${id}`,
    update: (id: string) => `/posts/${id}`,
    delete: (id: string) => `/posts/${id}`,
    toggleLike: (id: string) => `/posts/${id}/like`,
    toggleCommentLike: (commentId: string) =>
			`posts/${commentId}/comments/like`,
		createComment: (postId: string) => `/posts/${postId}/comments`,
  },
};
