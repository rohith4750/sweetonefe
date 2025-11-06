import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { returnsApi } from '@/api/returns.api';
import { finishedGoodsApi } from '@/api/finished-goods.api';
import { Table, Loading, Button, Modal, Input, Select, toast, ConfirmationModal } from '@/components/common';
import { TableColumn } from '@/components/common/Table/Table';
import { Return, CreateReturnRequest } from '@/types/return.types';
import { formatDateTime, formatNumber, getErrorMessage, getSuccessMessage } from '@/utils/formatters';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import './ReturnsList.css';

export const ReturnsList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<Return | null>(null);
  const invalidate = useInvalidateQueries();

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: () => returnsApi.getAll(),
  });

  const { data: finishedGoods } = useQuery({
    queryKey: ['finished-goods'],
    queryFn: () => finishedGoodsApi.getAll(),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getAll({ status: 'active' }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReturnRequest) => returnsApi.create(data),
    onSuccess: (response) => {
      invalidate('returns');
      setIsModalOpen(false);
      reset();
      toast.success(getSuccessMessage(response, 'Return record created successfully'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || getErrorMessage(error, 'Failed to create return record');
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => returnsApi.delete(id),
    onSuccess: (response) => {
      invalidate('returns');
      toast.success(getSuccessMessage(response, 'Return record deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete return record'));
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateReturnRequest>({
    defaultValues: {
      sweet_id: 0,
      branch_id: 1,
      quantity: 0,
      reason: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const columns: TableColumn<Return>[] = [
    {
      key: 'FinishedGoods',
      header: 'Product',
      render: (value) => value?.name || '-',
    },
    {
      key: 'Branches',
      header: 'Branch',
      render: (value) => value?.name || '-',
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (value) => formatNumber(value),
    },
    {
      key: 'reason',
      header: 'Reason',
    },
    {
      key: 'date',
      header: 'Date',
      render: (value) => formatDateTime(value),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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

  const handleDelete = (returnRecord: Return) => {
    setReturnToDelete(returnRecord);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (returnToDelete) {
      deleteMutation.mutate(returnToDelete.return_id);
      setIsDeleteModalOpen(false);
      setReturnToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setReturnToDelete(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = (data: CreateReturnRequest) => {
    createMutation.mutate(data);
  };

  const finishedGoodOptions = finishedGoods?.map(g => ({
    value: g.sweet_id,
    label: g.name,
  })) || [];

  const branchOptions = branches
    ?.filter(branch => branch.status === 'active' || !branch.status)
    ?.map(branch => ({
      value: branch.branch_id,
      label: branch.name,
    })) || [];

  if (isLoading) return <Loading />;

  return (
    <div className="returns-list">
      <div className="returns-list-header">
        <h1>Returns</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Return</Button>
      </div>
      <Table columns={columns} data={returns || []} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Add Return"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              isLoading={createMutation.isPending}
            >
              Create
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Select
            label="Finished Good"
            options={finishedGoodOptions}
            {...register('sweet_id', { 
              required: 'Finished good is required',
              valueAsNumber: true 
            })}
            error={errors.sweet_id?.message}
            fullWidth
          />
          <Select
            label="Branch"
            options={branchOptions}
            {...register('branch_id', { 
              required: 'Branch is required',
              valueAsNumber: true 
            })}
            error={errors.branch_id?.message}
            fullWidth
          />
          <Input
            label="Quantity"
            type="number"
            step="0.01"
            {...register('quantity', { 
              required: 'Quantity is required',
              valueAsNumber: true,
              min: { value: 0.01, message: 'Quantity must be greater than 0' }
            })}
            error={errors.quantity?.message}
            fullWidth
          />
          <Input
            label="Reason"
            {...register('reason', { required: 'Reason is required' })}
            error={errors.reason?.message}
            fullWidth
          />
          <Input
            label="Date"
            type="date"
            {...register('date', { required: 'Date is required' })}
            error={errors.date?.message}
            fullWidth
          />
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Return Record"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        infoItems={returnToDelete ? [
          {
            label: 'Product',
            value: returnToDelete.FinishedGoods?.name || 'N/A',
          },
          {
            label: 'Quantity',
            value: formatNumber(returnToDelete.quantity),
          },
          {
            label: 'Reason',
            value: returnToDelete.reason || 'N/A',
          },
          {
            label: 'Date',
            value: formatDateTime(returnToDelete.date),
          },
        ] : []}
        warning="⚠️ This action cannot be undone. The return record will be permanently deleted."
      />
    </div>
  );
};
