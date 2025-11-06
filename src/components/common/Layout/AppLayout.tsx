import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { ToastContainer } from '@/components/common';
import { useUIStore } from '@/store/uiStore';
import './AppLayout.css';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="app-layout">
      <Header />
      <Sidebar />
      <main className={`app-main ${sidebarOpen ? 'app-main-sidebar-open' : 'app-main-sidebar-closed'}`}>
        <div className="app-content">
          {children}
        </div>
        <Footer />
      </main>
      <ToastContainer />
    </div>
  );
};

