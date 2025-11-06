import React from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import './ConfirmationModal.css';

export interface InfoItem {
  label: string;
  value: string | React.ReactNode;
}

export interface TableColumn {
  key: string;
  header: string;
  render?: (value: any, row?: any) => React.ReactNode;
}

export interface TableRow {
  [key: string]: any;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  isLoading?: boolean;
  infoItems?: InfoItem[];
  tableData?: {
    columns: TableColumn[];
    rows: TableRow[];
    summary?: {
      label: string;
      value: string | React.ReactNode;
    };
  };
  warning?: string | React.ReactNode;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  infoItems,
  tableData,
  warning,
  children,
  size = 'lg',
  closeOnOverlayClick = false,
  closeOnEscape = true,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEscape={closeOnEscape}
      footer={
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="confirmation-modal">
        {infoItems && infoItems.length > 0 && (
          <div className="confirmation-info">
            {infoItems.map((item, index) => (
              <p key={index}>
                <strong>{item.label}:</strong> {item.value}
              </p>
            ))}
          </div>
        )}

        {children && <div className="confirmation-content">{children}</div>}

        {tableData && (
          <div className="confirmation-items">
            <table className="confirmation-items-table">
              <thead>
                <tr>
                  {tableData.columns.map((column) => (
                    <th key={column.key}>{column.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {tableData.columns.map((column) => (
                      <td key={column.key}>
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {tableData.summary && (
                <tfoot>
                  <tr>
                    <td
                      colSpan={tableData.columns.length - 1}
                      style={{ textAlign: 'right', fontWeight: 600 }}
                    >
                      {tableData.summary.label}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                      {tableData.summary.value}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {warning && (
          <div className="confirmation-warning">
            <p>{warning}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

