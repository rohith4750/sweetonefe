import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { getMenuItemsForRole } from "@/utils/menu";
import "./Sidebar.css";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  if (!user) return null;

  const filteredMenuItems = getMenuItemsForRole(user.role);

  // Don't render sidebar if no menu items are available
  if (filteredMenuItems.length === 0) {
    return null;
  }

  return (
    <aside
      className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
    >
      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${
                isActive ? "sidebar-item-active" : ""
              }`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {sidebarOpen && (
                <span className="sidebar-label">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
