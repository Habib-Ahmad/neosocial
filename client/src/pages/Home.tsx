import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import { useQuery } from '@tanstack/react-query';
import { Post } from '@/interface/Post';
import { getLatestFeed, getDiscoverFeed } from '@/api/posts';
import { resolveImageUrl } from '@/lib/utils';

const Home: React.FC = () => {
	const [activeTab, setActiveTab] = useState('latest');

	const latestFeed = useQuery<Post[]>({
		queryKey: ['posts/latest'],
		queryFn: () => getLatestFeed(),
	});

	const discoverFeed = useQuery<Post[]>({
		queryKey: ['posts/discover'],
		queryFn: () => getDiscoverFeed(),
	});

	if (latestFeed.isPending || discoverFeed.isPending) {
		return <div className="text-center text-gray-500">Loading posts...</div>;
	}

	if (latestFeed.isError || discoverFeed.isError) {
		return (
			<div className="text-center text-red-500">
				Error loading posts. Please try again later.
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{/* Create Post */}
			<CreatePost />

			{/* Post Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border border-purple-100">
					<TabsTrigger
						value="latest"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						Latest
					</TabsTrigger>
					<TabsTrigger
						value="discover"
						className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
					>
						Discover
					</TabsTrigger>
				</TabsList>

				<TabsContent value="latest" className="space-y-4 mt-6">
					{latestFeed.data && latestFeed.data.length > 0 ? (
						latestFeed.data.map((post) => (
							<PostCard
								key={post.id}
								post={post}
								groupName={post.group_name || null}
							/>
						))
					) : (
						<div className="text-center p-8 backdrop-blur-sm bg-white/80 border border-purple-100 rounded-xl">
							<p className="text-gray-600 mb-2">
								Your feed is currently empty.
							</p>
							<p className="text-gray-500">
								Make a post, add friends, or join a group to see their latest
								posts here.
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent value="discover" className="space-y-4 mt-6">
					{discoverFeed.data?.length
						? discoverFeed.data.map((post) => (
								<PostCard
									key={post.id}
									post={post}
									groupName={post.group_name || null} // Pass group_name if exists
								/>
						  ))
						: null}
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default Home;
