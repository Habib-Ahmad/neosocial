import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
	getUserGroups,
	searchGroups,
	getSentJoinRequests,
	getReceivedJoinRequests,
	acceptJoinRequest,
	rejectJoinRequest,
	cancelJoinRequest,
	suggestGroups,
} from '@/api/groups';

const Groups: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [myGroups, setMyGroups] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sentRequests, setSentRequests] = useState<any[]>([]);
	const [receivedRequests, setReceivedRequests] = useState<any[]>([]);

	const [groupSuggestions, setGroupSuggestions] = useState<any[]>([]);

	const [searchResults, setSearchResults] = useState<any[]>([]);

	useEffect(() => {
		const fetchGroups = async () => {
			try {
				const groups = await getUserGroups();
				setMyGroups(groups);

				const sent = await getSentJoinRequests();
				const received = await getReceivedJoinRequests();
				const suggestions = await suggestGroups();

				setSentRequests(sent);
				setReceivedRequests(received);
				setGroupSuggestions(suggestions);
			} catch (error) {
				console.error('Failed to fetch groups or requests:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchGroups();
	}, []);
	const handleAccept = async (requestId: string) => {
		try {
			await acceptJoinRequest(requestId);
			setReceivedRequests((prev) =>
				prev.filter((r) => r.request.id !== requestId)
			);
		} catch (err) {
			console.error('Accept failed', err);
		}
	};

	const handleReject = async (requestId: string) => {
		try {
			await rejectJoinRequest(requestId);
			setReceivedRequests((prev) =>
				prev.filter((r) => r.request.id !== requestId)
			);
		} catch (err) {
			console.error('Reject failed', err);
		}
	};

	const handleCancel = async (requestId: string) => {
		try {
			await cancelJoinRequest(requestId);
			setSentRequests((prev) => prev.filter((r) => r.request.id !== requestId));
		} catch (err) {
			console.error('Cancel failed', err);
		}
	};

	const handleSearch = async () => {
		try {
			const results = await searchGroups(searchTerm);
			setSearchResults(results);
		} catch (error) {
			console.error('Search failed:', error);
		}
	};

	const filteredGroups = myGroups.filter((group) => {
		const name = group?.name?.toString().toLowerCase();
		return name && name.includes(searchTerm.toLowerCase());
	});

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
						Groups
					</CardTitle>
					<Link to="/create-group">
						<Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
							Create Group
						</Button>
					</Link>
				</CardHeader>
			</Card>

			<Tabs defaultValue="my" className="w-full">
				<TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-purple-100">
					<TabsTrigger
						value="my"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						My Groups ({myGroups.length})
					</TabsTrigger>
					<TabsTrigger
						value="requests"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						Requests ({receivedRequests.length + sentRequests.length})
					</TabsTrigger>
					<TabsTrigger
						value="discover"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						Discover Groups
					</TabsTrigger>
					<TabsTrigger
						value="search"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						Search Groups
					</TabsTrigger>
				</TabsList>

				<TabsContent value="my" className="space-y-4 mt-6">
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
							size={20}
						/>
						<Input
							placeholder="Search your groups..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 bg-white/80 backdrop-blur-sm border-purple-100"
						/>
					</div>

					{isLoading ? (
						<p className="text-center text-gray-500">Loading groups...</p>
					) : (
						<div className="grid gap-4">
							{filteredGroups.length > 0 ? (
								filteredGroups.map((group) => (
									<Card
										key={group.id}
										className="backdrop-blur-sm bg-white/80 border-purple-100"
									>
										<CardContent className="p-4">
											<div className="flex items-center space-x-4">
												<img
													src={
														`http://localhost:5000${group.cover_image}` ||
														'/default_group.png'
													}
													className="w-12 h-12 rounded-full border-2 border-purple-200"
												/>
												<div>
													<Link
														to={`/groups/${group.id}`}
														className="text-sm font-medium text-gray-900 hover:text-purple-600"
													>
														{group.name}
													</Link>
													<p className="text-sm text-gray-500">
														{Number(group.member_count) || 0} member(s)
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								))
							) : (
								<Card className="text-center p-8 backdrop-blur-sm bg-white/80 border-purple-100">
									<p className="text-gray-500">
										You are not a member of any groups.
									</p>
								</Card>
							)}
						</div>
					)}
				</TabsContent>

				<TabsContent value="requests" className="space-y-6 mt-6">
					{/* RECEIVED REQUESTS */}
					<div>
						<h3 className="text-lg font-semibold mb-4">Received Requests</h3>
						{receivedRequests.length === 0 ? (
							<Card className="text-center p-6 bg-white/80 border-purple-100">
								<p className="text-gray-500">No received join requests.</p>
							</Card>
						) : (
							<div className="space-y-4">
								{receivedRequests.map(({ request, group, sender }) => (
									<Card
										key={request.id}
										className="bg-white/80 backdrop-blur-sm border-purple-100"
									>
										<CardContent className="p-4 flex items-center space-x-4">
											<img
												src={
													sender.profile_picture
														? `http://localhost:5000${sender.profile_picture}`
														: '/default_profile.png'
												}
												alt={sender.first_name}
												className="w-12 h-12 rounded-full border-2 border-purple-200"
											/>
											<div className="flex-1">
												<Link
													to={`/profile/${sender.id}`}
													className="font-medium text-gray-900 hover:text-purple-600"
												>
													{sender.first_name} {sender.last_name}
												</Link>
												<p className="text-sm text-gray-500">
													Wants to join{' '}
													<span className="font-semibold">{group.name}</span>
												</p>
											</div>
											<div className="flex space-x-2">
												<Button
													onClick={() => handleAccept(request.id)}
													className="bg-green-600 hover:bg-green-700 text-white"
												>
													Accept
												</Button>
												<Button
													onClick={() => handleReject(request.id)}
													variant="outline"
													className="text-red-600 hover:bg-red-50"
												>
													Decline
												</Button>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</div>

					{/* SENT REQUESTS */}
					<div>
						<h3 className="text-lg font-semibold mb-4">Sent Requests</h3>
						{sentRequests.length === 0 ? (
							<Card className="text-center p-6 bg-white/80 border-purple-100">
								<p className="text-gray-500">No sent join requests.</p>
							</Card>
						) : (
							<div className="space-y-4">
								{sentRequests.map(({ request, group }) => (
									<Card
										key={request.id}
										className="bg-white/80 backdrop-blur-sm border-purple-100"
									>
										<CardContent className="p-4 flex items-center justify-between space-x-4">
											<div className="flex items-center space-x-4">
												<img
													src={
														group.cover_image
															? `http://localhost:5000${group.cover_image}`
															: '/default_group.png'
													}
													alt={group.name}
													className="w-12 h-12 rounded-full border-2 border-purple-200"
												/>
												<div>
													<Link
														to={`/groups/${group.id}`}
														className="text-sm font-medium text-gray-900 hover:text-purple-600"
													>
														{group.name}
													</Link>
													<p className="text-sm text-gray-500">
														Request pending
													</p>
												</div>
											</div>
											<Button
												variant="outline"
												onClick={() => handleCancel(request.id)}
												className="text-gray-600 hover:bg-gray-50"
											>
												Cancel
											</Button>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</div>
				</TabsContent>

				{/* Discover Groups */}

				<TabsContent value="discover" className="space-y-4 mt-6">
					<div className="grid gap-4">
						{groupSuggestions.map((group) => (
							<Card
								key={group.id}
								className="bg-white/80 backdrop-blur-sm border-purple-100"
							>
								<CardContent className="p-4 flex items-center justify-between">
									<div className="flex items-center space-x-4">
										<img
											src={`http://localhost:5000${group.cover_image}`}
											className="w-12 h-12 rounded-full border-2 border-purple-200"
										/>
										<div>
											<Link
												to={`/groups/${group.id}`}
												className="text-sm font-medium text-gray-900 hover:text-purple-600"
											>
												{group.name}
											</Link>
											<p className="text-sm text-gray-500">
												{Number(group.member_count) || 0} member(s)
											</p>
										</div>
									</div>
									<div className="text-sm text-right text-gray-500 min-w-[80px]">
										{group.mutual_friends_count || 0} friend(s) in the group
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
				<TabsContent value="search" className="space-y-6 mt-6">
					<div className="flex items-center gap-4">
						<div className="relative w-full">
							<Search
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								size={20}
							/>
							<Input
								placeholder="Search for groups..."
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
							<p className="text-center text-gray-500">No groups found.</p>
						) : (
							searchResults.map((group) => (
								<Card
									key={group.id}
									className="bg-white/80 backdrop-blur-sm border-purple-100"
								>
									<CardContent className="p-4 flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<img
												src={
													`http://localhost:5000${group.cover_image}` ||
													'/default_group.png'
												}
												alt={group.name}
												className="w-12 h-12 rounded-full border-2 border-purple-200"
											/>
											<div>
												<Link
													to={`/groups/${group.id}`}
													className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors"
												>
													{group.name}
												</Link>
												<p className="text-sm text-gray-500">
													{Number(group.member_count) || 0} members
												</p>
											</div>
										</div>
										<Button
											variant="outline"
											className="text-purple-600 hover:bg-purple-50"
										>
											View
										</Button>
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

export default Groups;
