export interface DailyProductionSummary {
  date: string;
  summary: {
    sweet_name: string;
    quantity_produced: number;
    wastage: number;
    count: number;
  }[];
  total_productions: number;
}

export interface DistributionReport {
  period: {
    start: string;
    end: string;
  };
  distribution: {
    branch_name: string;
    sweets: {
      sweet_name: string;
      quantity_sent: number;
    }[];
  }[];
}

export interface SalesReport {
  period: {
    start: string;
    end: string;
  };
  sales: {
    branch_name: string;
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
  }[];
}

export interface RawMaterialsUsageReport {
  period: {
    start: string;
    end: string;
  };
  usage: {
    material_name: string;
    total_used: number;
    wastage: number;
    production_count: number;
  }[];
}

export interface LowStockAlerts {
  raw_materials: {
    material_id: number;
    name: string;
    current_stock: number;
    reorder_level: number;
  }[];
  finished_goods: {
    sweet_id: number;
    name: string;
    current_stock: number;
    reorder_level: number;
  }[];
}

