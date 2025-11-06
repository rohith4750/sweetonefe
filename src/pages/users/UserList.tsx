import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { usersApi } from '@/api/users.api';
import { branchesApi } from '@/api/branches.api';
import { Button, Table, Modal, Input, Select, StatusBadge, Loading, SearchBar, PhoneInput, toast, ConfirmationModal } from '@/components/common';
import { TableColumn } from '@/components/common/Table/Table';
import { CreateUserRequest, UpdateUserRequest } from '@/types/user.types';
import { User } from '@/types/auth.types';
import { getErrorMessage, getSuccessMessage } from '@/utils/formatters';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import './UserList.css';

export const UserList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const invalidate = useInvalidateQueries();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.create(data),
    onSuccess: (response) => {
      invalidate('users');
      setIsModalOpen(false);
      reset();
      toast.success(getSuccessMessage(response, 'User created successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create user'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      usersApi.update(id, data),
    onSuccess: (response) => {
      invalidate('users');
      setIsModalOpen(false);
      setSelectedUser(null);
      reset();
      toast.success(getSuccessMessage(response, 'User updated successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update user'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: (response) => {
      invalidate('users');
      toast.success(getSuccessMessage(response, 'User deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete user'));
    },
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateUserRequest & { status?: 'active' | 'inactive' }>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user',
      branch_id: null,
      phone: '',
      status: 'active',
    },
  });

  const selectedRole = watch('role');

  const filteredUsers = users?.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (value) => {
        if (!value) return '-';
        // Format as +91 XXXXXXXXXX if it's a 10-digit number
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 10 && !value.startsWith('+')) {
          return `+91 ${cleaned}`;
        }
        return value;
      },
    },
    {
      key: 'role',
      header: 'Role',
      render: (value) => value.replace('_', ' '),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="user-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    // Clean phone number - remove +91 prefix and any non-digits
    const cleanedPhone = user.phone 
      ? user.phone.replace(/\D/g, '').replace(/^91/, '').slice(0, 10)
      : '';
    reset({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role as CreateUserRequest['role'],
      branch_id: user.branch_id,
      phone: cleanedPhone,
      status: user.status,
    } as CreateUserRequest & { status?: 'active' | 'inactive' });
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.user_id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    reset();
  };

  const onSubmit = (data: CreateUserRequest & { status?: 'active' | 'inactive' }) => {
    // Format phone number - convert to international format or null
    let formattedPhone: string | null = null;
    if (data.phone) {
      const cleaned = data.phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        formattedPhone = `+91${cleaned}`;
      } else if (cleaned.length > 0) {
        // If it already has country code, preserve it
        formattedPhone = data.phone.startsWith('+') ? data.phone : `+${data.phone}`;
      }
    }

    if (selectedUser) {
      const { password, ...updateData } = data;
      // Only include branch_id if role is branch_admin or user
      if (updateData.role !== 'branch_admin' && updateData.role !== 'user') {
        updateData.branch_id = null;
      }
      // Set phone - can be null to remove
      updateData.phone = formattedPhone;
      updateMutation.mutate({ id: selectedUser.user_id, data: updateData as UpdateUserRequest });
    } else {
      // Only include branch_id if role is branch_admin or user
      const submitData = { ...data, phone: formattedPhone };
      if (submitData.role !== 'branch_admin' && submitData.role !== 'user') {
        submitData.branch_id = null;
      }
      createMutation.mutate(submitData);
    }
  };

  const roleOptions = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'kitchen_admin', label: 'Kitchen Admin' },
    { value: 'transport_admin', label: 'Transport Admin' },
    { value: 'branch_admin', label: 'Branch Admin' },
    { value: 'user', label: 'User' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const branchOptions = branches
    ?.filter(branch => branch.status === 'active' || !branch.status)
    ?.map(branch => ({
      value: branch.branch_id,
      label: branch.name,
    })) || [];

  if (isLoading) return <Loading />;

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h1>Users</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add User</Button>
      </div>

      <div className="user-list-filters">
        <SearchBar onSearch={setSearchTerm} placeholder="Search users..." />
      </div>

      <Table columns={columns} data={filteredUsers} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={selectedUser ? 'Edit User' : 'Add User'}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
            fullWidth
          />
          <PhoneInput
            label="Phone (Optional)"
            {...register('phone', {
              validate: (value) => {
                if (!value || value.trim() === '') return true; // Optional field
                const cleaned = value.replace(/\D/g, '');
                if (cleaned.length === 10) {
                  // Valid 10-digit Indian number
                  return true;
                }
                if (cleaned.length > 0 && cleaned.length < 10) {
                  return 'Please enter a valid 10-digit phone number';
                }
                return true;
              },
            })}
            error={errors.phone?.message}
            fullWidth
            countryCode="+91"
          />
          <Input
            label={selectedUser ? 'Password (leave blank to keep current)' : 'Password'}
            type="password"
            {...register('password', { 
              required: selectedUser ? false : 'Password is required',
              minLength: selectedUser ? undefined : { value: 6, message: 'Password must be at least 6 characters' }
            })}
            error={errors.password?.message}
            fullWidth
          />
          <Select
            label="Role"
            options={roleOptions}
            {...register('role', { required: 'Role is required' })}
            error={errors.role?.message}
            fullWidth
          />
          {(selectedRole === 'branch_admin' || selectedRole === 'user') && (
            <Select
              label="Branch"
              options={branchOptions}
              {...register('branch_id', { 
                required: selectedRole === 'branch_admin' ? 'Branch is required for Branch Admin' : false,
                valueAsNumber: true,
                validate: (value) => {
                  if (selectedRole === 'branch_admin' && (!value || value === 0)) {
                    return 'Branch is required for Branch Admin';
                  }
                  return true;
                }
              })}
              error={errors.branch_id?.message}
              fullWidth
            />
          )}
          <Select
            label="Status"
            options={statusOptions}
            {...register('status', { required: 'Status is required' })}
            error={errors.status?.message}
            fullWidth
          />
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        infoItems={userToDelete ? [
          {
            label: 'Name',
            value: userToDelete.name,
          },
          {
            label: 'Email',
            value: userToDelete.email,
          },
          {
            label: 'Phone',
            value: userToDelete.phone 
              ? (() => {
                  const cleaned = userToDelete.phone.replace(/\D/g, '');
                  return cleaned.length === 10 ? `+91 ${cleaned}` : userToDelete.phone;
                })()
              : 'N/A',
          },
          {
            label: 'Role',
            value: userToDelete.role.replace('_', ' '),
          },
          {
            label: 'Status',
            value: userToDelete.status,
          },
        ] : []}
        warning="⚠️ This action cannot be undone. The user will be permanently deleted."
      />
    </div>
  );
};
