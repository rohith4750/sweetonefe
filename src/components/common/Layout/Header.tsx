import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { getInitials } from "@/utils/formatters";
import "./Header.css";

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-menu-button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <div className="header-logo-title">
          <img
            src="/assets/image.png"
            alt="Sweetone Logo"
            className="header-logo"
          />
          {/* <h1 className="header-title">Sweetone Management System</h1>/ */}
        </div>
      </div>
      <div className="header-right">
        {user && (
          <div className="header-user">
            <Link to="/profile" className="header-user-link">
              <div className="header-user-avatar">{getInitials(user.name)}</div>
              <div className="header-user-info">
                <span className="header-user-name">{user.name}</span>
                <span className="header-user-role">
                  {user.role.replace("_", " ")}
                </span>
              </div>
            </Link>
            <button
              className="header-logout-button"
              onClick={logout}
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
