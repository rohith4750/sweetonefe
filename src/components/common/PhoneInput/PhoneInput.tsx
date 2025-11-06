import React from 'react';
import { Input, InputProps } from '../Input/Input';
import './PhoneInput.css';

export interface PhoneInputProps extends Omit<InputProps, 'type'> {
  countryCode?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      countryCode = '+91',
      onChange,
      ...inputProps
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove all non-digits
      const inputValue = e.target.value.replace(/\D/g, '');
      
      // Limit to 10 digits for Indian numbers
      const limitedValue = inputValue.slice(0, 10);
      
      // Create a synthetic event with the cleaned value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: limitedValue,
        },
        currentTarget: {
          ...e.currentTarget,
          value: limitedValue,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      
      // Update the input value directly
      if (e.target) {
        e.target.value = limitedValue;
      }
      
      onChange?.(syntheticEvent);
    };

    return (
      <div className="phone-input-wrapper">
        <div className="phone-input-country-code">{countryCode}</div>
        <Input
          {...inputProps}
          ref={ref}
          type="tel"
          onChange={handleChange}
          maxLength={10}
          placeholder="7093592228"
        />
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

