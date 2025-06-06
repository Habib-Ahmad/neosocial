import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { getGroupDetails } from '@/api/groups';
import { updateGroup } from '@/api/groups';

const EditGroup: React.FC = () => {
	const { groupId } = useParams<{ groupId: string }>();
	const navigate = useNavigate();
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		name: '',
		description: '',
		category: '',
		rules: '',
	});

	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [isLoading, setIsLoading] = useState(false);

	// Fetch the group details to pre-fill the form
	const fetchGroupDetails = async () => {
		const data = await getGroupDetails(groupId!);
		return data.group;
	};

	// Mutation to update group
	const { mutateAsync } = useMutation({
		mutationFn: (updatedData: typeof formData) =>
			updateGroup(groupId!, updatedData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['group', groupId] });
			toast({ title: 'Group updated!' });
			navigate(`/groups/${groupId}`);
		},
		onError: () => {
			toast({
				title: 'Update failed',
				description: 'Please try again.',
				variant: 'destructive',
			});
		},
	});

	useEffect(() => {
		const loadData = async () => {
			try {
				const group = await fetchGroupDetails();
				setFormData({
					name: group.name || '',
					description: group.description || '',
					category: group.category || '',
					rules: group.rules || '',
				});
			} catch (error) {
				toast({
					title: 'Failed to load group',
					variant: 'destructive',
				});
			}
		};

		if (groupId) loadData();
	}, [groupId]);

	// Form validation
	const validateForm = () => {
		const newErrors: { [key: string]: string } = {};
		if (!formData.name.trim()) newErrors.name = 'Group name is required';
		if (!formData.category) newErrors.category = 'Category is required';
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Handle form input change
	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		setIsLoading(true);
		try {
			await mutateAsync(formData);
		} catch {
			toast({
				title: 'Update failed',
				description: 'Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto">
			<Card className="backdrop-blur-sm bg-white/80 border-purple-100 shadow-lg">
				<CardHeader>
					<CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
						Edit Group
					</CardTitle>
				</CardHeader>

				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-6">
						{/* Name */}
						<div className="space-y-2">
							<Label htmlFor="name">Group Name</Label>
							<Input
								id="name"
								name="name"
								value={formData.name}
								onChange={handleChange}
								className={errors.name ? 'border-red-500' : ''}
							/>
							{errors.name && (
								<p className="text-sm text-red-500">{errors.name}</p>
							)}
						</div>

						{/* Category */}
						<div className="space-y-2">
							<Label htmlFor="category">Category</Label>
							<select
								id="category"
								name="category"
								value={formData.category}
								onChange={handleChange}
								className="w-full border rounded px-3 py-2"
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

						{/* Description */}
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleChange}
							/>
						</div>

						{/* Rules */}
						<div className="space-y-2">
							<Label htmlFor="rules">Rules</Label>
							<Textarea
								id="rules"
								name="rules"
								value={formData.rules}
								onChange={handleChange}
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex space-x-4 pt-4">
							<Button
								type="submit"
								disabled={isLoading}
								className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
							>
								{isLoading ? 'Updating...' : 'Update Group'}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate(-1)}
								className="flex-1"
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</form>
			</Card>
		</div>
	);
};

export default EditGroup;
