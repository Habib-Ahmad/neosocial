import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { useToast } from '@/hooks/use-toast';
import { registerUser } from '@/api/auth';
import {
	validatePassword,
	getPasswordStrength,
	PASSWORD_RULES,
} from '@/lib/validators';
import { Check, X } from 'lucide-react';

const Register: React.FC = () => {
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const [profilePicture, setProfilePicture] = useState<File | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});

	const { login } = useAuth();
	const navigate = useNavigate();
	const { toast } = useToast();

	const validateForm = () => {
		const newErrors: { [key: string]: string } = {};

		if (!formData.firstName.trim())
			newErrors.firstName = 'First name is required';
		if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
		if (!formData.email) {
			newErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Email is invalid';
		}

		// Use TDD password validator
		const passwordValidation = validatePassword(formData.password);
		if (!passwordValidation.isValid) {
			newErrors.password = passwordValidation.errors[0];
		}

		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Password strength calculation
	const passwordStrength = useMemo(
		() => getPasswordStrength(formData.password),
		[formData.password]
	);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;
		setIsLoading(true);

		try {
			const form = new FormData();
			form.append('first_name', formData.firstName);
			form.append('last_name', formData.lastName);
			form.append('email', formData.email);
			form.append('password', formData.password);

			if (profilePicture) {
				form.append('profile_picture', profilePicture);
			}

			const response = await registerUser(form); // <-- FormData here

			const success = login(
				response.user,
				response.token,
				response.tokenExpiry
			);

			if (success) {
				toast({
					title: 'Welcome to NeoSocial!',
					description: 'Your account has been created successfully.',
				});
				navigate('/home');
			}
		} catch (error) {
			toast({
				title: 'Registration failed',
				description: 'Please try again.',
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
						NeoSocial
					</CardTitle>
					<CardDescription>
						Join the community and connect with others
					</CardDescription>
				</CardHeader>

				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name</Label>
								<Input
									id="firstName"
									name="firstName"
									value={formData.firstName}
									onChange={handleInputChange}
									className={errors.firstName ? 'border-red-500' : ''}
									placeholder="John"
								/>
								{errors.firstName && (
									<p className="text-sm text-red-500">{errors.firstName}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name</Label>
								<Input
									id="lastName"
									name="lastName"
									value={formData.lastName}
									onChange={handleInputChange}
									className={errors.lastName ? 'border-red-500' : ''}
									placeholder="Doe"
								/>
								{errors.lastName && (
									<p className="text-sm text-red-500">{errors.lastName}</p>
								)}
							</div>
						</div>

						{/* Profile Picture Upload */}
						<div className="space-y-2">
							<Label htmlFor="profilePicture">Profile Picture</Label>
							<Input
								id="profilePicture"
								name="profilePicture"
								type="file"
								accept="image/*"
								onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								value={formData.email}
								onChange={handleInputChange}
								className={errors.email ? 'border-red-500' : ''}
								placeholder="john@example.com"
							/>
							{errors.email && (
								<p className="text-sm text-red-500">{errors.email}</p>
							)}
						</div>

						<div className="space-y-2 relative">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								value={formData.password}
								onChange={handleInputChange}
								className={errors.password ? 'border-red-500' : ''}
								placeholder="Enter your password"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-9 text-sm text-gray-500 hover:text-gray-700"
								tabIndex={-1}
							>
								{showPassword ? 'Hide' : 'Show'}
							</button>
							{errors.password && (
								<p className="text-sm text-red-500">{errors.password}</p>
							)}

							{/* Password Strength Indicator */}
							{formData.password && (
								<div className="mt-2 space-y-2">
									<div className="flex items-center gap-2">
										<div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
											<div
												className={`h-full transition-all duration-300 ${
													passwordStrength.color === 'red'
														? 'bg-red-500'
														: passwordStrength.color === 'orange'
														? 'bg-orange-500'
														: passwordStrength.color === 'yellow'
														? 'bg-yellow-500'
														: 'bg-green-500'
												}`}
												style={{ width: `${passwordStrength.score}%` }}
											/>
										</div>
										<span
											className={`text-xs font-medium ${
												passwordStrength.color === 'red'
													? 'text-red-500'
													: passwordStrength.color === 'orange'
													? 'text-orange-500'
													: passwordStrength.color === 'yellow'
													? 'text-yellow-500'
													: 'text-green-500'
											}`}
										>
											{passwordStrength.label}
										</span>
									</div>
									<div className="grid grid-cols-2 gap-1">
										{PASSWORD_RULES.map((rule) => (
											<div
												key={rule.id}
												className="flex items-center gap-1 text-xs"
											>
												{rule.test(formData.password) ? (
													<Check className="w-3 h-3 text-green-500" />
												) : (
													<X className="w-3 h-3 text-gray-400" />
												)}
												<span
													className={
														rule.test(formData.password)
															? 'text-green-600'
															: 'text-gray-500'
													}
												>
													{rule.message}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						<div className="space-y-2 relative">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type={showPassword ? 'text' : 'password'}
								value={formData.confirmPassword}
								onChange={handleInputChange}
								className={errors.confirmPassword ? 'border-red-500' : ''}
								placeholder="Confirm your password"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-9 text-sm text-gray-500 hover:text-gray-700"
								tabIndex={-1}
							>
								{showPassword ? 'Hide' : 'Show'}
							</button>
							{errors.confirmPassword && (
								<p className="text-sm text-red-500">{errors.confirmPassword}</p>
							)}
						</div>
					</CardContent>

					<CardFooter className="flex flex-col space-y-4">
						<Button
							type="submit"
							className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
							disabled={isLoading}
						>
							{isLoading ? 'Creating account...' : 'Create Account'}
						</Button>

						<p className="text-sm text-center text-gray-600">
							Already have an account?{' '}
							<Link
								to="/login"
								className="text-purple-600 hover:text-purple-700 font-medium"
							>
								Sign in
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
};

export default Register;
