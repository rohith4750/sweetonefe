import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchStockApi } from '@/api/branch-stock.api';
import { branchesApi } from '@/api/branches.api';
import { Table, Loading } from '@/components/common';
import { TableColumn } from '@/components/common/Table/Table';
import { BranchStock } from '@/types/branch-stock.types';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import './BranchStockList.css';

export const BranchStockList: React.FC = () => {
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const { data: stock, isLoading } = useQuery({
    queryKey: ['branch-stock', selectedBranchId],
    queryFn: () => branchStockApi.getAll(selectedBranchId || undefined),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getAll(),
  });

  // Get unique branches from stock data
  const uniqueBranches = useMemo(() => {
    if (!stock) return [];
    const branchMap = new Map<number, { branch_id: number; name: string; stockCount: number }>();
    
    stock.forEach((item) => {
      if (item.Branches) {
        const branchId = item.Branches.branch_id;
        if (branchMap.has(branchId)) {
          const existing = branchMap.get(branchId)!;
          existing.stockCount += 1;
        } else {
          branchMap.set(branchId, {
            branch_id: branchId,
            name: item.Branches.name,
            stockCount: 1,
          });
        }
      }
    });
    
    return Array.from(branchMap.values());
  }, [stock]);

  // Calculate total stock value for each branch
  const branchStockValues = useMemo(() => {
    if (!stock) return new Map<number, number>();
    const valueMap = new Map<number, number>();
    
    stock.forEach((item) => {
      if (item.Branches && item.FinishedGoods) {
        const branchId = item.Branches.branch_id;
        const value = item.current_stock * item.FinishedGoods.unit_price;
        valueMap.set(branchId, (valueMap.get(branchId) || 0) + value);
      }
    });
    
    return valueMap;
  }, [stock]);

  // Filter stock by selected branch
  const filteredStock = useMemo(() => {
    if (!stock) return [];
    if (selectedBranchId === null) return stock;
    return stock.filter((item) => item.Branches?.branch_id === selectedBranchId);
  }, [stock, selectedBranchId]);

  // Calculate total stock value for all branches
  const totalStockValue = useMemo(() => {
    if (!stock) return 0;
    return stock.reduce((total, item) => {
      if (item.FinishedGoods) {
        return total + (item.current_stock * item.FinishedGoods.unit_price);
      }
      return total;
    }, 0);
  }, [stock]);

  const columns: TableColumn<BranchStock>[] = [
    ...(selectedBranchId === null
      ? [
          {
            key: 'Branches',
            header: 'Branch',
            render: (value) => value?.name || '-',
          },
        ]
      : []),
    {
      key: 'FinishedGoods',
      header: 'Product',
      render: (value) => value?.name || '-',
    },
    {
      key: 'current_stock',
      header: 'Stock',
      render: (value) => formatNumber(value),
    },
    {
      key: 'FinishedGoods',
      header: 'Unit Price',
      render: (value) => (value?.unit_price ? formatCurrency(value.unit_price) : '-'),
    },
    {
      key: 'stock_value',
      header: 'Stock Value',
      render: (_, row) => {
        if (row.FinishedGoods) {
          const value = row.current_stock * row.FinishedGoods.unit_price;
          return formatCurrency(value);
        }
        return '-';
      },
    },
  ];

  if (isLoading) return <Loading />;

  return (
    <div className="branch-stock-list">
      <div className="branch-stock-list-header">
        <h1>Branch Stock</h1>
      </div>

      {/* Branch Cards */}
      <div className="branch-cards-container">
        <div
          className={`branch-card ${selectedBranchId === null ? 'branch-card-active' : ''}`}
          onClick={() => setSelectedBranchId(null)}
        >
          <div className="branch-card-header">
            <h3>All Branches</h3>
          </div>
          <div className="branch-card-stats">
            <div className="branch-card-stat">
              <span className="branch-card-stat-label">Total Products</span>
              <span className="branch-card-stat-value">{stock?.length || 0}</span>
            </div>
            <div className="branch-card-stat">
              <span className="branch-card-stat-label">Total Value</span>
              <span className="branch-card-stat-value">{formatCurrency(totalStockValue)}</span>
            </div>
          </div>
        </div>

        {uniqueBranches.map((branch) => {
          const branchValue = branchStockValues.get(branch.branch_id) || 0;
          return (
            <div
              key={branch.branch_id}
              className={`branch-card ${selectedBranchId === branch.branch_id ? 'branch-card-active' : ''}`}
              onClick={() => setSelectedBranchId(branch.branch_id)}
            >
              <div className="branch-card-header">
                <h3>{branch.name}</h3>
              </div>
              <div className="branch-card-stats">
                <div className="branch-card-stat">
                  <span className="branch-card-stat-label">Products</span>
                  <span className="branch-card-stat-value">{branch.stockCount}</span>
                </div>
                <div className="branch-card-stat">
                  <span className="branch-card-stat-label">Stock Value</span>
                  <span className="branch-card-stat-value">{formatCurrency(branchValue)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Table */}
      <div className="branch-stock-table-section">
        {selectedBranchId === null ? (
          <h2 className="section-title">All Branch Stock</h2>
        ) : (
          <h2 className="section-title">
            Stock for {uniqueBranches.find(b => b.branch_id === selectedBranchId)?.name || 'Branch'}
          </h2>
        )}
        <Table columns={columns} data={filteredStock} />
      </div>
    </div>
  );
};

