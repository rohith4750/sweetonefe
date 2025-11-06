import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { branchesApi } from '@/api/branches.api';
import { Table, Loading, SearchBar, StatusBadge, Button, Modal, Input, Select, toast, ConfirmationModal } from '@/components/common';
import { TableColumn } from '@/components/common/Table/Table';
import { Branch, CreateBranchRequest, UpdateBranchRequest } from '@/types/branch.types';
import { useAuthStore } from '@/store/authStore';
import { ROLES } from '@/utils/constants';
import { getErrorMessage, getSuccessMessage } from '@/utils/formatters';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import './BranchList.css';

export const BranchList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const invalidate = useInvalidateQueries();
  const { user } = useAuthStore();

  const { data: branches, isLoading, error } = useQuery({
    queryKey: ['branches', statusFilter],
    queryFn: () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      return branchesApi.getAll(params);
    },
    retry: 1,
  });

  // Handle error with useEffect
  useEffect(() => {
    if (error) {
      const errorMessage = (error as any)?.response?.data?.error || 
                          (error as any)?.response?.data?.message || 
                          error?.message || 
                          'Failed to load branches';
      toast.error(errorMessage);
    }
  }, [error]);

  const createMutation = useMutation({
    mutationFn: (data: CreateBranchRequest) => branchesApi.create(data),
    onSuccess: (response) => {
      invalidate('branches');
      setIsModalOpen(false);
      reset();
      toast.success(getSuccessMessage(response, 'Branch created successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create branch'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBranchRequest }) =>
      branchesApi.update(id, data),
    onSuccess: (response) => {
      invalidate('branches');
      setIsModalOpen(false);
      setSelectedBranch(null);
      reset();
      toast.success(getSuccessMessage(response, 'Branch updated successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update branch'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => branchesApi.delete(id),
    onSuccess: (response) => {
      invalidate('branches');
      toast.success(getSuccessMessage(response, 'Branch deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete branch'));
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateBranchRequest & { status?: string }>({
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      status: 'active',
    },
  });

  const filteredBranches = Array.isArray(branches)
    ? branches.filter(
        (branch: Branch) =>
          branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const canManage = user?.role === ROLES.SUPER_ADMIN;

  const columns: TableColumn<Branch>[] = [
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'address',
      header: 'Address',
      render: (value) => value || '-',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (value) => value || '-',
    },
    {
      key: 'email',
      header: 'Email',
      render: (value) => value || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value || 'active'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canManage && (
            <>
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
            </>
          )}
        </div>
      ),
    },
  ];

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    reset({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      status: branch.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (branch: Branch) => {
    setBranchToDelete(branch);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (branchToDelete) {
      deleteMutation.mutate(branchToDelete.branch_id);
      setIsDeleteModalOpen(false);
      setBranchToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBranchToDelete(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedBranch(null);
    reset();
  };

  const onSubmit = (data: CreateBranchRequest & { status?: string }) => {
    if (selectedBranch) {
      // Explicitly include email field in update request to ensure it's sent
      const updateData: UpdateBranchRequest = {
        ...data,
        email: data.email, // Explicitly include email field
        status: data.status as 'active' | 'inactive' | undefined,
      };
      updateMutation.mutate({ id: selectedBranch.branch_id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className="branch-list">
        <div className="branch-list-header">
          <h1>Branches</h1>
        </div>
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          background: 'var(--white)', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <p style={{ color: 'var(--error-red)', marginBottom: '1rem' }}>
            Failed to load branches
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error instanceof Error ? error.message : 'An error occurred while fetching branches'}
          </p>
          <Button onClick={() => invalidate('branches')}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="branch-list">
      <div className="branch-list-header">
        <h1>Branches</h1>
        {canManage && (
          <Button onClick={() => setIsModalOpen(true)}>Add Branch</Button>
        )}
      </div>

      <div className="branch-list-filters">
        <SearchBar onSearch={setSearchTerm} placeholder="Search branches..." />
        {canManage && (
          <Select
            label="Status Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            options={[
              { value: 'all', label: 'All Branches' },
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Inactive Only' },
            ]}
            style={{ minWidth: '150px' }}
          />
        )}
      </div>

      <Table columns={columns} data={filteredBranches} />

      {canManage && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleClose}
          title={selectedBranch ? 'Edit Branch' : 'Add Branch'}
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
                {selectedBranch ? 'Update' : 'Create'}
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
              label="Address"
              {...register('address')}
              error={errors.address?.message}
              fullWidth
            />
            <Input
              label="Phone"
              {...register('phone')}
              error={errors.phone?.message}
              fullWidth
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              fullWidth
            />
            <Select
              label="Status"
              options={statusOptions}
              {...register('status', { required: 'Status is required' })}
              error={errors.status?.message}
              fullWidth
            />
          </form>
        </Modal>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Branch"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        infoItems={branchToDelete ? [
          {
            label: 'Branch Name',
            value: branchToDelete.name,
          },
          {
            label: 'Address',
            value: branchToDelete.address || 'N/A',
          },
          {
            label: 'Phone',
            value: branchToDelete.phone || 'N/A',
          },
          {
            label: 'Email',
            value: branchToDelete.email || 'N/A',
          },
          {
            label: 'Status',
            value: branchToDelete.status || 'active',
          },
        ] : []}
        warning="⚠️ This action cannot be undone. The branch will be permanently deleted."
      />
    </div>
  );
};

