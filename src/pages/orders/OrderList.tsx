import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { ordersApi } from '@/api/orders.api';
import { finishedGoodsApi } from '@/api/finished-goods.api';
import { branchesApi } from '@/api/branches.api';
import { Table, Loading, Button, StatusBadge, Modal, Input, Select, PhoneInput, toast, ConfirmationModal } from '@/components/common';
import { TableColumn } from '@/components/common/Table/Table';
import { Order, CreateOrderRequest, UpdateOrderRequest } from '@/types/order.types';
import { formatCurrency, formatDateTime, getErrorMessage, getSuccessMessage } from '@/utils/formatters';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import './OrderList.css';

interface OrderItemForm {
  sweet_id: number;
  quantity: number;
}

export const OrderList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const invalidate = useInvalidateQueries();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll(),
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
    mutationFn: (data: CreateOrderRequest) => ordersApi.create(data),
    onSuccess: (response) => {
      invalidate('orders');
      // If order is completed or is a quick bill, invalidate bill history
      if (response.status === 'completed' || response.is_quick_bill) {
        invalidate('bill-history');
      }
      setIsModalOpen(false);
      reset();
      toast.success(getSuccessMessage(response, 'Order created successfully'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || getErrorMessage(error, 'Failed to create order');
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrderRequest }): Promise<Order> =>
      ordersApi.update(id, data),
    onSuccess: (response) => {
      invalidate('orders');
      // If order is completed or is a quick bill, invalidate bill history
      if (response.status === 'completed' || response.is_quick_bill) {
        invalidate('bill-history');
      }
      setIsModalOpen(false);
      setSelectedOrder(null);
      reset();
      toast.success(getSuccessMessage(response, 'Order status updated successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update order status'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ordersApi.delete(id),
    onSuccess: (response) => {
      invalidate(['orders', 'bill-history']);
      toast.success(getSuccessMessage(response, 'Order deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete order'));
    },
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CreateOrderRequest & { items: OrderItemForm[] }>({
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_location: '',
      packing_charges: 0,
      advance_paid: 0,
      delivery_date: '',
      branch_id: 0,
      status: 'pending',
      items: [{ sweet_id: 0, quantity: 0 }],
    },
  });

  // Watch form values for calculations
  const watchedItems = useWatch({ control, name: 'items' });
  const watchedPackingCharges = useWatch({ control, name: 'packing_charges' }) || 0;
  const watchedAdvancePaid = useWatch({ control, name: 'advance_paid' }) || 0;

  // Calculate order total from items
  const calculatedOrderTotal = useMemo(() => {
    if (!watchedItems || !finishedGoods) return 0;
    return watchedItems.reduce((total, item) => {
      if (!item.sweet_id || !item.quantity) return total;
      const product = finishedGoods.find(g => g.sweet_id === item.sweet_id);
      if (product) {
        return total + (product.unit_price * item.quantity);
      }
      return total;
    }, 0);
  }, [watchedItems, finishedGoods]);

  // Calculate total value and balance
  const totalValue = calculatedOrderTotal + (parseFloat(String(watchedPackingCharges)) || 0);
  const balance = totalValue - (parseFloat(String(watchedAdvancePaid)) || 0);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const columns: TableColumn<Order>[] = [
    {
      key: 'customer_name',
      header: 'Customer',
    },
    {
      key: 'customer_phone',
      header: 'Phone',
      render: (value) => {
        if (!value) return '-';
        // Format as +91 XXXXXXXXXX
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 10) {
          return `+91 ${cleaned}`;
        }
        return value;
      },
    },
    {
      key: 'customer_location',
      header: 'Location',
      render: (value) => value || '-',
    },
    {
      key: 'Branches',
      header: 'Branch',
      render: (value) => value?.name || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (value) => formatDateTime(value),
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

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    // Clean phone number - remove +91 prefix and any non-digits
    const cleanedPhone = order.customer_phone 
      ? order.customer_phone.replace(/\D/g, '').replace(/^91/, '').slice(0, 10)
      : '';
    
    // Format delivery_date for datetime-local input
    let formattedDeliveryDate = '';
    if (order.delivery_date) {
      const date = new Date(order.delivery_date);
      if (!isNaN(date.getTime())) {
        // Format as YYYY-MM-DDTHH:mm for datetime-local input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        formattedDeliveryDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    }

    reset({
      customer_name: order.customer_name,
      customer_phone: cleanedPhone,
      customer_location: order.customer_location || '',
      packing_charges: order.packing_charges || 0,
      advance_paid: order.advance_paid || 0,
      delivery_date: formattedDeliveryDate,
      branch_id: order.branch_id,
      status: order.status,
      items: order.OrderItems?.map(item => ({
        sweet_id: item.sweet_id,
        quantity: item.quantity,
      })) || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete.order_id);
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    reset();
  };

  const onSubmit = (data: CreateOrderRequest & { items: OrderItemForm[] }) => {
    if (selectedOrder) {
      const updateData: UpdateOrderRequest = {
        customer_phone: data.customer_phone || undefined,
        customer_location: data.customer_location || undefined,
        status: data.status || selectedOrder.status,
      };
      updateMutation.mutate({ 
        id: selectedOrder.order_id, 
        data: updateData
      });
    } else {
      // Format phone number with +91 prefix
      let formattedPhone = data.customer_phone;
      if (formattedPhone) {
        const cleaned = formattedPhone.replace(/\D/g, '');
        if (cleaned.length === 10) {
          formattedPhone = `+91${cleaned}`;
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = `+${formattedPhone}`;
        }
      }

      // Format delivery_date if provided
      let formattedDeliveryDate = data.delivery_date;
      if (formattedDeliveryDate) {
        // Convert to ISO string if it's a date string
        const date = new Date(formattedDeliveryDate);
        if (!isNaN(date.getTime())) {
          formattedDeliveryDate = date.toISOString();
        }
      }

      createMutation.mutate({
        customer_name: data.customer_name,
        customer_phone: formattedPhone || undefined,
        customer_location: data.customer_location || undefined,
        packing_charges: data.packing_charges ? parseFloat(String(data.packing_charges)) : undefined,
        advance_paid: data.advance_paid ? parseFloat(String(data.advance_paid)) : undefined,
        delivery_date: formattedDeliveryDate || undefined,
        branch_id: data.branch_id,
        status: data.status,
        items: data.items.filter(item => item.sweet_id > 0 && item.quantity > 0),
      });
    }
  };

  const finishedGoodOptions = finishedGoods?.map(g => ({
    value: g.sweet_id,
    label: `${g.name} - ${formatCurrency(g.unit_price)}`,
  })) || [];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const branchOptions = branches
    ?.filter(branch => branch.status === 'active' || !branch.status)
    ?.map(branch => ({
      value: branch.branch_id,
      label: branch.name,
    })) || [];

  if (isLoading) return <Loading />;

  return (
    <div className="order-list">
      <div className="order-list-header">
        <h1>Orders</h1>
        <Button onClick={() => setIsModalOpen(true)}>Create Order</Button>
      </div>
      <Table columns={columns} data={orders || []} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={selectedOrder ? 'Edit Order' : 'Create Order'}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {selectedOrder ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Customer Name"
            {...register('customer_name', { required: 'Customer name is required' })}
            error={errors.customer_name?.message}
            fullWidth
            disabled={!!selectedOrder}
          />
          <div>
            <PhoneInput
              label="Customer Phone"
              {...register('customer_phone', {
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Please enter a valid 10-digit Indian mobile number (e.g., 7093592228)',
                },
                minLength: {
                  value: 10,
                  message: 'Phone number must be 10 digits',
                },
                maxLength: {
                  value: 10,
                  message: 'Phone number must be 10 digits',
                },
              })}
              error={errors.customer_phone?.message}
              fullWidth
              countryCode="+91"
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
              📱 WhatsApp message will be sent automatically if phone number is provided
            </small>
          </div>
          <Input
            label="Customer Location"
            placeholder="123 Main St, City"
            {...register('customer_location')}
            error={errors.customer_location?.message}
            fullWidth
          />
          {!selectedOrder && (
            <>
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
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Order Items</label>
                {fields.map((field, index) => (
                  <div key={field.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                    <Select
                      options={finishedGoodOptions}
                      {...register(`items.${index}.sweet_id`, { 
                        required: 'Product is required',
                        valueAsNumber: true 
                      })}
                      placeholder="Select product"
                      style={{ flex: 2 }}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.quantity`, { 
                        required: 'Quantity is required',
                        valueAsNumber: true,
                        min: { value: 0.01, message: 'Quantity must be greater than 0' }
                      })}
                      placeholder="Quantity"
                      style={{ flex: 1 }}
                    />
                    {fields.length > 1 && (
                      <Button type="button" variant="danger" size="sm" onClick={() => remove(index)}>
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ sweet_id: 0, quantity: 0 })}>
                  Add Item
                </Button>
              </div>
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Order Total:</strong>
                  <strong>{formatCurrency(calculatedOrderTotal)}</strong>
                </div>
                {!selectedOrder && (
                  <>
                    <Input
                      label="Packing Charges (₹)"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('packing_charges', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Packing charges cannot be negative' }
                      })}
                      error={errors.packing_charges?.message}
                      fullWidth
                    />
                    <Input
                      label="Advance Paid (₹)"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('advance_paid', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Advance paid cannot be negative' }
                      })}
                      error={errors.advance_paid?.message}
                      fullWidth
                    />
                    <Input
                      label="Delivery Date & Time"
                      type="datetime-local"
                      {...register('delivery_date')}
                      error={errors.delivery_date?.message}
                      fullWidth
                    />
                    <div style={{ 
                      marginTop: '1rem', 
                      paddingTop: '1rem', 
                      borderTop: '1px solid var(--border-color)' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Packing Charges:</span>
                        <span>{formatCurrency(parseFloat(String(watchedPackingCharges)) || 0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>Total Value:</strong>
                        <strong>{formatCurrency(totalValue)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Advance Paid:</span>
                        <span>{formatCurrency(parseFloat(String(watchedAdvancePaid)) || 0)}</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        paddingTop: '0.5rem',
                        borderTop: '2px solid var(--border-color)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}>
                        <span>Balance:</span>
                        <span style={{ color: balance > 0 ? 'var(--error-color)' : 'var(--success-color)' }}>
                          {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
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
        title="Delete Order"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        infoItems={orderToDelete ? [
          {
            label: 'Order ID',
            value: orderToDelete.order_id.toString(),
          },
          {
            label: 'Customer',
            value: orderToDelete.customer_name,
          },
          {
            label: 'Phone',
            value: orderToDelete.customer_phone 
              ? (() => {
                  const cleaned = orderToDelete.customer_phone.replace(/\D/g, '');
                  return cleaned.length === 10 ? `+91 ${cleaned}` : orderToDelete.customer_phone;
                })()
              : 'N/A',
          },
          {
            label: 'Location',
            value: orderToDelete.customer_location || 'N/A',
          },
          {
            label: 'Branch',
            value: orderToDelete.Branches?.name || 'N/A',
          },
          {
            label: 'Total Amount',
            value: formatCurrency(orderToDelete.total_amount),
          },
          {
            label: 'Status',
            value: orderToDelete.status,
          },
        ] : []}
        warning="⚠️ This action cannot be undone. The order will be permanently deleted."
      />
    </div>
  );
};
