import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <p className="footer-text">
        © {new Date().getFullYear()} Sweets Management System. All rights reserved.
      </p>
    </footer>
  );
};

