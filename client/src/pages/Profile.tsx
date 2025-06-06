import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Calendar, Users, FileText } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { User } from '@/interface/User';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getUserById,
	getUserFriends,
	sendFriendRequest,
	removeFriend,
	cancelFriendRequest,
} from '@/api/auth';
import { Post } from '@/interface/Post';
import { getPostsByUserId } from '@/api/posts';
import { useToast } from '@/hooks/use-toast';
import { IMG_BASE_URL } from '@/api';

function extractSignupDate(user: User): Date {
	const { created_at } = user;
	const year = created_at.year.low;
	const month = created_at.month.low - 1;
	const day = created_at.day.low;
	const hour = created_at.hour.low;
	const minute = created_at.minute.low;
	const second = created_at.second.low;
	return new Date(Date.UTC(year, month, day, hour, minute, second));
}

const Profile: React.FC = () => {
	const { userId } = useParams();
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const { toast } = useToast();

	// Fetch user data
	const userData = useQuery<User>({
		queryKey: [`user/${userId || user?.id}`],
		queryFn: () => getUserById(userId || user?.id || '', user?.id || ''),
		enabled: !!userId || !!user?.id,
	});

	// Fetch posts by user
	const userPosts = useQuery<Post[]>({
		queryKey: [`userPosts/${userId || user?.id}`],
		queryFn: () => getPostsByUserId(userId || user?.id || ''),
		enabled: !!userId || !!user?.id,
	});

	// Fetch friends data
	const friendsData = useQuery<User[]>({
		queryKey: [`userFriends/${userId || user?.id}`],
		queryFn: () => getUserFriends(userId || user?.id || ''),
		enabled: !!userId || !!user?.id,
	});

	// Handle sending a friend request
	const { mutateAsync: sendRequest } = useMutation({
		mutationFn: () => sendFriendRequest(userId || ''),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`friendRequests/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`user/${userId || user?.id}`],
				exact: true,
			});
			toast({
				title: 'Friend Request Sent',
				description: 'Your friend request has been sent successfully.',
			});
		},
	});

	// Handle canceling a friend request
	const { mutateAsync: cancelRequest } = useMutation({
		mutationFn: cancelFriendRequest,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`friendRequests/${user?.id}`],
				exact: true,
			});
		},
	});

	// Handle removing a friend
	const { mutateAsync: remove } = useMutation({
		mutationFn: removeFriend,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`userFriends/${user?.id}`],
				exact: true,
			});
		},
	});

	// Check if the current user is viewing their own profile
	const isOwnProfile = !userId || userId === user?.id;
	const profileUser = userData.data;

	const joinDate = new Date(
		profileUser?.created_at?.second?.low * 1000 || Date.now()
	).toISOString();

	if (userData.isLoading || userPosts.isLoading || friendsData.isLoading) {
		return (
			<div className="max-w-4xl mx-auto">
				<Card className="text-center p-8">
					<p className="text-gray-500">Loading profile...</p>
				</Card>
			</div>
		);
	}

	if (userData.isError || userPosts.isError || friendsData.isError) {
		return (
			<div className="max-w-4xl mx-auto">
				<Card className="text-center p-8">
					<p className="text-red-500">Error loading profile</p>
				</Card>
			</div>
		);
	}

	if (!profileUser) {
		return (
			<div className="max-w-4xl mx-auto">
				<Card className="text-center p-8">
					<p className="text-gray-500">User not found</p>
				</Card>
			</div>
		);
	}

	// Check if the profile is private and if the current user can see the posts
	const isProfilePrivate =
		profileUser.privacy_level === 'private' &&
		(user?.id !== userId || !profileUser.is_friend);

	// Handle canceling a friend request
	const handleCancelRequest = async (friendId: string, name: string) => {
		await cancelRequest(friendId);
		toast({
			title: 'Friend request cancelled',
			description: `Cancelled friend request to ${name}`,
		});
		queryClient.invalidateQueries({
			queryKey: [`user/${userId || user?.id}`],
			exact: true,
		});
	};

	const handleRemoveFriend = async (friendId: string, name: string) => {
		await remove(friendId);
		toast({
			title: 'Friend removed',
			description: `You have removed ${name} from your friends`,
		});
		queryClient.invalidateQueries({
			queryKey: [`user/${userId || user?.id}`],
			exact: true,
		});
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Profile Header */}
			<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
				<CardHeader className="relative">
					<div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-lg opacity-10"></div>
					<div className="relative pt-8">
						<div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
							{/* Avatar */}
							<div className="relative">
								<img
									src={
										profileUser.profile_picture.includes('http')
											? profileUser.profile_picture
											: `${IMG_BASE_URL}${profileUser.profile_picture}`
									}
									alt={profileUser.first_name}
									className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg"
								/>
							</div>

							{/* User Info */}
							<div className="flex-1 text-center md:text-left">
								<h1 className="text-2xl md:text-3xl font-bold text-gray-900">
									{profileUser.first_name} {profileUser.last_name}
								</h1>
								{profileUser.bio && (
									<p className="text-gray-600 mt-2">{profileUser.bio}</p>
								)}

								<div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-4 text-sm text-gray-500">
									<div className="flex items-center space-x-1">
										<Calendar size={16} />
										<span>
											Joined{' '}
											{extractSignupDate(profileUser).toLocaleDateString()}
										</span>
									</div>
									<div className="flex items-center space-x-1">
										<Users size={16} />
										<span>{profileUser.friend_count} friends</span>
									</div>
									<div className="flex items-center space-x-1">
										<FileText size={16} />
										<span>{profileUser.post_count} posts</span>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex space-x-2">
								{isOwnProfile ? (
									<Link to="/edit-profile">
										<Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
											<Edit size={16} className="mr-2" />
											Edit Profile
										</Button>
									</Link>
								) : (
									<>
										{profileUser?.is_friend && (
											<Button
												onClick={() =>
													handleRemoveFriend(
														profileUser.id,
														profileUser.first_name
													)
												}
												className="bg-red-100 text-red-700 hover:bg-red-200"
											>
												Remove Friend
											</Button>
										)}
										{profileUser?.sent_request && (
											<Button
												onClick={() =>
													handleCancelRequest(
														profileUser.id,
														profileUser.first_name
													)
												}
												className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
											>
												Cancel Request
											</Button>
										)}
										{!profileUser?.is_friend &&
											!profileUser?.sent_request &&
											!profileUser?.received_request && (
												<Button
													onClick={() => sendRequest()}
													className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
												>
													Add Friend
												</Button>
											)}
										{profileUser.is_friend && (
											<Button
												asChild
												className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
											>
												<Link to={`/messages/${profileUser.id}`}>Message</Link>
											</Button>
										)}
									</>
								)}
							</div>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Profile Content */}
			{isProfilePrivate && !isOwnProfile && !profileUser.is_friend ? (
				<div className="text-center text-gray-500">Profile is private</div>
			) : (
				<Tabs defaultValue="posts" className="w-full">
					<TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-purple-100">
						<TabsTrigger
							value="posts"
							className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
						>
							Posts
						</TabsTrigger>
						<TabsTrigger
							value="about"
							className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
						>
							About
						</TabsTrigger>
						<TabsTrigger
							value="friends"
							className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
						>
							Friends
						</TabsTrigger>
					</TabsList>

					<TabsContent value="posts" className="space-y-4 mt-6">
						{userPosts?.data.length > 0 ? (
							userPosts.data.map((post) => (
								<PostCard
									key={post.id}
									post={post}
									groupName={post.group_name}
								/>
							))
						) : (
							<Card className="text-center p-8 backdrop-blur-sm bg-white/80 border-purple-100">
								<p className="text-gray-500">No posts yet</p>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="about" className="mt-6">
						<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
							<CardContent className="p-6">
								<h3 className="text-lg font-semibold mb-4">
									About {profileUser.first_name}
								</h3>
								<div className="space-y-4">
									<div>
										<label className="text-sm font-medium text-gray-500">
											Bio
										</label>
										<p className="text-gray-800">
											{profileUser.bio || 'No bio available'}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-500">
											Email
										</label>
										<p className="text-gray-800">{profileUser.email}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-500">
											Member since
										</label>
										<p className="text-gray-800">
											{extractSignupDate(profileUser).toLocaleDateString()}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="friends" className="mt-6">
						<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
							<CardContent className="p-6">
								<h3 className="text-lg font-semibold mb-4">
									Friends ({profileUser.friend_count})
								</h3>
								<div className="grid gap-4">
									{friendsData.data?.map((friend) => (
										<Card
											key={friend.id}
											className="backdrop-blur-sm bg-white/80 border-purple-100"
										>
											<CardContent className="p-4">
												<div className="flex items-center justify-between">
													<div className="flex items-center space-x-4">
														<img
															src={`http://localhost:5000${friend.profile_picture}`}
															alt={`${friend.first_name} ${friend.last_name}`}
															className="w-12 h-12 rounded-full border-2 border-purple-200"
														/>
														<div>
															<Link
																to={`/profile/${friend.id}`}
																className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors"
															>
																{friend.first_name} {friend.last_name}
															</Link>
															<p className="text-sm text-gray-500">
																{friend.mutual_friends_count || 0} mutual
																friends
															</p>
														</div>
													</div>
													<div /> {/* Empty space on the right */}
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
};

export default Profile;
