import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/api/users.api';
import { Button, Input, PhoneInput, Loading, toast } from '@/components/common';
import { getErrorMessage, getSuccessMessage, formatDate, getInitials } from '@/utils/formatters';
import './Profile.css';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [user, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => {
      if (!user) throw new Error('User not found');
      return usersApi.update(user.user_id, data);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success(getSuccessMessage(updatedUser, 'Profile updated successfully'));
      reset({
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update profile'));
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="profile">
        <div className="profile-error">
          <p>User not found. Please log in again.</p>
        </div>
      </div>
    );
  }

  const getRoleDisplayName = (role: string | undefined) => {
    if (!role) return 'N/A';
    return role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusDisplay = (status: string | undefined) => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="profile">
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">Manage your account information</p>
      </div>

      <div className="profile-content">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {user.name ? getInitials(user.name) : 'U'}
          </div>
          <div className="profile-avatar-info">
            <h2 className="profile-name">{user.name || 'User'}</h2>
            <p className="profile-role">{getRoleDisplayName(user.role)}</p>
            {user.Branches && (
              <p className="profile-branch">Branch: {user.Branches.name}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
          <div className="profile-form-section">
            <h3 className="profile-form-section-title">Personal Information</h3>
            
            <div className="profile-form-grid">
              <Input
                label="Full Name"
                type="text"
                {...register('name')}
                error={errors.name?.message}
                required
                fullWidth
              />

              <Input
                label="Email Address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                required
                fullWidth
              />

              <PhoneInput
                label="Phone Number"
                {...register('phone')}
                error={errors.phone?.message}
                fullWidth
              />
            </div>
          </div>

          <div className="profile-form-section">
            <h3 className="profile-form-section-title">Account Information</h3>
            
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">User ID</span>
                <span className="profile-info-value">#{user.user_id}</span>
              </div>
              
              <div className="profile-info-item">
                <span className="profile-info-label">Role</span>
                <span className="profile-info-value">{getRoleDisplayName(user.role)}</span>
              </div>
              
              <div className="profile-info-item">
                <span className="profile-info-label">Status</span>
                <span className={`profile-info-value ${user.status ? `profile-status-${user.status}` : ''}`}>
                  {getStatusDisplay(user.status)}
                </span>
              </div>
              
              <div className="profile-info-item">
                <span className="profile-info-label">Member Since</span>
                <span className="profile-info-value">
                  {user.created_at ? formatDate(user.created_at, 'dd MMM yyyy') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-form-actions">
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
              disabled={updateMutation.isPending}
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset({
                name: user.name,
                email: user.email,
                phone: user.phone || '',
              })}
              disabled={updateMutation.isPending}
            >
              Reset
            </Button>
          </div>
        </form>
      </div>

      {updateMutation.isPending && <Loading />}
    </div>
  );
};

