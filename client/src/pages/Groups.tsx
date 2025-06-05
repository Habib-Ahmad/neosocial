import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserGroups } from '@/api/groups';

const Groups: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [myGroups, setMyGroups] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const groupRequests = [];
	const groupSuggestions = [];
	const searchResults = [];
	const discoverGroups = [];

	useEffect(() => {
		const fetchGroups = async () => {
			try {
				const groups = await getUserGroups();
				setMyGroups(groups);
			} catch (error) {
				console.error('Failed to fetch user groups:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchGroups();
	}, []);

	const handleSearch = () => {
		// Implement search backend integration later
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
						Requests ({groupRequests.length})
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
											<div className="flex items-center justify-between">
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

				{/* You can now re-enable Discover/Search tabs as needed */}
			</Tabs>
		</div>
	);
};

export default Groups;
