import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, Globe } from 'lucide-react';
import { Post } from '@/interface/Post';
import PostCard from '@/components/PostCard';

const dummyGroup = {
	id: 'group-123',
	name: 'NeoSocial Developers',
	cover_image: '',
	description: 'A group for developers building NeoSocial.',
	category: 'Technology',
	privacy: 'public',
	created_at: new Date().toISOString(),
	member_count: 12,
	rules: 'Be kind and respectful.',
};

const dummyPosts: Post[] = [];
const dummyMembers = [
	{
		id: 'user-1',
		first_name: 'Alice',
		last_name: 'Smith',
		profile_picture: '/default_profile.png',
	},
	{
		id: 'user-2',
		first_name: 'Bob',
		last_name: 'Johnson',
		profile_picture: '/default_profile.png',
	},
];

const GroupProfile: React.FC = () => {
	const { groupId } = useParams();
	const group = dummyGroup;

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
				<CardHeader className="relative">
					<div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-lg opacity-10"></div>
					<div className="relative pt-8">
						<div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
							<div className="relative">
								<img
									src={group.cover_image || '/default_group.png'}
									alt={group.name}
									className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg"
								/>
							</div>
							<div className="flex-1 text-center md:text-left">
								<h1 className="text-2xl md:text-3xl font-bold text-gray-900">
									{group.name}
								</h1>
								<p className="text-gray-600 mt-2">{group.description}</p>
								<div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-4 text-sm text-gray-500">
									<div className="flex items-center space-x-1">
										<Globe size={16} />
										<span>{group.privacy}</span>
									</div>
									<div className="flex items-center space-x-1">
										<Users size={16} />
										<span>{group.member_count} members</span>
									</div>
									<div className="flex items-center space-x-1">
										<FileText size={16} />
										<span>{dummyPosts.length} posts</span>
									</div>
								</div>
							</div>
							<div className="flex space-x-2">
								<Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
									Join Group
								</Button>
							</div>
						</div>
					</div>
				</CardHeader>
			</Card>

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
						value="members"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						Members
					</TabsTrigger>
				</TabsList>

				<TabsContent value="posts" className="space-y-4 mt-6">
					{dummyPosts.length > 0 ? (
						dummyPosts.map((post) => <PostCard key={post.id} post={post} />)
					) : (
						<Card className="text-center p-8 backdrop-blur-sm bg-white/80 border-purple-100">
							<p className="text-gray-500">No posts yet</p>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="about" className="mt-6">
					<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
						<CardContent className="p-6 space-y-4">
							<div>
								<label className="text-sm font-medium text-gray-500">
									Category
								</label>
								<p className="text-gray-800">{group.category}</p>
							</div>
							<div>
								<label className="text-sm font-medium text-gray-500">
									Rules
								</label>
								<p className="text-gray-800">{group.rules}</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="members" className="mt-6">
					<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
						<CardContent className="p-6">
							<h3 className="text-lg font-semibold mb-4">
								Members ({dummyMembers.length})
							</h3>
							<div className="grid gap-4">
								{dummyMembers.map((member) => (
									<Card
										key={member.id}
										className="backdrop-blur-sm bg-white/80 border-purple-100"
									>
										<CardContent className="p-4">
											<div className="flex items-center space-x-4">
												<img
													src={member.profile_picture}
													alt={`${member.first_name} ${member.last_name}`}
													className="w-12 h-12 rounded-full border-2 border-purple-200"
												/>
												<div>
													<Link
														to={`/profile/${member.id}`}
														className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors"
													>
														{member.first_name} {member.last_name}
													</Link>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default GroupProfile;
