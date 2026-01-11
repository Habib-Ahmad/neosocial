import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageSquare, Bookmark, Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Post } from '@/interface/Post';
import {
	getPostById,
	createComment,
	toggleCommentLike,
	togglePostLike,
} from '@/api/posts';
import { resolveImageUrl } from '@/lib/utils';

import { IMG_BASE_URL } from '@/api';

const PostView: React.FC = () => {
	const { postId } = useParams();
	const { user } = useAuth();
	const { toast } = useToast();
	const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
	const [isLiked, setIsLiked] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [likesCount, setLikesCount] = useState(0);
	const [comment, setComment] = useState('');
	const [comments, setComments] = useState<any[]>([]);

	const { data: post, isPending } = useQuery<Post>({
		queryKey: [`post/${postId}`],
		queryFn: () => getPostById(postId),
	});

	useEffect(() => {
		if (post) {
			setLikesCount(post.likes_count);
			setIsLiked(post.liked_by_me);
			setComments(post.comments);
		}
	}, [post]);

	if (isPending) {
		return (
			<div className="flex items-center justify-center h-screen text-gray-500">
				Loading...
			</div>
		);
	}

	if (!post) {
		return (
			<div className="max-w-2xl mx-auto">
				<Card className="text-center p-8">
					<p className="text-gray-500">Post not found</p>
					<Link
						to="/home"
						className="text-purple-600 hover:text-purple-700 mt-4 inline-block"
					>
						Return to Home
					</Link>
				</Card>
			</div>
		);
	}

	const handleToggleCommentLike = async (commentId: string) => {
		// Optimistic update
		setComments((prev) =>
			prev.map((c) =>
				c.id === commentId
					? {
							...c,
							likes_count: c.liked_by_user ? c.likes_count - 1 : c.likes_count + 1,
							liked_by_user: !c.liked_by_user,
					  }
					: c
			)
		);
		
		try {
			const updated = await toggleCommentLike(commentId);
			// Update with actual server response
			setComments((prev) =>
				prev.map((c) =>
					c.id === updated.id
						? {
								...c,
								likes_count: updated.likes_count,
								liked_by_user: updated.liked_by_user,
						  }
						: c
				)
			);
		} catch {
			// Revert on error
			setComments((prev) =>
				prev.map((c) =>
					c.id === commentId
						? {
								...c,
								likes_count: c.liked_by_user ? c.likes_count - 1 : c.likes_count + 1,
								liked_by_user: !c.liked_by_user,
						  }
						: c
				)
			);
			toast({
				title: 'Error',
				description: 'Failed to toggle like.',
				variant: 'destructive',
			});
		}
	};

	const handleLike = async () => {
		// Optimistic update
		const previousLiked = isLiked;
		const previousCount = likesCount;
		
		setIsLiked(!isLiked);
		setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
		
		try {
			const updatedPost = await togglePostLike(post.id);
			// Update with actual server response
			setIsLiked(updatedPost.liked_by_me);
			setLikesCount(updatedPost.likes_count);
		} catch {
			// Revert on error
			setIsLiked(previousLiked);
			setLikesCount(previousCount);
			toast({
				title: 'Error',
				description: 'Failed to toggle like.',
				variant: 'destructive',
			});
		}
	};

	const handleSave = () => {
		setIsSaved(!isSaved);
		toast({
			title: isSaved ? 'Post unsaved' : 'Post saved',
			description: isSaved
				? 'Removed from saved posts'
				: 'Added to saved posts',
		});
	};

	const handleComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!comment.trim() || !postId) return;
		try {
			const newComment = await createComment(postId, comment);
			setComments((prev) => [newComment, ...prev]);
			setComment('');
			toast({
				title: 'Comment added',
				description: 'Your comment has been posted.',
			});
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to post comment.',
				variant: 'destructive',
			});
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInHours = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60 * 60)
		);
		if (diffInHours < 1) return 'Just now';
		if (diffInHours < 24) return `${diffInHours}h ago`;
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays}d ago`;
		return date.toLocaleDateString();
	};

	return (
		<>
			<div className="max-w-2xl mx-auto space-y-6">
				<Link
					to="/home"
					className="flex items-center text-purple-600 hover:text-purple-700 transition-colors"
				>
					<ArrowLeft size={20} className="mr-2" /> Back to Home
				</Link>

				<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
					<CardHeader className="pb-3">
						<div className="flex items-center space-x-3">
							<img
								src={resolveImageUrl(post.author.profile_picture)}
								alt={post.author.name}
								className="w-12 h-12 rounded-full border-2 border-purple-200"
							/>
							<div>
								<Link
									to={`/profile/${post.author.id}`}
									className="font-medium text-gray-900 hover:text-purple-600"
								>
									{post.author.name}
								</Link>
								<p className="text-sm text-gray-500 flex items-center space-x-2">
									<span>{formatDate(post.created_at)}</span>
									{post.category && (
										<>
											<span>•</span>
											<span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
												{post.category}
											</span>
										</>
									)}
								</p>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-4">
						<p className="text-gray-800 leading-relaxed text-lg">
							{post.content}
						</p>
						{post.media_urls?.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-2">
								{post.media_urls.map((url, index) => (
									<img
										key={index}
										src={resolveImageUrl(url)}
										alt={`Post media ${index + 1}`}
										onClick={() => setActiveImageIndex(index)}
										className="cursor-pointer w-40 h-40 object-cover rounded-lg border border-purple-100 hover:opacity-80 transition"
									/>
								))}
							</div>
						)}
						<div className="flex items-center justify-between pt-4 border-t border-purple-100">
							<div className="flex items-center space-x-4">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleLike}
									className="flex items-center space-x-2 transition-colors"
								>
									<Heart
										size={20}
										className={`transition-all ${
											isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'
										}`}
									/>
									<span className={isLiked ? 'text-red-500' : 'text-gray-500'}>
										{likesCount}
									</span>
								</Button>
								<div className="flex items-center space-x-2 text-gray-500 px-3 py-2">
									<MessageSquare size={20} />
									<span>{comments.length}</span>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleSave}
								className={`transition-colors ${
									isSaved
										? 'text-purple-500 hover:text-purple-600'
										: 'text-gray-500 hover:text-purple-500'
								}`}
							>
								<Bookmark size={20} className={isSaved ? 'fill-current' : ''} />
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
					<CardContent className="p-4">
						<form onSubmit={handleComment} className="space-y-4">
							<div className="flex space-x-3">
								{user?.profile_picture && (
									<img
										src={resolveImageUrl(user.profile_picture)}
										alt={user.first_name}
										className="w-10 h-10 rounded-full border-2 border-purple-200"
									/>
								)}
								<div className="flex-1">
									<Textarea
										value={comment}
										onChange={(e) => setComment(e.target.value)}
										placeholder="Write a comment..."
										className="min-h-[80px] resize-none border-purple-100 focus:border-purple-300"
									/>
								</div>
							</div>
							<div className="flex justify-end">
								<Button
									type="submit"
									disabled={!comment.trim()}
									className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
								>
									<Send size={16} className="mr-2" /> Comment
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-gray-900">
						Comments ({comments.length})
					</h3>
					{comments.map((comment) => (
						<Card
							key={comment.id}
							className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg"
						>
							<CardContent className="p-4">
								<div className="flex space-x-3">
									<img
										src={resolveImageUrl(comment.author.profile_picture)}
										className="w-10 h-10 rounded-full border-2 border-purple-200"
									/>
									<div className="flex-1">
										<div className="flex items-center space-x-2 mb-1">
											<span className="font-medium text-gray-900">
												{comment.author.name}
											</span>
											<span className="text-sm text-gray-500">
												{formatDate(comment.created_at)}
											</span>
										</div>
										<div className="flex justify-between items-start">
											<p className="text-gray-800">{comment.content}</p>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleToggleCommentLike(comment.id)}
												className={`transition-colors p-0 h-auto ${
													comment.liked_by_user
														? 'text-red-500'
														: 'text-gray-500 hover:text-red-500'
												}`}
											>
												<Heart
													size={16}
													className={`mr-1 ${
														comment.liked_by_user ? 'fill-current' : ''
													}`}
												/>
												<span>{comment.likes_count}</span>
											</Button>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Fullscreen Image Viewer */}
			{activeImageIndex !== null && (
				<div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
					<button
						className="absolute top-4 right-4 text-white text-3xl"
						onClick={() => setActiveImageIndex(null)}
					>
						×
					</button>
					{activeImageIndex > 0 && (
						<button
							className="absolute left-4 text-white text-4xl"
							onClick={() => setActiveImageIndex((prev) => (prev ?? 0) - 1)}
						>
							‹
						</button>
					)}
					<img
						src={resolveImageUrl(post.media_urls[activeImageIndex])}
						alt={`Full view ${activeImageIndex + 1}`}
						className="max-w-[90%] max-h-[80%] object-contain rounded shadow-lg"
					/>
					{activeImageIndex < post.media_urls.length - 1 && (
						<button
							className="absolute right-4 text-white text-4xl"
							onClick={() => setActiveImageIndex((prev) => (prev ?? 0) + 1)}
						>
							›
						</button>
					)}
				</div>
			)}
		</>
	);
};

export default PostView;
