export const urls = {
  auth: {
    register: "/users",
    login: "/users/login",
    logout: "/users/logout",
    getById: (id: string) => `/users/${id}`,
    getFriends: (id: string) => `/users/friends/${id}`,
    update: "/users/update",
    updatePassword: "/users/update/password",
    sendFriendRequest: "/users/friend-request",
    acceptFriendRequest: "/users/friend-request/accept",
    rejectFriendRequest: "/users/friend-request/reject",
    cancelFriendRequest: "/users/friend-request/cancel",
  },
  posts: {
    create: "/posts",
    getAll: "/posts",
    getByUserId: (userId: string) => `/posts/user/${userId}`,
    getById: (id: string) => `/posts/${id}`,
    update: (id: string) => `/posts/${id}`,
    delete: (id: string) => `/posts/${id}`,
    toggleLike: (id: string) => `/posts/${id}/like`,
  },
};
