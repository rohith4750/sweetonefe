import apiClient from './client';
import {
  DailyProductionSummary,
  DistributionReport,
  SalesReport,
  RawMaterialsUsageReport,
  LowStockAlerts,
} from '@/types/report.types';

export const reportsApi = {
  getDailyProduction: async (date?: string): Promise<DailyProductionSummary> => {
    const params = date ? { date } : {};
    const response = await apiClient.get<DailyProductionSummary>(
      '/reports/daily-production',
      { params }
    );
    return response.data;
  },

  getDistribution: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<DistributionReport> => {
    const response = await apiClient.get<DistributionReport>(
      '/reports/distribution',
      { params }
    );
    return response.data;
  },

  getSales: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<SalesReport> => {
    const response = await apiClient.get<SalesReport>('/reports/sales', { params });
    return response.data;
  },

  getRawMaterialsUsage: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<RawMaterialsUsageReport> => {
    const response = await apiClient.get<RawMaterialsUsageReport>(
      '/reports/raw-materials-usage',
      { params }
    );
    return response.data;
  },

  getAlerts: async (): Promise<LowStockAlerts> => {
    const response = await apiClient.get<LowStockAlerts>('/reports/alerts');
    return response.data;
  },

  exportPDF: async (params: {
    report_type: string;
    start_date?: string;
    end_date?: string;
    date?: string;
  }): Promise<Blob> => {
    const response = await apiClient.get('/reports/export/pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async (params: {
    report_type: string;
    start_date?: string;
    end_date?: string;
    date?: string;
  }): Promise<Blob> => {
    const response = await apiClient.get('/reports/export/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

