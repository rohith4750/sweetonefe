import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { rawMaterialsApi } from '@/api/raw-materials.api';
import { Table, Loading, SearchBar, StatusBadge, Button, Modal, Input, toast, ConfirmationModal } from '@/components/common';
import { TableColumn } from '@/components/common/Table/Table';
import { RawMaterial, CreateRawMaterialRequest } from '@/types/raw-material.types';
import { formatCurrency, formatNumber, getErrorMessage, getSuccessMessage } from '@/utils/formatters';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import './RawMaterialList.css';

export const RawMaterialList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<RawMaterial | null>(null);
  const invalidate = useInvalidateQueries();

  const { data: materials, isLoading } = useQuery({
    queryKey: ['raw-materials'],
    queryFn: () => rawMaterialsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRawMaterialRequest) => rawMaterialsApi.create(data),
    onSuccess: (response) => {
      invalidate('raw-materials');
      setIsModalOpen(false);
      reset();
      toast.success(getSuccessMessage(response, 'Raw material created successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create raw material'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RawMaterial> }) =>
      rawMaterialsApi.update(id, data),
    onSuccess: (response) => {
      invalidate('raw-materials');
      setIsModalOpen(false);
      setSelectedMaterial(null);
      reset();
      toast.success(getSuccessMessage(response, 'Raw material updated successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update raw material'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rawMaterialsApi.delete(id),
    onSuccess: (response) => {
      invalidate('raw-materials');
      toast.success(getSuccessMessage(response, 'Raw material deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete raw material'));
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateRawMaterialRequest>({
    defaultValues: {
      name: '',
      unit: 'kg',
      current_stock: 0,
      reorder_level: 0,
      price_per_unit: 0,
    },
  });

  const filteredMaterials =
    materials?.filter(
      (material) =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const columns: TableColumn<RawMaterial>[] = [
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'current_stock',
      header: 'Stock',
      render: (value, row) => (
        <div>
          {formatNumber(value)} {row.unit}
          {value <= row.reorder_level && (
            <StatusBadge status="Low Stock" variant="error" />
          )}
        </div>
      ),
    },
    {
      key: 'reorder_level',
      header: 'Reorder Level',
      render: (value, row) => `${formatNumber(value)} ${row.unit}`,
    },
    {
      key: 'price_per_unit',
      header: 'Price',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'value',
      header: 'Value',
      render: (_, row) => formatCurrency(row.current_stock * row.price_per_unit),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
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
    },
  ];

  const handleEdit = (material: RawMaterial) => {
    setSelectedMaterial(material);
    reset({
      name: material.name,
      unit: material.unit,
      current_stock: material.current_stock,
      reorder_level: material.reorder_level,
      price_per_unit: material.price_per_unit,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (material: RawMaterial) => {
    setMaterialToDelete(material);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (materialToDelete) {
      deleteMutation.mutate(materialToDelete.material_id);
      setIsDeleteModalOpen(false);
      setMaterialToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMaterialToDelete(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedMaterial(null);
    reset();
  };

  const onSubmit = (data: CreateRawMaterialRequest) => {
    if (selectedMaterial) {
      updateMutation.mutate({ id: selectedMaterial.material_id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="raw-material-list">
      <div className="raw-material-list-header">
        <h1>Raw Materials</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Raw Material</Button>
      </div>

      <div className="raw-material-list-filters">
        <SearchBar onSearch={setSearchTerm} placeholder="Search materials..." />
      </div>

      <Table columns={columns} data={filteredMaterials} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={selectedMaterial ? 'Edit Raw Material' : 'Add Raw Material'}
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
              {selectedMaterial ? 'Update' : 'Create'}
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
            label="Unit"
            {...register('unit', { required: 'Unit is required' })}
            error={errors.unit?.message}
            fullWidth
          />
          <Input
            label="Current Stock"
            type="number"
            step="0.01"
            {...register('current_stock', { 
              required: 'Current stock is required',
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
          <Input
            label="Price Per Unit"
            type="number"
            step="0.01"
            {...register('price_per_unit', { 
              required: 'Price is required',
              valueAsNumber: true,
              min: { value: 0, message: 'Price must be positive' }
            })}
            error={errors.price_per_unit?.message}
            fullWidth
          />
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Raw Material"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        infoItems={materialToDelete ? [
          {
            label: 'Name',
            value: materialToDelete.name,
          },
          {
            label: 'Unit',
            value: materialToDelete.unit,
          },
          {
            label: 'Current Stock',
            value: formatNumber(materialToDelete.current_stock),
          },
          {
            label: 'Price Per Unit',
            value: formatCurrency(materialToDelete.price_per_unit),
          },
        ] : []}
        warning="⚠️ This action cannot be undone. The raw material will be permanently deleted."
      />
    </div>
  );
};
