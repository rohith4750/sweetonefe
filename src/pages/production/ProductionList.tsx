import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { productionApi } from '@/api/production.api';
import { finishedGoodsApi } from '@/api/finished-goods.api';
import { Table, Loading, Button, Modal, Input, Select, toast, ConfirmationModal } from '@/components/common';
import { TableColumn } from '@/components/common/Table/Table';
import { Production, CreateProductionRequest } from '@/types/production.types';
import { formatDateTime, formatNumber, getErrorMessage, getSuccessMessage } from '@/utils/formatters';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import './ProductionList.css';

export const ProductionList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productionToDelete, setProductionToDelete] = useState<Production | null>(null);
  const invalidate = useInvalidateQueries();

  const { data: productions, isLoading } = useQuery({
    queryKey: ['production'],
    queryFn: () => productionApi.getAll(),
  });

  const { data: finishedGoods } = useQuery({
    queryKey: ['finished-goods'],
    queryFn: () => finishedGoodsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductionRequest) => productionApi.create(data),
    onSuccess: (response) => {
      invalidate('production');
      setIsModalOpen(false);
      reset();
      toast.success(getSuccessMessage(response, 'Production record created successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create production record'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productionApi.delete(id),
    onSuccess: (response) => {
      invalidate('production');
      toast.success(getSuccessMessage(response, 'Production record deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete production record'));
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProductionRequest>({
    defaultValues: {
      sweet_id: 0,
      quantity_produced: 0,
      production_date: new Date().toISOString().split('T')[0],
      wastage: 0,
    },
  });

  const columns: TableColumn<Production>[] = [
    {
      key: 'FinishedGoods',
      header: 'Product',
      render: (value) => value?.name || '-',
    },
    {
      key: 'quantity_produced',
      header: 'Quantity Produced',
      render: (value) => formatNumber(value),
    },
    {
      key: 'wastage',
      header: 'Wastage',
      render: (value) => formatNumber(value),
    },
    {
      key: 'production_date',
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

  const handleDelete = (production: Production) => {
    setProductionToDelete(production);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productionToDelete) {
      deleteMutation.mutate(productionToDelete.production_id);
      setIsDeleteModalOpen(false);
      setProductionToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProductionToDelete(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = (data: CreateProductionRequest) => {
    createMutation.mutate(data);
  };

  const finishedGoodOptions = finishedGoods?.map(g => ({
    value: g.sweet_id,
    label: g.name,
  })) || [];

  if (isLoading) return <Loading />;

  return (
    <div className="production-list">
      <div className="production-list-header">
        <h1>Production</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Production</Button>
      </div>
      <Table columns={columns} data={productions || []} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Add Production"
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
          <Input
            label="Quantity Produced"
            type="number"
            step="0.01"
            {...register('quantity_produced', { 
              required: 'Quantity is required',
              valueAsNumber: true,
              min: { value: 0.01, message: 'Quantity must be greater than 0' }
            })}
            error={errors.quantity_produced?.message}
            fullWidth
          />
          <Input
            label="Production Date"
            type="date"
            {...register('production_date', { required: 'Date is required' })}
            error={errors.production_date?.message}
            fullWidth
          />
          <Input
            label="Wastage"
            type="number"
            step="0.01"
            {...register('wastage', { 
              valueAsNumber: true,
              min: { value: 0, message: 'Wastage cannot be negative' }
            })}
            error={errors.wastage?.message}
            fullWidth
          />
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Production Record"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        infoItems={productionToDelete ? [
          {
            label: 'Product',
            value: productionToDelete.FinishedGoods?.name || 'N/A',
          },
          {
            label: 'Quantity Produced',
            value: formatNumber(productionToDelete.quantity_produced),
          },
          {
            label: 'Wastage',
            value: formatNumber(productionToDelete.wastage || 0),
          },
          {
            label: 'Production Date',
            value: formatDateTime(productionToDelete.production_date),
          },
        ] : []}
        warning="⚠️ This action cannot be undone. The production record will be permanently deleted."
      />
    </div>
  );
};
