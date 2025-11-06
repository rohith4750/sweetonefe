import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { distributionApi } from '@/api/distribution.api';
import { finishedGoodsApi } from '@/api/finished-goods.api';
import { branchesApi } from '@/api/branches.api';
import { Table, Loading, Button, Modal, Input, Select, toast, ConfirmationModal, StatusBadge } from '@/components/common';
import { TableColumn } from '@/components/common/Table/Table';
import { Distribution, CreateDistributionRequest, DistributionHistoryItem } from '@/types/distribution.types';
import { formatDateTime, formatNumber, formatCurrency, getErrorMessage, getSuccessMessage } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import { ROLES } from '@/utils/constants';
import { canManageDistribution, canApproveDistribution } from '@/utils/permissions';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import './DistributionList.css';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const DistributionList: React.FC = () => {
  const { user } = useAuthStore();
  
  // Calculate role-based flags first
  const canCreate = user?.role && canManageDistribution(user.role);
  const canApprove = user?.role && canApproveDistribution(user.role);
  const isTransportAdmin = user?.role === ROLES.TRANSPORT_ADMIN;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [distributionToDelete, setDistributionToDelete] = useState<Distribution | null>(null);
  const [distributionToApprove, setDistributionToApprove] = useState<Distribution | null>(null);
  const [distributionToReject, setDistributionToReject] = useState<Distribution | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('all');
  // For transport admin, always show active tab (delivery details)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  // For transport admin, default to today's date
  const [historyStartDate, setHistoryStartDate] = useState<string>(isTransportAdmin ? getTodayDate() : '');
  const [historyEndDate, setHistoryEndDate] = useState<string>(isTransportAdmin ? getTodayDate() : '');
  const [historyBranchFilter, setHistoryBranchFilter] = useState<number | undefined>(undefined);
  const invalidate = useInvalidateQueries();

  // Set today's date as default when transport admin switches to history tab
  useEffect(() => {
    if (isTransportAdmin && activeTab === 'history') {
      const today = getTodayDate();
      // Only set if dates are empty or not set to today
      if (!historyStartDate || !historyEndDate) {
        setHistoryStartDate(today);
        setHistoryEndDate(today);
      }
    }
  }, [isTransportAdmin, activeTab]); // Only depend on tab change, not date changes

  const { data: distributions, isLoading } = useQuery({
    queryKey: ['distribution', statusFilter, isTransportAdmin],
    queryFn: () => {
      const params: any = {};
      // For transport admin, only show pending distributions
      if (isTransportAdmin) {
        params.status = 'pending';
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      return distributionApi.getAll(params);
    },
  });

  const { data: finishedGoods } = useQuery({
    queryKey: ['finished-goods'],
    queryFn: () => finishedGoodsApi.getAll(),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getAll({ status: 'active' }),
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['distribution-history', historyStartDate, historyEndDate, historyBranchFilter, isTransportAdmin],
    queryFn: () => {
      const params: {
        start_date?: string;
        end_date?: string;
        branch_id?: number;
        status?: 'pending' | 'approved' | 'rejected';
      } = {};
      if (historyStartDate) params.start_date = historyStartDate;
      if (historyEndDate) params.end_date = historyEndDate;
      if (historyBranchFilter) params.branch_id = historyBranchFilter;
      // For Transport Admin, only show approved/delivered items
      if (isTransportAdmin) {
        params.status = 'approved';
      }
      return distributionApi.getHistory(params);
    },
    enabled: activeTab === 'history',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDistributionRequest) => distributionApi.create(data),
    onSuccess: (response) => {
      invalidate('distribution');
      setIsModalOpen(false);
      reset();
      toast.success(getSuccessMessage(response, 'Distribution request created. Waiting for transport admin to deliver and confirm.'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || getErrorMessage(error, 'Failed to create distribution request');
      toast.error(errorMessage);
    },
  });

  /**
   * Approve distribution - Transport admin approves when they deliver items to the branch
   * 
   * When transport admin approves at branch location:
   * 1. Status changes to 'approved' (marks delivery as complete)
   * 2. Stock is removed from FinishedGoods (main warehouse)
   * 3. Stock is added to BranchSweetsStock (branch inventory)
   * 
   * This confirms the items were physically delivered and updates branch stock
   */
  const approveMutation = useMutation({
    mutationFn: (id: number) => distributionApi.approve(id),
    onSuccess: (response) => {
      invalidate('distribution');
      setIsApproveModalOpen(false);
      setDistributionToApprove(null);
      toast.success(getSuccessMessage(response, 'Delivery confirmed successfully. Stock has been moved to branch.'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to confirm delivery'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => distributionApi.reject(id, reason),
    onSuccess: (response) => {
      invalidate('distribution');
      setIsRejectModalOpen(false);
      setDistributionToReject(null);
      resetRejectForm();
      toast.success(getSuccessMessage(response, 'Distribution rejected successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to reject distribution'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => distributionApi.delete(id),
    onSuccess: (response) => {
      invalidate('distribution');
      toast.success(getSuccessMessage(response, 'Distribution record deleted successfully'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete distribution record'));
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateDistributionRequest>({
    defaultValues: {
      sweet_id: 0,
      to_branch: 0,
      quantity_sent: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const { register: registerReject, handleSubmit: handleSubmitReject, reset: resetRejectForm, formState: { errors: rejectErrors } } = useForm<{ reason: string }>({
    defaultValues: {
      reason: '',
    },
  });

  // Simplified columns for Transport Admin - only delivery details
  const transportAdminColumns: TableColumn<Distribution>[] = [
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={() => handleApprove(row)}
              >
                Mark as Delivered
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleReject(row)}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'distribution_id',
      header: 'ID',
      render: (value) => `#${value}`,
    },
    {
      key: 'FinishedGoods',
      header: 'Product',
      render: (value) => value?.name || '-',
    },
    {
      key: 'Branches',
      header: 'Delivery Branch',
      render: (value) => value?.name || '-',
    },
    {
      key: 'quantity_sent',
      header: 'Quantity',
      render: (value) => formatNumber(value),
    },
    {
      key: 'date',
      header: 'Delivery Date',
      render: (value) => formatDateTime(value),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const status = value || 'pending';
        return <StatusBadge status={status} />;
      },
    },
  ];

  // Full columns for Super Admin with all financial details
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  
  const columns: TableColumn<Distribution>[] = [
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {canApprove && row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={() => handleApprove(row)}
              >
                Mark as Delivered
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleReject(row)}
              >
                Reject
              </Button>
            </>
          )}
          {canCreate && row.status === 'pending' && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(row)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
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
      key: 'quantity_sent',
      header: 'Quantity',
      render: (value) => formatNumber(value),
    },
    // Show financial and stock details only for Super Admin
    ...(isSuperAdmin ? [
      {
        key: 'stock_value',
        header: 'Stock Value',
        render: (_: unknown, row: Distribution) => {
          // Get current stock from finished goods data
          const finishedGood = finishedGoods?.find(fg => fg.sweet_id === row.sweet_id);
          if (finishedGood?.current_stock !== undefined) {
            return formatNumber(finishedGood.current_stock);
          }
          return '-';
        },
      },
      {
        key: 'unit_price',
        header: 'Unit Price',
        render: (_: unknown, row: Distribution) => {
          // Get unit price from finished goods data
          const finishedGood = finishedGoods?.find(fg => fg.sweet_id === row.sweet_id);
          return finishedGood?.unit_price ? formatCurrency(finishedGood.unit_price) : '-';
        },
      },
      {
        key: 'total_value',
        header: 'Total Value',
        render: (_: unknown, row: Distribution) => {
          // Calculate total value: quantity_sent * unit_price
          const finishedGood = finishedGoods?.find(fg => fg.sweet_id === row.sweet_id);
          if (finishedGood?.unit_price && row.quantity_sent) {
            const totalValue = row.quantity_sent * finishedGood.unit_price;
            return formatCurrency(totalValue);
          }
          return '-';
        },
      },
    ] : []),
    {
      key: 'date',
      header: 'Date',
      render: (value) => formatDateTime(value),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const status = value || 'pending';
        return <StatusBadge status={status} />;
      },
    },
    {
      key: 'CreatedBy',
      header: 'Created By',
      render: (value, row) => {
        if (value) return value.name;
        if (row.Users) return row.Users.name;
        return '-';
      },
    },
    ...(canApprove ? [{
      key: 'ApprovedBy',
      header: 'Delivered By',
      render: (value: Distribution['ApprovedBy']) => value?.name || '-',
    }] : []),
  ];

  const handleDelete = (distribution: Distribution) => {
    setDistributionToDelete(distribution);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (distributionToDelete) {
      deleteMutation.mutate(distributionToDelete.distribution_id);
      setIsDeleteModalOpen(false);
      setDistributionToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDistributionToDelete(null);
  };

  const handleApprove = (distribution: Distribution) => {
    setDistributionToApprove(distribution);
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = () => {
    if (distributionToApprove) {
      approveMutation.mutate(distributionToApprove.distribution_id);
    }
  };

  const handleCloseApproveModal = () => {
    setIsApproveModalOpen(false);
    setDistributionToApprove(null);
  };

  const handleReject = (distribution: Distribution) => {
    setDistributionToReject(distribution);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (data: { reason: string }) => {
    if (distributionToReject) {
      rejectMutation.mutate({ id: distributionToReject.distribution_id, reason: data.reason });
    }
  };

  const handleCloseRejectModal = () => {
    setIsRejectModalOpen(false);
    setDistributionToReject(null);
    resetRejectForm();
  };

  const handleClose = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = (data: CreateDistributionRequest) => {
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

  // Simplified history columns for Transport Admin - only delivery details, no financial info
  const transportAdminHistoryColumns: TableColumn<DistributionHistoryItem>[] = [
    {
      key: 'distribution_id',
      header: 'ID',
      render: (value) => `#${value}`,
    },
    {
      key: 'date',
      header: 'Delivery Date',
      render: (value) => formatDateTime(value),
    },
    {
      key: 'product',
      header: 'Product',
    },
    {
      key: 'branch',
      header: 'Delivery Branch',
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (value) => formatNumber(value),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'approved_at',
      header: 'Delivered At',
      render: (value) => value ? formatDateTime(value) : '-',
    },
  ];

  // Full history columns for other roles with financial details
  const historyColumns: TableColumn<DistributionHistoryItem>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (value) => formatDateTime(value),
    },
    {
      key: 'product',
      header: 'Product',
    },
    {
      key: 'branch',
      header: 'Branch',
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (value) => formatNumber(value),
    },
    {
      key: 'unit_price',
      header: 'Unit Price',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'total_value',
      header: 'Total Value',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'created_by',
      header: 'Created By',
    },
    {
      key: 'approved_by',
      header: 'Approved By',
      render: (value) => value || '-',
    },
    {
      key: 'approved_at',
      header: 'Approved At',
      render: (value) => value ? formatDateTime(value) : '-',
    },
  ];

  const branchFilterOptions = branches
    ?.filter(branch => branch.status === 'active' || !branch.status)
    ?.map(branch => ({
      value: branch.branch_id,
      label: branch.name,
    })) || [];

  const handleClearHistoryFilters = () => {
    // For transport admin, reset to today's date instead of clearing
    if (isTransportAdmin) {
      const today = getTodayDate();
      setHistoryStartDate(today);
      setHistoryEndDate(today);
    } else {
      setHistoryStartDate('');
      setHistoryEndDate('');
    }
    setHistoryBranchFilter(undefined);
  };

  if (isLoading && activeTab === 'active') return <Loading />;
  if (isHistoryLoading && activeTab === 'history') return <Loading />;

  return (
    <div className="distribution-list">
      <div className="distribution-list-header">
        <h1>{isTransportAdmin ? 'Delivery Management' : 'Distribution'}</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeTab === 'active' && canCreate && !isTransportAdmin && (
            <Button onClick={() => setIsModalOpen(true)}>Create Distribution Request</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '2px solid var(--border-color)',
        marginBottom: '1.5rem'
      }}>
        <Button
          variant={activeTab === 'active' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('active')}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          {isTransportAdmin ? 'Pending Deliveries' : 'Active Distributions'}
        </Button>
        <Button
          variant={activeTab === 'history' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('history')}
          style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
        >
          {isTransportAdmin ? 'Delivered History' : 'History & Statistics'}
        </Button>
      </div>

      {activeTab === 'active' ? (
        <>
          {/* Status filter - only show for non-transport admin */}
          {!isTransportAdmin && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              {(canApprove || isTransportAdmin) && (
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                  ]}
                  style={{ minWidth: '150px' }}
                />
              )}
            </div>
          )}
          {/* Show simplified columns for Transport Admin */}
          <Table 
            columns={isTransportAdmin ? transportAdminColumns : columns} 
            data={distributions || []} 
            emptyMessage={isTransportAdmin ? "No pending deliveries" : "No distributions found"}
          />
        </>
      ) : (
        <>
          {/* History Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            flexWrap: 'wrap',
            alignItems: 'flex-end'
          }}>
            <Input
              label="Start Date"
              type="date"
              value={historyStartDate}
              onChange={(e) => setHistoryStartDate(e.target.value)}
              style={{ minWidth: '150px' }}
            />
            <Input
              label="End Date"
              type="date"
              value={historyEndDate}
              onChange={(e) => setHistoryEndDate(e.target.value)}
              style={{ minWidth: '150px' }}
            />
            <Select
              label="Branch"
              value={historyBranchFilter?.toString() || ''}
              onChange={(e) => setHistoryBranchFilter(e.target.value ? Number(e.target.value) : undefined)}
              options={[
                { value: '', label: 'All Branches' },
                ...branchFilterOptions,
              ]}
              style={{ minWidth: '200px' }}
            />
            <Button variant="outline" onClick={handleClearHistoryFilters}>
              Clear Filters
            </Button>
          </div>

          {historyData && (
            <>
              {/* Summary Statistics - Hide financial stats for Transport Admin */}
              {!isTransportAdmin && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Total Distributions
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {historyData.summary.total_distributions}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Approved
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                      {historyData.summary.approved}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Pending
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                      {historyData.summary.pending}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Rejected
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--error-color)' }}>
                      {historyData.summary.rejected}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Total Quantity
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {formatNumber(historyData.summary.total_quantity)}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Total Value
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {formatCurrency(historyData.summary.total_value)}
                    </div>
                  </div>
                </div>
              )}

              {/* Simple summary for Transport Admin */}
              {isTransportAdmin && historyData.summary && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Total Deliveries
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {historyData.summary.approved}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Total Quantity Delivered
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {formatNumber(historyData.summary.total_quantity)}
                    </div>
                  </div>
                </div>
              )}

              {/* Branch Breakdown - Hide for Transport Admin */}
              {!isTransportAdmin && historyData.by_branch.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>By Branch</h2>
                  <Table
                    columns={[
                      { key: 'branch_name', header: 'Branch' },
                      { key: 'total_distributions', header: 'Distributions', render: (value) => formatNumber(value) },
                      { key: 'total_quantity', header: 'Total Quantity', render: (value) => formatNumber(value) },
                      { key: 'total_value', header: 'Total Value', render: (value) => formatCurrency(value) },
                    ]}
                    data={historyData.by_branch}
                  />
                </div>
              )}

              {/* Product Breakdown - Hide for Transport Admin */}
              {!isTransportAdmin && historyData.by_product.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>By Product</h2>
                  <Table
                    columns={[
                      { key: 'product_name', header: 'Product' },
                      { key: 'total_distributions', header: 'Distributions', render: (value) => formatNumber(value) },
                      { key: 'total_quantity', header: 'Total Quantity', render: (value) => formatNumber(value) },
                      { key: 'total_value', header: 'Total Value', render: (value) => formatCurrency(value) },
                    ]}
                    data={historyData.by_product}
                  />
                </div>
              )}

              {/* Full History */}
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                  {isTransportAdmin ? 'Delivered Items' : 'Full History'}
                </h2>
                <Table 
                  columns={isTransportAdmin ? transportAdminHistoryColumns : historyColumns} 
                  data={historyData.history} 
                  emptyMessage={isTransportAdmin ? "No delivered items found" : "No history found"}
                />
              </div>
            </>
          )}
        </>
      )}

        <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Create Distribution Request"
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
            label="To Branch"
            options={branchOptions}
            {...register('to_branch', { 
              required: 'Branch is required',
              valueAsNumber: true 
            })}
            error={errors.to_branch?.message}
            fullWidth
          />
          <Input
            label="Quantity Sent"
            type="number"
            step="0.01"
            {...register('quantity_sent', { 
              required: 'Quantity is required',
              valueAsNumber: true,
              min: { value: 0.01, message: 'Quantity must be greater than 0' }
            })}
            error={errors.quantity_sent?.message}
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
        title="Delete Distribution Record"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        infoItems={distributionToDelete ? [
          {
            label: 'Product',
            value: distributionToDelete.FinishedGoods?.name || 'N/A',
          },
          {
            label: 'Branch',
            value: distributionToDelete.Branches?.name || 'N/A',
          },
          {
            label: 'Quantity',
            value: formatNumber(distributionToDelete.quantity_sent),
          },
          {
            label: 'Date',
            value: formatDateTime(distributionToDelete.date),
          },
        ] : []}
        warning="⚠️ This action cannot be undone. The distribution record will be permanently deleted."
      />

      {/* Approve Modal */}
      <ConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={handleCloseApproveModal}
        onConfirm={handleConfirmApprove}
        title="Confirm Delivery"
        confirmLabel="Confirm Delivered"
        cancelLabel="Cancel"
        confirmVariant="success"
        isLoading={approveMutation.isPending}
        infoItems={distributionToApprove ? [
          {
            label: 'Product',
            value: distributionToApprove.FinishedGoods?.name || 'N/A',
          },
          {
            label: 'Branch',
            value: distributionToApprove.Branches?.name || 'N/A',
          },
          {
            label: 'Quantity',
            value: formatNumber(distributionToApprove.quantity_sent),
          },
          {
            label: 'Created By',
            value: distributionToApprove.CreatedBy?.name || distributionToApprove.Users?.name || 'N/A',
          },
        ] : []}
        warning="⚠️ Confirm this only after you have physically delivered the products to the branch. This will move stock from Finished Goods to Branch Stock immediately."
      />

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={handleCloseRejectModal}
        title="Reject Distribution"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={handleCloseRejectModal} disabled={rejectMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSubmitReject(handleConfirmReject)}
              isLoading={rejectMutation.isPending}
            >
              Reject
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitReject(handleConfirmReject)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {distributionToReject && (
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Product:</strong> {distributionToReject.FinishedGoods?.name || 'N/A'}</p>
              <p><strong>Branch:</strong> {distributionToReject.Branches?.name || 'N/A'}</p>
              <p><strong>Quantity:</strong> {formatNumber(distributionToReject.quantity_sent)}</p>
            </div>
          )}
          <div className="input-wrapper input-full-width">
            <label className="input-label">
              Rejection Reason <span className="input-required">*</span>
            </label>
            <textarea
              className={`input ${rejectErrors.reason ? 'input-error' : ''}`}
              placeholder="Enter reason for rejection (e.g., Stock damaged during transport)"
              {...registerReject('reason', { required: 'Rejection reason is required' })}
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
            {rejectErrors.reason && (
              <span className="input-error-text">{rejectErrors.reason.message}</span>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};
