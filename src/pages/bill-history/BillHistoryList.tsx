import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { quickBillApi } from "@/api/quick-bill.api";
import { branchesApi } from "@/api/branches.api";
import {
  Table,
  Loading,
  Button,
  Modal,
  Select,
  Input,
} from "@/components/common";
import { TableColumn } from "@/components/common/Table/Table";
import { QuickBillHistoryItem } from "@/types/quick-bill.types";
import { useAuthStore } from "@/store/authStore";
import { ROLES } from "@/utils/constants";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import "./BillHistoryList.css";

export const BillHistoryList: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedBill, setSelectedBill] = useState<QuickBillHistoryItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchFilter, setBranchFilter] = useState<number | undefined>(
    user?.branch_id &&
      (user.role === ROLES.BRANCH_ADMIN || user.role === ROLES.USER)
      ? user.branch_id
      : undefined
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const isSuperOrKitchenAdmin =
    user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.KITCHEN_ADMIN;

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.getAll({ status: 'active' }),
    enabled: isSuperOrKitchenAdmin,
  });

  const { data: bills, isLoading } = useQuery({
    queryKey: ["bill-history", branchFilter, startDate, endDate],
    queryFn: () => {
      const params: {
        branch_id?: number;
        start_date?: string;
        end_date?: string;
      } = {};

      if (branchFilter) {
        params.branch_id = branchFilter;
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      return quickBillApi.getHistory(params);
    },
  });

  const branchOptions = useMemo(() => {
    return (
      branches
        ?.filter((branch) => branch.status === "active" || !branch.status)
        ?.map((branch) => ({
          value: branch.branch_id,
          label: branch.name,
        })) || []
    );
  }, [branches]);

  // Fetch all bills for super admin to calculate branch statistics
  const { data: allBillsForStats } = useQuery({
    queryKey: ["bill-history-all"],
    queryFn: () => quickBillApi.getHistory(),
    enabled: isSuperAdmin,
  });

  // Get unique branches from all bills data for super admin
  const uniqueBranches = useMemo(() => {
    if (!allBillsForStats || !isSuperAdmin) return [];
    const branchMap = new Map<
      number,
      { branch_id: number; name: string; billCount: number; totalValue: number }
    >();

    allBillsForStats.forEach((bill) => {
      if (
        bill.Branches &&
        bill.total_amount != null &&
        !isNaN(bill.total_amount)
      ) {
        const branchId = bill.Branches.branch_id;
        const billAmount = Number(bill.total_amount) || 0;

        if (branchMap.has(branchId)) {
          const existing = branchMap.get(branchId)!;
          existing.billCount += 1;
          existing.totalValue += billAmount;
        } else {
          branchMap.set(branchId, {
            branch_id: branchId,
            name: bill.Branches.name,
            billCount: 1,
            totalValue: billAmount,
          });
        }
      }
    });

    return Array.from(branchMap.values());
  }, [allBillsForStats, isSuperAdmin]);

  const columns: TableColumn<QuickBillHistoryItem>[] = [
    {
      key: "bill_id",
      header: "Bill ID",
    },
    {
      key: "customer_name",
      header: "Customer",
    },
    {
      key: "Branches",
      header: "Branch",
      render: (value) => value?.name || "-",
    },
    {
      key: "total_amount",
      header: "Total",
      render: (value) => formatCurrency(value),
    },
    {
      key: "created_at",
      header: "Date",
      render: (value) => formatDateTime(value),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <Button size="sm" variant="outline" onClick={() => handleViewBill(row)}>
          View Details
        </Button>
      ),
    },
  ];

  const handleViewBill = (bill: QuickBillHistoryItem) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBill(null);
  };

  const handleClearFilters = () => {
    setBranchFilter(
      user?.branch_id &&
        (user.role === ROLES.BRANCH_ADMIN || user.role === ROLES.USER)
        ? user.branch_id
        : undefined
    );
    setStartDate("");
    setEndDate("");
  };

  if (isLoading) return <Loading />;

  return (
    <div className="bill-history-list">
      <div className="bill-history-list-header">
        <h1>Bill History</h1>
      </div>

      {/* Branch Cards - Only for Super Admin */}
      {isSuperAdmin && (
        <div className="branch-cards-container">
          <div
            className={`branch-card ${
              branchFilter === undefined ? "branch-card-active" : ""
            }`}
            onClick={() => setBranchFilter(undefined)}
          >
            <div className="branch-card-header">
              <h3>All Branches</h3>
            </div>
            <div className="branch-card-stats">
              <div className="branch-card-stat">
                <span className="branch-card-stat-label">Total Bills</span>
                <span className="branch-card-stat-value">
                  {allBillsForStats?.filter(
                    (bill) =>
                      bill.total_amount != null &&
                      !isNaN(Number(bill.total_amount))
                  ).length || 0}
                </span>
              </div>
              <div className="branch-card-stat">
                <span className="branch-card-stat-label">Total Value</span>
                <span className="branch-card-stat-value">
                  {(() => {
                    const total =
                      allBillsForStats?.reduce((sum, bill) => {
                        const amount = Number(bill.total_amount);
                        if (amount == null || isNaN(amount)) return sum;
                        return sum + amount;
                      }, 0) || 0;
                    return isNaN(total)
                      ? formatCurrency(0)
                      : formatCurrency(total);
                  })()}
                </span>
              </div>
            </div>
          </div>

          {uniqueBranches.map((branch) => (
            <div
              key={branch.branch_id}
              className={`branch-card ${
                branchFilter === branch.branch_id ? "branch-card-active" : ""
              }`}
              onClick={() => setBranchFilter(branch.branch_id)}
            >
              <div className="branch-card-header">
                <h3>{branch.name}</h3>
              </div>
              <div className="branch-card-stats">
                <div className="branch-card-stat">
                  <span className="branch-card-stat-label">Bills</span>
                  <span className="branch-card-stat-value">
                    {branch.billCount}
                  </span>
                </div>
                <div className="branch-card-stat">
                  <span className="branch-card-stat-label">Total Value</span>
                  <span className="branch-card-stat-value">
                    {isNaN(branch.totalValue) || branch.totalValue == null
                      ? formatCurrency(0)
                      : formatCurrency(branch.totalValue)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bill-history-filters">
        {isSuperOrKitchenAdmin && !isSuperAdmin && (
          <Select
            label="Branch"
            value={branchFilter?.toString() || ""}
            onChange={(e) =>
              setBranchFilter(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            options={[{ value: "", label: "All Branches" }, ...branchOptions]}
            style={{ minWidth: "200px" }}
          />
        )}
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ minWidth: "150px" }}
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ minWidth: "150px" }}
        />
        <Button
          variant="outline"
          onClick={handleClearFilters}
          style={{ alignSelf: "flex-end" }}
        >
          Clear Filters
        </Button>
      </div>

      <Table
        columns={columns}
        data={bills || []}
        emptyMessage="No bills found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Bill Details - #${selectedBill?.bill_id}`}
        size="lg"
        footer={
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Button variant="outline" onClick={handleCloseModal}>
              Close
            </Button>
          </div>
        }
      >
        {selectedBill && (
          <div className="bill-details">
            <div className="bill-details-section">
              <h3>Bill Information</h3>
              <div className="bill-details-grid">
                <div>
                  <strong>Bill ID:</strong> {selectedBill.bill_id}
                </div>
                <div>
                  <strong>Customer:</strong> {selectedBill.customer_name}
                </div>
                <div>
                  <strong>Branch:</strong> {selectedBill.Branches?.name || "-"}
                </div>
                <div>
                  <strong>Date:</strong>{" "}
                  {formatDateTime(selectedBill.created_at)}
                </div>
                <div>
                  <strong>Created By:</strong> {selectedBill.Users?.name || "-"}
                </div>
                <div>
                  <strong>Status:</strong> {selectedBill.status}
                </div>
              </div>
            </div>

            <div className="bill-details-section">
              <h3>Items</h3>
              <table className="bill-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.OrderItems?.map((item) => (
                    <tr key={item.item_id}>
                      <td>{item.FinishedGoods?.name || "-"}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={3}
                      style={{ textAlign: "right", fontWeight: "bold" }}
                    >
                      Grand Total:
                    </td>
                    <td style={{ fontWeight: "bold" }}>
                      {formatCurrency(selectedBill.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
