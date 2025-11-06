import React from 'react';
import './Select.css';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  fullWidth?: boolean;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      fullWidth = false,
      placeholder,
      className = '',
      ...props
    },
    ref
  ) => {
    const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className={`select-wrapper ${fullWidth ? 'select-full-width' : ''}`}>
        {label && (
          <label htmlFor={selectId} className="select-label">
            {label}
            {props.required && <span className="select-required">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`select ${hasError ? 'select-error' : ''} ${className}`.trim()}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <span id={`${selectId}-error`} className="select-error-text" role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={`${selectId}-helper`} className="select-helper-text">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

