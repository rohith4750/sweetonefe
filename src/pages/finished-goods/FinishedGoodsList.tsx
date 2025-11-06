import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { finishedGoodsApi } from '@/api/finished-goods.api';
import { Table, Loading, Button, StatusBadge, Modal, Input, toast, ConfirmationModal } from '@/components/common';
import { TableColumn } from '@/components/common/Table/Table';
import { FinishedGood, CreateFinishedGoodRequest } from '@/types/finished-goods.types';
import { formatCurrency, formatNumber, getErrorMessage, getSuccessMessage } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import { canManageFinishedGoods } from '@/utils/permissions';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import './FinishedGoodsList.css';

export const FinishedGoodsList: React.FC = () => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGood, setSelectedGood] = useState<FinishedGood | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goodToDelete, setGoodToDelete] = useState<FinishedGood | null>(null);
  const invalidate = useInvalidateQueries();
  
  const canManage = user?.role && canManageFinishedGoods(user.role);

  const { data: goods, isLoading } = useQuery({
    queryKey: ['finished-goods'],
    queryFn: () => finishedGoodsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFinishedGoodRequest) => finishedGoodsApi.create(data),
    onSuccess: (response) => {
      invalidate('finished-goods');
      setIsModalOpen(false);
      reset();
      toast.success(getSuccessMessage(response, 'Finished good created successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create finished good'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FinishedGood> }) =>
      finishedGoodsApi.update(id, data),
    onSuccess: (response) => {
      invalidate('finished-goods');
      setIsModalOpen(false);
      setSelectedGood(null);
      reset();
      toast.success(getSuccessMessage(response, 'Finished good updated successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update finished good'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => finishedGoodsApi.delete(id),
    onSuccess: (response) => {
      invalidate('finished-goods');
      toast.success(getSuccessMessage(response, 'Finished good deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete finished good'));
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFinishedGoodRequest>({
    defaultValues: {
      name: '',
      unit_price: 0,
      current_stock: 0,
      reorder_level: 0,
    },
  });

  const columns: TableColumn<FinishedGood>[] = [
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'unit_price',
      header: 'Unit Price',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'current_stock',
      header: 'Stock',
      render: (value, row) => (
        <div>
          {formatNumber(value)}
          {value <= row.reorder_level && (
            <StatusBadge status="Low Stock" variant="error" />
          )}
        </div>
      ),
    },
    {
      key: 'reorder_level',
      header: 'Reorder Level',
      render: (value) => formatNumber(value),
    },
    ...(canManage ? [{
      key: 'actions',
      header: 'Actions',
      render: (_: unknown, row: FinishedGood) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
    }] : []),
  ];

  const handleEdit = (good: FinishedGood) => {
    setSelectedGood(good);
    reset({
      name: good.name,
      unit_price: good.unit_price,
      current_stock: good.current_stock,
      reorder_level: good.reorder_level,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (good: FinishedGood) => {
    setGoodToDelete(good);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (goodToDelete) {
      deleteMutation.mutate(goodToDelete.sweet_id);
      setIsDeleteModalOpen(false);
      setGoodToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setGoodToDelete(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedGood(null);
    reset();
  };

  const onSubmit = (data: CreateFinishedGoodRequest) => {
    if (selectedGood) {
      updateMutation.mutate({ id: selectedGood.sweet_id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="finished-goods-list">
      <div className="finished-goods-list-header">
        <h1>Finished Goods</h1>
        {canManage && (
          <Button onClick={() => setIsModalOpen(true)}>Add Finished Good</Button>
        )}
      </div>
      <Table columns={columns} data={goods || []} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={selectedGood ? 'Edit Finished Good' : 'Add Finished Good'}
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
              {selectedGood ? 'Update' : 'Create'}
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
            label="Unit Price"
            type="number"
            step="0.01"
            {...register('unit_price', { 
              required: 'Unit price is required',
              valueAsNumber: true,
              min: { value: 0, message: 'Price must be positive' }
            })}
            error={errors.unit_price?.message}
            fullWidth
          />
          <Input
            label="Current Stock"
            type="number"
            step="0.01"
            {...register('current_stock', { 
              valueAsNumber: true,
              min: { value: 0, message: 'Stock must be positive' }
            })}
            error={errors.current_stock?.message}
            fullWidth
          />
          <Input
            label="Reorder Level"
            type="number"
            step="0.01"
            {...register('reorder_level', { 
              required: 'Reorder level is required',
              valueAsNumber: true,
              min: { value: 0, message: 'Reorder level must be positive' }
            })}
            error={errors.reorder_level?.message}
            fullWidth
          />
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Finished Good"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        infoItems={goodToDelete ? [
          {
            label: 'Name',
            value: goodToDelete.name,
          },
          {
            label: 'Unit Price',
            value: formatCurrency(goodToDelete.unit_price),
          },
          {
            label: 'Current Stock',
            value: formatNumber(goodToDelete.current_stock),
          },
          {
            label: 'Reorder Level',
            value: formatNumber(goodToDelete.reorder_level),
          },
        ] : []}
        warning="⚠️ This action cannot be undone. The finished good will be permanently deleted."
      />
    </div>
  );
};
