export interface QuickBillProduct {
  id: number;
  branch_id: number;
  sweet_id: number;
  name: string;
  unit_price: number;
  available_stock: number;
  reorder_level: number;
  last_updated: string;
  is_low_stock: boolean;
  branch_name: string;
}

export interface CreateQuickBillRequest {
  customer_name?: string; // Optional, defaults to "Walk-in Customer"
  items: {
    sweet_id: number;
    quantity: number;
  }[];
}

export interface QuickBillItem {
  item_id: number;
  order_id: number;
  sweet_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  FinishedGoods?: {
    sweet_id: number;
    name: string;
  };
  partial_fulfillment: boolean;
  requested_quantity: number;
}

export interface InsufficientStockItem {
  sweet_id: number;
  sweet_name: string;
  requested_quantity: number;
  available_stock: number;
  shortfall: number;
}

export interface QuickBillWarnings {
  insufficient_stock: InsufficientStockItem[];
  message: string;
}

export interface QuickBillResponse {
  order_id: number;
  branch_id: number;
  customer_name: string;
  status: 'completed';
  total_amount: number;
  created_by: number;
  created_at: string;
  Branches?: {
    branch_id: number;
    name: string;
  };
  Users?: {
    user_id: number;
    name: string;
    email: string;
  };
  OrderItems: QuickBillItem[];
  warnings?: QuickBillWarnings;
}

export interface QuickBillErrorResponse {
  error: string;
  insufficient_stock: InsufficientStockItem[];
  message: string;
}

export interface QuickBillHistoryItem extends QuickBillResponse {
  bill_id: number; // Alias for order_id
  is_quick_bill: true;
}

export type QuickBillHistoryResponse = QuickBillHistoryItem[];

