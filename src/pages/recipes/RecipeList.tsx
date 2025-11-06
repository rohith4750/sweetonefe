import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { recipesApi } from '@/api/recipes.api';
import { finishedGoodsApi } from '@/api/finished-goods.api';
import { rawMaterialsApi } from '@/api/raw-materials.api';
import { Table, Loading, Button, Modal, Input, Select, toast, ConfirmationModal } from '@/components/common';
import { TableColumn } from '@/components/common/Table/Table';
import { Recipe, CreateRecipeRequest } from '@/types/recipe.types';
import { formatNumber, getErrorMessage, getSuccessMessage } from '@/utils/formatters';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import './RecipeList.css';

export const RecipeList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const invalidate = useInvalidateQueries();

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => recipesApi.getAll(),
  });

  const { data: finishedGoods } = useQuery({
    queryKey: ['finished-goods'],
    queryFn: () => finishedGoodsApi.getAll(),
  });

  const { data: rawMaterials } = useQuery({
    queryKey: ['raw-materials'],
    queryFn: () => rawMaterialsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRecipeRequest) => recipesApi.create(data),
    onSuccess: (response) => {
      invalidate('recipes');
      setIsModalOpen(false);
      reset();
      toast.success(getSuccessMessage(response, 'Recipe created successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create recipe'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateRecipeRequest> }) =>
      recipesApi.update(id, data),
    onSuccess: (response) => {
      invalidate('recipes');
      setIsModalOpen(false);
      setSelectedRecipe(null);
      reset();
      toast.success(getSuccessMessage(response, 'Recipe updated successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update recipe'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => recipesApi.delete(id),
    onSuccess: (response) => {
      invalidate('recipes');
      toast.success(getSuccessMessage(response, 'Recipe deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete recipe'));
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateRecipeRequest>({
    defaultValues: {
      sweet_id: 0,
      material_id: 0,
      quantity_required: 0,
    },
  });

  const columns: TableColumn<Recipe>[] = [
    {
      key: 'FinishedGoods',
      header: 'Finished Good',
      render: (value) => value?.name || '-',
    },
    {
      key: 'RawMaterials',
      header: 'Raw Material',
      render: (value) => value?.name || '-',
    },
    {
      key: 'quantity_required',
      header: 'Quantity Required',
      render: (value, row) =>
        `${formatNumber(value)} ${row.RawMaterials?.unit || ''}`,
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

  const handleEdit = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    reset({
      sweet_id: recipe.sweet_id,
      material_id: recipe.material_id,
      quantity_required: recipe.quantity_required,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (recipeToDelete) {
      deleteMutation.mutate(recipeToDelete.recipe_id);
      setIsDeleteModalOpen(false);
      setRecipeToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRecipeToDelete(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
    reset();
  };

  const onSubmit = (data: CreateRecipeRequest) => {
    if (selectedRecipe) {
      updateMutation.mutate({ id: selectedRecipe.recipe_id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const finishedGoodOptions = finishedGoods?.map(g => ({
    value: g.sweet_id,
    label: g.name,
  })) || [];

  const rawMaterialOptions = rawMaterials?.map(m => ({
    value: m.material_id,
    label: m.name,
  })) || [];

  if (isLoading) return <Loading />;

  return (
    <div className="recipe-list">
      <div className="recipe-list-header">
        <h1>Recipes</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Recipe</Button>
      </div>
      <Table columns={columns} data={recipes || []} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={selectedRecipe ? 'Edit Recipe' : 'Add Recipe'}
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
              {selectedRecipe ? 'Update' : 'Create'}
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
            label="Raw Material"
            options={rawMaterialOptions}
            {...register('material_id', { 
              required: 'Raw material is required',
              valueAsNumber: true 
            })}
            error={errors.material_id?.message}
            fullWidth
          />
          <Input
            label="Quantity Required"
            type="number"
            step="0.01"
            {...register('quantity_required', { 
              required: 'Quantity is required',
              valueAsNumber: true,
              min: { value: 0.01, message: 'Quantity must be greater than 0' }
            })}
            error={errors.quantity_required?.message}
            fullWidth
          />
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Recipe"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        infoItems={recipeToDelete ? [
          {
            label: 'Finished Good',
            value: recipeToDelete.FinishedGoods?.name || 'N/A',
          },
          {
            label: 'Raw Material',
            value: recipeToDelete.RawMaterials?.name || 'N/A',
          },
          {
            label: 'Quantity Required',
            value: formatNumber(recipeToDelete.quantity_required),
          },
        ] : []}
        warning="⚠️ This action cannot be undone. The recipe will be permanently deleted."
      />
    </div>
  );
};
