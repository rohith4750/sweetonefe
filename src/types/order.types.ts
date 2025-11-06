export interface OrderItem {
  item_id: number;
  order_id: number;
  sweet_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  FinishedGoods?: {
    sweet_id: number;
    name: string;
    unit_price: number;
    current_stock: number;
    reorder_level: number;
    last_updated: string;
  };
}

export interface Order {
  order_id: number;
  branch_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_location?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  packing_charges?: number;
  advance_paid?: number;
  delivery_date?: string;
  created_by: number;
  created_at: string;
  is_quick_bill?: boolean; // false for regular orders, true for quick bills
  Branches?: {
    branch_id: number;
    name: string;
  };
  Users?: {
    user_id: number;
    name: string;
    email: string;
  };
  OrderItems?: OrderItem[];
}

export interface CreateOrderRequest {
  branch_id?: number;
  customer_name: string;
  customer_phone?: string;
  customer_location?: string;
  packing_charges?: number;
  advance_paid?: number;
  delivery_date?: string;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: {
    sweet_id: number;
    quantity: number;
  }[];
}

export interface UpdateOrderRequest {
  customer_phone?: string;
  customer_location?: string;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
}

export type OrderListResponse = Order[];

