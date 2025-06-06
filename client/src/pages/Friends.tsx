import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, UserMinus, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FriendRequest, User } from '@/interface/User';
import { useAuth } from '@/contexts/AuthContext';
import {
	acceptFriendRequest,
	cancelFriendRequest,
	getFriendRequests,
	getFriendSuggestions,
	getUserFriends,
	rejectFriendRequest,
	removeFriend,
	searchUsers,
} from '@/api/auth';
import { resolveImageUrl } from '@/lib/utils';
import { IMG_BASE_URL } from '@/api';
const Friends: React.FC = () => {
	const { user } = useAuth();
	const [searchTerm, setSearchTerm] = useState('');
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const friendsData = useQuery<User[]>({
		queryKey: [`userFriends/${user?.id}`],
		queryFn: () => getUserFriends(user?.id || ''),
		enabled: !!user?.id,
	});
	const friendRequestData = useQuery<FriendRequest[]>({
		queryKey: [`friendRequests/${user?.id}`],
		queryFn: () => getFriendRequests(),
		enabled: !!user?.id,
	});

	const friendSuggestions = useQuery<User[]>({
		queryKey: [`friendSuggestions/${user?.id}`],
		queryFn: () => getFriendSuggestions(),
		enabled: !!user?.id,
	});

	const { mutateAsync: acceptRequest } = useMutation({
		mutationFn: acceptFriendRequest,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`userFriends/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`userFriends/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`friendRequests/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`userFriends/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`friendRequests/${user?.id}`],
				exact: true,
			});
		},
	});

	const { mutateAsync: rejectRequest } = useMutation({
		mutationFn: rejectFriendRequest,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`friendRequests/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`userFriends/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`friendRequests/${user?.id}`],
				exact: true,
			});
		},
	});

	const { mutateAsync: cancelRequest } = useMutation({
		mutationFn: cancelFriendRequest,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`friendRequests/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`userFriends/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`friendRequests/${user?.id}`],
				exact: true,
			});
		},
	});

	const { mutateAsync: remove } = useMutation({
		mutationFn: removeFriend,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`userFriends/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`userFriends/${user?.id}`],
				exact: true,
			});
			queryClient.invalidateQueries({
				queryKey: [`friendRequests/${user?.id}`],
				exact: true,
			});
		},
	});

	const filteredFriends = friendsData.data?.filter((friend) =>
		`${friend.first_name} ${friend.last_name}`
			.toLowerCase()
			.includes(searchTerm.toLowerCase())
	);

	const handleAcceptRequest = async (friendId: string, name: string) => {
		await acceptRequest(friendId);
		toast({
			title: 'Friend request accepted',
			description: `You are now friends with ${name}`,
		});
	};
	const [searchResults, setSearchResults] = useState<User[]>([]);

	const handleSearch = async () => {
		try {
			const results = await searchUsers(searchTerm);
			setSearchResults(results);
			toast({
				title: 'Search successful',
				description: `Found ${results.length} result(s).`,
			});
		} catch (err) {
			toast({
				title: 'Search failed',
				description: 'Something went wrong during the search.',
				variant: 'destructive',
			});
		}
	};
	const handleRejectRequest = async (friendId: string, name: string) => {
		await rejectRequest(friendId);
		toast({
			title: 'Friend request declined',
			description: `Declined friend request from ${name}`,
		});
	};

	const handleCancelRequest = async (friendId: string, name: string) => {
		await cancelRequest(friendId);
		toast({
			title: 'Friend request cancelled',
			description: `Cancelled friend request to ${name}`,
		});
	};

	const handleRemoveFriend = async (friendId: string, name: string) => {
		await remove(friendId);
		toast({
			title: 'Friend removed',
			description: `You have removed ${name} from your friends`,
		});
	};

	if (friendsData.isPending) {
		return (
			<div className="max-w-4xl mx-auto">
				<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
					<CardHeader>
						<CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
							Loading Friends...
						</CardTitle>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
				<CardHeader>
					<CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
						Friends
					</CardTitle>
				</CardHeader>
			</Card>

			<Tabs defaultValue="friends" className="w-full">
				<TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-purple-100">
					<TabsTrigger
						value="friends"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						My Friends ({friendsData.data?.length || 0})
					</TabsTrigger>
					<TabsTrigger
						value="requests"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						Requests ({friendRequestData.data?.length || 0})
					</TabsTrigger>
					<TabsTrigger
						value="discover"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						Discover
					</TabsTrigger>
					<TabsTrigger
						value="search"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						Search
					</TabsTrigger>
				</TabsList>

				<TabsContent value="friends" className="space-y-4 mt-6">
					{/* Search */}
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
							size={20}
						/>
						<Input
							placeholder="Search friends..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 bg-white/80 backdrop-blur-sm border-purple-100"
						/>
					</div>

					{/* Friends List */}
					<div className="grid gap-4">
						{filteredFriends.map((friend) => (
							<Card
								key={friend.id}
								className="backdrop-blur-sm bg-white/80 border-purple-100"
							>
								<CardContent className="p-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="relative">
												<img
													src={resolveImageUrl(friend.profile_picture)}
													alt={friend.first_name + ' ' + friend.last_name}
													className="w-12 h-12 rounded-full border-2 border-purple-200"
												/>
											</div>
											<div>
												<Link
													to={`/profile/${friend.id}`}
													className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors"
												>
													{friend.first_name} {friend.last_name}
												</Link>

												<p className="text-sm text-gray-500">
													{friend.mutual_friends_count || 0} mutual friends
												</p>
											</div>
										</div>

										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handleRemoveFriend(
													friend.id,
													`${friend.first_name} ${friend.last_name}`
												)
											}
											className="text-red-600 hover:text-red-700 hover:bg-red-50"
										>
											<UserMinus size={16} className="mr-2" />
											Remove
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="requests" className="space-y-4 mt-6">
					<div className="space-y-6">
						{/* Received Requests */}
						<div>
							<h3 className="text-lg font-semibold mb-4">Received Requests</h3>
							<div className="space-y-4">
								{friendRequestData.data?.length ? (
									friendRequestData.data
										.filter((req) => req.type === 'received')
										.map((request) => (
											<Card
												key={request.id}
												className="backdrop-blur-sm bg-white/80 border-purple-100"
											>
												<CardContent className="p-4">
													<div className="flex items-center justify-between">
														<div className="flex items-center space-x-4">
															<img
																src={resolveImageUrl(request.profile_picture)}
																alt={
																	request.first_name + ' ' + request.last_name
																}
																className="w-12 h-12 rounded-full border-2 border-purple-200"
															/>
															<div>
																<Link
																	to={`/profile/${request.id}`}
																	className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
																>
																	{request.first_name} {request.last_name}
																</Link>
																<p className="text-sm text-gray-500">
																	{request.mutual_friends_count || 0} mutual
																	friends
																</p>
															</div>
														</div>

														<div className="flex space-x-2">
															<Button
																size="sm"
																onClick={() =>
																	handleAcceptRequest(
																		request.id,
																		request.first_name
																	)
																}
																className="bg-green-600 hover:bg-green-700"
															>
																<Check size={16} className="mr-2" />
																Accept
															</Button>
															<Button
																variant="outline"
																size="sm"
																onClick={() =>
																	handleRejectRequest(
																		request.id,
																		request.first_name
																	)
																}
																className="text-red-600 hover:text-red-700 hover:bg-red-50"
															>
																<X size={16} className="mr-2" />
																Decline
															</Button>
														</div>
													</div>
												</CardContent>
											</Card>
										))
								) : (
									<Card className="backdrop-blur-sm bg-white/80 border-purple-100">
										<CardContent className="p-4 text-center">
											<p className="text-gray-500">No friend requests</p>
										</CardContent>
									</Card>
								)}
							</div>
						</div>

						{/* Sent Requests */}
						<div>
							<h3 className="text-lg font-semibold mb-4">Sent Requests</h3>
							<div className="space-y-4">
								{friendRequestData.data?.length ? (
									friendRequestData.data
										.filter((req) => req.type === 'sent')
										.map((request) => (
											<Card
												key={request.id}
												className="backdrop-blur-sm bg-white/80 border-purple-100"
											>
												<CardContent className="p-4">
													<div className="flex items-center justify-between">
														<div className="flex items-center space-x-4">
															<img
																src={resolveImageUrl(request.profile_picture)}
																alt={
																	request.first_name + ' ' + request.last_name
																}
																className="w-12 h-12 rounded-full border-2 border-purple-200"
															/>
															<div>
																<Link
																	to={`/profile/${request.id}`}
																	className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
																>
																	{request.first_name} {request.last_name}
																</Link>
																<p className="text-sm text-gray-500">
																	Request pending
																</p>
															</div>
														</div>

														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																handleCancelRequest(
																	request.id,
																	request.first_name
																)
															}
															className="text-gray-600 hover:text-gray-700"
														>
															Cancel Request
														</Button>
													</div>
												</CardContent>
											</Card>
										))
								) : (
									<Card className="backdrop-blur-sm bg-white/80 border-purple-100">
										<CardContent className="p-4 text-center">
											<p className="text-gray-500">No sent requests</p>
										</CardContent>
									</Card>
								)}
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="discover" className="space-y-4 mt-6">
					<div className="grid gap-4">
						{friendSuggestions.data?.length ? (
							friendSuggestions.data.map((result) => (
								<Card
									key={result.id}
									className="backdrop-blur-sm bg-white/80 border-purple-100"
								>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<img
													src={resolveImageUrl(result.profile_picture)}
													alt={`${result.first_name} ${result.last_name}`}
													className="w-12 h-12 rounded-full border-2 border-purple-200"
												/>
												<div>
													<Link
														to={`/profile/${result.id}`}
														className="font-medium text-gray-900 hover:text-purple-600 transition-colors"
													>
														{result.first_name} {result.last_name}
													</Link>
													<p className="text-sm text-gray-500">
														{result.email}
													</p>
												</div>
											</div>

											{/* Mutual Friends Count */}
											<div className="text-sm text-right text-gray-500 min-w-[80px]">
												{result.mutual_friends_count || 0} mutual friends
											</div>
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<Card className="backdrop-blur-sm bg-white/80 border-purple-100">
								<CardContent className="p-4 text-center">
									<p className="text-gray-500">
										No friend suggestions available
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</TabsContent>

				<TabsContent value="search" className="space-y-4 mt-6">
					<div className="flex items-center gap-4">
						<div className="relative w-full">
							<Search
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								size={20}
							/>
							<Input
								placeholder="Search for people..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 bg-white/80 backdrop-blur-sm border-purple-100"
							/>
						</div>
						<Button
							onClick={handleSearch}
							className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
						>
							Search
						</Button>
					</div>
					<div className="grid gap-4">
						{searchResults.length === 0 ? (
							<p className="text-gray-500 text-center">No users found.</p>
						) : (
							searchResults.map((result) => (
								<Card
									key={result.id}
									className="backdrop-blur-sm bg-white/80 border-purple-100"
								>
									<CardContent className="p-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-4">
												<img
													src={resolveImageUrl(result.profile_picture)}
													alt={`${result.first_name} ${result.last_name}`}
													className="w-12 h-12 rounded-full border-2 border-purple-200"
												/>
												<div>
													<Link
														to={`/profile/${result.id}`}
														className="font-medium text-gray-900 hover:text-purple-600 transition-colors"
													>
														{result.first_name} {result.last_name}
													</Link>
													<p className="text-sm text-gray-500">
														{result.email}
													</p>
												</div>
											</div>

											{/* Mutual Friends Count */}
											<div className="text-sm text-right text-gray-500 min-w-[80px]">
												{result.mutual_friends_count || 0} mutual friends
											</div>
										</div>
									</CardContent>
								</Card>
							))
						)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default Friends;
