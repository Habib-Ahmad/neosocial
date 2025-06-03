import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@/api/auth";
import { User } from "@/interface/User";

const EditProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<User>>({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    profile_picture: user?.profile_picture || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: () => updateUser(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"], exact: true });
    },
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await mutateAsync();

      updateProfile(response);

      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      });

      navigate("/profile");
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive",
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
            Edit Profile
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <img
                src={
                  formData.profile_picture ||
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                }
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-purple-200"
              />
              <div>
                <Label htmlFor="avatar">Profile Picture URL</Label>
                <Input
                  id="avatar"
                  name="avatar"
                  value={formData.profile_picture}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`${errors.first_name ? "border-red-500" : ""}`}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`${errors.last_name ? "border-red-500" : ""}`}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500">{errors.last_name}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`${errors.email ? "border-red-500" : ""}`}
                disabled
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                className="min-h-[100px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profile")}
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

export default EditProfile;
