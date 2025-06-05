import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createGroup } from '@/api/groups';

const CreateGroup: React.FC = () => {
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		privacy: 'public',
		category: '',
		rules: '',
	});
	const [coverImage, setCoverImage] = useState<File | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});

	const { toast } = useToast();
	const navigate = useNavigate();

	const validateForm = () => {
		const newErrors: { [key: string]: string } = {};
		if (!formData.name.trim()) newErrors.name = 'Group name is required';
		if (!formData.description.trim())
			newErrors.description = 'Description is required';
		if (!formData.category.trim()) newErrors.category = 'Category is required';
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		setIsLoading(true);
		try {
			const form = new FormData();
			form.append('name', formData.name);
			form.append('description', formData.description);
			form.append('privacy', formData.privacy);
			form.append('category', formData.category);
			form.append('rules', formData.rules);
			if (coverImage) {
				form.append('cover_image', coverImage);
			}

			await createGroup(form);

			toast({
				title: 'Group Created!',
				description: 'Your group has been successfully created.',
			});
			navigate('/groups');
		} catch (error) {
			console.error(error);
			toast({
				title: 'Error',
				description: 'Something went wrong while creating the group.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md backdrop-blur-sm bg-white/90 border-purple-100 shadow-xl">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
						Create a Group
					</CardTitle>
					<CardDescription>
						Bring people together around shared interests
					</CardDescription>
				</CardHeader>

				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{/* Group Name */}
						<div className="space-y-2">
							<Label htmlFor="name">Group Name</Label>
							<Input
								id="name"
								name="name"
								placeholder="NeoSocial Book Club"
								value={formData.name}
								onChange={handleInputChange}
								className={errors.name ? 'border-red-500' : ''}
							/>
							{errors.name && (
								<p className="text-sm text-red-500">{errors.name}</p>
							)}
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								placeholder="Describe your group's purpose and goals"
								value={formData.description}
								onChange={handleInputChange}
								className={errors.description ? 'border-red-500' : ''}
							/>
							{errors.description && (
								<p className="text-sm text-red-500">{errors.description}</p>
							)}
						</div>

						{/* Privacy */}
						<div className="space-y-2">
							<Label htmlFor="privacy">Privacy</Label>
							<select
								id="privacy"
								name="privacy"
								value={formData.privacy}
								onChange={handleInputChange}
								className="w-full bg-white text-gray-800 border border-purple-200 rounded-md px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition duration-150"
							>
								<option value="public">Public</option>
								<option value="private">Private</option>
							</select>
						</div>

						{/* Category */}
						<div className="space-y-2">
							<Label htmlFor="category">Category</Label>
							<select
								id="category"
								name="category"
								value={formData.category}
								onChange={handleInputChange}
								className={`w-full bg-white text-gray-800 border ${
									errors.category ? 'border-red-500' : 'border-purple-200'
								} rounded-md px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition duration-150`}
							>
								<option value="">Select a category</option>
								<option value="Technology">Technology</option>
								<option value="Art">Art</option>
								<option value="Music">Music</option>
								<option value="Science">Science</option>
								<option value="Gaming">Gaming</option>
								<option value="Fitness">Fitness</option>
								<option value="Education">Education</option>
								<option value="Books">Books</option>
								<option value="Health">Health</option>
							</select>
							{errors.category && (
								<p className="text-sm text-red-500">{errors.category}</p>
							)}
						</div>

						{/* Rules */}
						<div className="space-y-2">
							<Label htmlFor="rules">Group Rules</Label>
							<Textarea
								id="rules"
								name="rules"
								placeholder="Outline any rules for group members"
								value={formData.rules}
								onChange={handleInputChange}
							/>
						</div>

						{/* Cover Image */}
						<div className="space-y-2">
							<Label htmlFor="coverImage">Cover Image</Label>
							<Input
								id="coverImage"
								name="coverImage"
								type="file"
								accept="image/*"
								onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
							/>
						</div>
					</CardContent>

					<CardFooter className="flex flex-col space-y-4">
						<Button
							type="submit"
							className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
							disabled={isLoading}
						>
							{isLoading ? 'Creating group...' : 'Create Group'}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
};

export default CreateGroup;
