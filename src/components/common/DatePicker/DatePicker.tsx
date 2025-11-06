import React from 'react';
import { Input, InputProps } from '../Input/Input';
import './DatePicker.css';

export interface DatePickerProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  ...inputProps
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <Input
      {...inputProps}
      type="date"
      value={value}
      onChange={handleChange}
    />
  );
};

