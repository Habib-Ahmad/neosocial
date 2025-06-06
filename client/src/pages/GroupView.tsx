import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, Globe, UserPlus } from 'lucide-react';
import { Post } from '@/interface/Post';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import {
	getGroupDetails,
	submitJoinRequest,
	leaveGroup,
	cancelJoinRequest,
	removeGroupMember,
} from '@/api/groups';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { resolveImageUrl } from '@/lib/utils';

const GroupProfile: React.FC = () => {
	const { user } = useAuth();

	const { groupId } = useParams<{ groupId: string }>();
	const [group, setGroup] = useState<any>(null);
	const [posts, setPosts] = useState<Post[]>([]);
	const [members, setMembers] = useState<any[]>([]);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isMember, setIsMember] = useState(false);
	const [hasRequested, setHasRequested] = useState(false);
	const [isPublic, setIsPublic] = useState(false);
	const [memberCount, setMemberCount] = useState(0);
	const [friendCount, setFriendCount] = useState(0);
	const [joinRequestId, setJoinRequestId] = useState<string | null>(null);

	const refreshGroupDetails = async () => {
		const data = await getGroupDetails(groupId!);
		setGroup(data.group);
		setPosts(data.posts);
		setMembers(data.members);
		setIsAdmin(data.isAdmin);
		setIsMember(data.isMember);
		setHasRequested(data.hasRequested);
		setMemberCount(data.memberCount);
		setFriendCount(data.friendCount);
		setJoinRequestId(data.joinRequestId || null);
	};
	const handleRemoveMember = async (memberId: string) => {
		try {
			await removeGroupMember(group.id, memberId);
			toast({ title: 'Member removed successfully' });
			await refreshGroupDetails();
		} catch (err) {
			console.error(err);
			toast({
				title: 'Failed to remove member',
				variant: 'destructive',
			});
		}
	};
	const handleCancelRequest = async () => {
		if (!joinRequestId) return;
		try {
			await cancelJoinRequest(joinRequestId);
			await refreshGroupDetails();
		} catch (error) {
			console.error('Failed to cancel join request:', error);
		}
	};
	const handleJoinGroup = async () => {
		try {
			await submitJoinRequest(groupId!);
			await refreshGroupDetails();
		} catch (error) {
			console.error('Failed to join group:', error);
		}
	};

	const handleLeaveGroup = async () => {
		try {
			await leaveGroup(groupId!);
			await refreshGroupDetails();
		} catch (error) {
			console.error('Failed to leave group:', error);
		}
	};

	useEffect(() => {
		const fetchDetails = async () => {
			try {
				const data = await getGroupDetails(groupId!);
				setGroup(data.group);
				setPosts(data.posts);
				setMembers(data.members);
				setIsAdmin(data.isAdmin);
				setIsMember(data.isMember);
				setHasRequested(data.hasRequested);
				setMemberCount(data.memberCount);
				setFriendCount(data.friendCount);
				setJoinRequestId(data.joinRequestId || null); // <--- HERE
			} catch (error) {
				console.error('Failed to load group details:', error);
			}
		};

		if (groupId) fetchDetails();
	}, [groupId]);

	if (!group)
		return <p className="text-center text-gray-500">Loading group...</p>;

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
				<CardHeader className="relative">
					<div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-lg opacity-10"></div>
					<div className="relative pt-8">
						<div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
							<div className="relative">
								<img
									src={resolveImageUrl(group.cover_image)}
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
										<Users size={16} />
										<span>
											{memberCount} member(s) / {friendCount} friend(s)
										</span>
									</div>
									<div className="flex items-center space-x-1">
										<FileText size={16} />
										<span>{posts.length} post(s)</span>
									</div>
								</div>
							</div>
							<div className="flex space-x-2">
								{isAdmin && (
									<Link to={`/edit-group/${group.id}`}>
										<Button
											variant="outline"
											className="text-blue-700 border-blue-300"
										>
											Edit Group
										</Button>
									</Link>
								)}
								{isMember && !isAdmin && (
									<Button
										onClick={handleLeaveGroup}
										variant="outline"
										className="text-red-700 border-red-300"
									>
										Leave Group
									</Button>
								)}
								{hasRequested && !isMember && (
									<Button
										onClick={handleCancelRequest}
										variant="outline"
										className="text-yellow-700 border-yellow-300"
									>
										Cancel Request
									</Button>
								)}
								{!isMember && !hasRequested && (
									<Button
										onClick={handleJoinGroup}
										className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
									>
										Join Group
									</Button>
								)}
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
					{isMember && <CreatePost groupId={group.id} />}
					{posts.length > 0 ? (
						posts.map((post) => (
							<PostCard key={post.id} post={post} groupName={group.name} />
						))
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
								Members ({members.length})
							</h3>
							<div className="grid gap-4">
								{members.map((memberObj) => {
									const member = memberObj.user;
									const isSelf = member.id === user?.id;

									return (
										<Card
											key={member.id}
											className="backdrop-blur-sm bg-white/80 border-purple-100"
										>
											<CardContent className="p-4">
												<div className="flex items-center justify-between">
													<div className="flex items-center space-x-4">
														<img
															src={resolveImageUrl(member.profile_picture)}
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
													{isAdmin && !isSelf && (
														<Button
															variant="outline"
															size="sm"
															className="text-red-600 border-red-300 hover:bg-red-50"
															onClick={() => {
																if (
																	window.confirm(
																		`are you sure you want to remove ${member.first_name}?`
																	)
																) {
																	handleRemoveMember(member.id);
																}
															}}
														>
															Remove
														</Button>
													)}
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default GroupProfile;
