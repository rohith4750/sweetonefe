import React from 'react';
import './Table.css';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="table-container">
        <div className="table-loading">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="table-empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`table-header ${column.align ? `table-align-${column.align}` : ''}`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={onRowClick ? 'table-row-clickable' : ''}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => {
                const value = row[column.key];
                return (
                  <td
                    key={column.key}
                    className={column.align ? `table-align-${column.align}` : ''}
                  >
                    {column.render ? column.render(value, row) : value ?? '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

