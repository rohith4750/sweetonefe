import React from 'react';
import { Button } from '@/components/common';
import './ReportsDashboard.css';

export const ReportsDashboard: React.FC = () => {
  return (
    <div className="reports-dashboard">
      <div className="reports-dashboard-header">
        <h1>Reports & Analytics</h1>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <h3>Daily Production Report</h3>
          <p>View daily production summary</p>
          <Button>View Report</Button>
        </div>

        <div className="report-card">
          <h3>Distribution Report</h3>
          <p>View distribution per branch</p>
          <Button>View Report</Button>
        </div>

        <div className="report-card">
          <h3>Sales Report</h3>
          <p>View branch sales performance</p>
          <Button>View Report</Button>
        </div>

        <div className="report-card">
          <h3>Raw Materials Usage</h3>
          <p>View raw materials usage report</p>
          <Button>View Report</Button>
        </div>

        <div className="report-card">
          <h3>Low Stock Alerts</h3>
          <p>View low stock alerts</p>
          <Button>View Report</Button>
        </div>
      </div>
    </div>
  );
};

