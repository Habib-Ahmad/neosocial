import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Image, Send, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, createGroupPost } from '@/api/posts';
import { IMG_BASE_URL } from '@/api';
import { resolveImageUrl } from '@/lib/utils';
import { checkProfanity } from '@/lib/validators';

interface CreatePostProps {
	groupId?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ groupId }) => {
	const [content, setContent] = useState('');
	const [category, setCategory] = useState('');
	const [isPosting, setIsPosting] = useState(false);
	const [profanityWarning, setProfanityWarning] = useState<string | null>(null);
	const [previewFiles, setPreviewFiles] = useState<
		{ file: File; url: string }[]
	>([]);

	const { user } = useAuth();
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const { mutateAsync } = useMutation({
		mutationFn: async (formData: FormData) => {
			if (groupId) {
				return await createGroupPost(groupId, formData);
			}
			return await createPost(formData);
		},
		onMutate: async (formData) => {
			// Cancel any outgoing queries to ensure optimistic update works
			await queryClient.cancelQueries({ queryKey: ['posts/latest'] });
			await queryClient.cancelQueries({ queryKey: ['posts/discover'] });

			// Create optimistic post object with correct structure
			const optimisticPost = {
				id: Math.random().toString(36).substr(2, 9),
				content: formData.get('content') as string,
				category: formData.get('category') as string,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				is_deleted: false,
				likes_count: 0,
				comments_count: 0,
				reposts_count: 0,
				location: '',
				liked_by_me: false,
				group_name: '',
				media_urls: [],
				author: {
					id: user?.id || '',
					name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
					email: user?.email || '',
					profile_picture: user?.profile_picture || null,
				},
			} as any;

			// Update both feeds with optimistic post
			const previousLatest = queryClient.getQueryData(['posts/latest']);
			queryClient.setQueryData(['posts/latest'], (old: any[] | undefined) => {
				return old ? [optimisticPost, ...old] : [optimisticPost];
			});

			return { previousLatest };
		},
		onSuccess: () => {
			// Refetch to ensure we have the real post with correct ID and timestamps
			queryClient.invalidateQueries({ queryKey: ['posts/latest'] });
			queryClient.invalidateQueries({ queryKey: ['posts/discover'] });
			toast({
				title: 'Post created!',
				description: 'Your post has been shared successfully.',
			});
			setContent('');
			setCategory('');
			setPreviewFiles([]);
			setIsPosting(false);
		},
		onError: (error: any, variables, context) => {
			// Revert to previous state on error
			if (context?.previousLatest) {
				queryClient.setQueryData(['posts/latest'], context.previousLatest);
			}
			// Display backend validation errors if available
			const errorMessage = error?.response?.data?.errors?.[0] 
				|| error?.response?.data?.message 
				|| 'Failed to create post. Please try again.';
			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			});
			setIsPosting(false);
		},
	});

	useEffect(() => {
		return () => {
			previewFiles.forEach((p) => URL.revokeObjectURL(p.url));
		};
	}, [previewFiles]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;

		const selected = Array.from(e.target.files);
		const newPreviewFiles = selected.map((file) => ({
			file,
			url: URL.createObjectURL(file),
		}));

		setPreviewFiles((prev) => [...prev, ...newPreviewFiles]);
	};

	const handleRemovePreview = (index: number) => {
		setPreviewFiles((prev) => {
			URL.revokeObjectURL(prev[index].url);
			return prev.filter((_, i) => i !== index);
		});
	};

	// Check for profanity when content changes
	const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newContent = e.target.value;
		setContent(newContent);

		const profanityCheck = checkProfanity(newContent);
		setProfanityWarning(
			profanityCheck.isValid ? null : profanityCheck.errors[0]
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!content.trim() || !category.trim()) {
			toast({
				title: 'Missing Fields',
				description: 'Content and category are required.',
				variant: 'destructive',
			});
			return;
		}

		// Check for profanity before submitting
		const profanityCheck = checkProfanity(content);
		if (!profanityCheck.isValid) {
			toast({
				title: 'Content Not Allowed',
				description: profanityCheck.errors[0],
				variant: 'destructive',
			});
			return;
		}

		setIsPosting(true);

		const formData = new FormData();
		formData.append('content', content);
		formData.append('category', category);
		previewFiles.forEach((item) => formData.append('media', item.file));

		await mutateAsync(formData);
	};

	return (
		<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
			<CardHeader className="pb-3">
				<div className="flex items-center space-x-3">
					{user?.profile_picture && (
						<img
							src={resolveImageUrl(user.profile_picture)}
							alt={user.first_name}
							className="w-10 h-10 rounded-full border-2 border-purple-200"
						/>
					)}
					<div>
						<p className="font-medium text-gray-900">
							{user?.first_name} {user?.last_name}
						</p>
						<p className="text-sm text-gray-500">Share what's on your mind</p>
					</div>
				</div>
			</CardHeader>

			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					<Textarea
						value={content}
						onChange={handleContentChange}
						placeholder="What's happening?"
						className={`min-h-[100px] resize-none border-purple-100 focus:border-purple-300 ${
							profanityWarning ? 'border-red-500' : ''
						}`}
					/>
					{profanityWarning && (
						<div className="flex items-center gap-2 text-red-500 text-sm">
							<AlertTriangle className="w-4 h-4" />
							<span>{profanityWarning}</span>
						</div>
					)}

					{/* Image Previews */}
					{previewFiles.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-2">
							{previewFiles.map((item, idx) => (
								<div
									key={idx}
									className="relative w-24 h-24 rounded border border-purple-200 overflow-hidden"
								>
									<img
										src={resolveImageUrl(item.url)}
										alt={`preview-${idx}`}
										className="w-full h-full object-cover"
									/>
									<button
										type="button"
										onClick={() => handleRemovePreview(idx)}
										className="absolute top-1 right-1 bg-white bg-opacity-80 text-gray-800 rounded-full p-1 hover:bg-opacity-100"
										title="Remove image"
									>
										<X size={14} />
									</button>
								</div>
							))}
						</div>
					)}

					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<label
								htmlFor="file-upload"
								className="cursor-pointer text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex items-center space-x-1"
							>
								<Image size={18} className="mr-2" />
								<span>Photo</span>
								<input
									type="file"
									id="file-upload"
									multiple
									accept="image/*"
									className="hidden"
									onChange={handleFileChange}
								/>
							</label>

							<Select value={category} onValueChange={setCategory}>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="technology">Technology</SelectItem>
									<SelectItem value="lifestyle">Lifestyle</SelectItem>
									<SelectItem value="travel">Travel</SelectItem>
									<SelectItem value="food">Food</SelectItem>
									<SelectItem value="sports">Sports</SelectItem>
									<SelectItem value="music">Music</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Button
							type="submit"
							disabled={isPosting || !content.trim()}
							className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
						>
							{isPosting ? (
								'Posting...'
							) : (
								<>
									<Send size={16} className="mr-2" />
									Post
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</form>
		</Card>
	);
};

export default CreatePost;
