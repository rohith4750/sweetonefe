import React, { useState, useEffect } from 'react';
import { Input } from '../Input/Input';
import './SearchBar.css';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  className = '',
}) => {
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs, onSearch]);

  return (
    <div className={`search-bar ${className}`}>
      <div className="search-bar-wrapper">
        <span className="search-icon">🔍</span>
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="search-bar-input"
        />
      </div>
    </div>
  );
};

