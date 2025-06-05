import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import PostView from './pages/PostView';
import Friends from './pages/Friends';
import Notifications from './pages/Notifications';
import Layout from './components/Layout';
import Groups from './pages/Groups';
import CreateGroup from './pages/CreateGroup';
import GroupView from './pages/GroupView';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const { user } = useAuth();
	return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
	const { user } = useAuth();
	return !user ? <>{children}</> : <Navigate to="/home" />;
};

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<AuthProvider>
				<BrowserRouter>
					<Routes>
						<Route path="/" element={<Navigate to="/home" />} />
						<Route
							path="/login"
							element={
								<PublicRoute>
									<Login />
								</PublicRoute>
							}
						/>
						<Route
							path="/register"
							element={
								<PublicRoute>
									<Register />
								</PublicRoute>
							}
						/>
						<Route
							path="/home"
							element={
								<ProtectedRoute>
									<Layout>
										<Home />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/profile/:userId?"
							element={
								<ProtectedRoute>
									<Layout>
										<Profile />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/edit-profile"
							element={
								<ProtectedRoute>
									<Layout>
										<EditProfile />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/post/:postId"
							element={
								<ProtectedRoute>
									<Layout>
										<PostView />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/groups/:groupId"
							element={
								<ProtectedRoute>
									<Layout>
										<GroupView />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/friends"
							element={
								<ProtectedRoute>
									<Layout>
										<Friends />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/notifications"
							element={
								<ProtectedRoute>
									<Layout>
										<Notifications />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/groups"
							element={
								<ProtectedRoute>
									<Layout>
										<Groups />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/groups"
							element={
								<ProtectedRoute>
									<Layout>
										<Groups />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/create-group"
							element={
								<ProtectedRoute>
									<Layout>
										<CreateGroup />
									</Layout>
								</ProtectedRoute>
							}
						/>
					</Routes>
				</BrowserRouter>
			</AuthProvider>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
