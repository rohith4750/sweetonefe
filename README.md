# Sweets Management System - Frontend

A comprehensive React-based frontend application for managing a sweets production and distribution business.

## Tech Stack

- **React 18+** with TypeScript
- **Vite** - Build tool
- **Material-UI (MUI)** - UI component library
- **React Router v6** - Routing
- **React Query (TanStack Query)** - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form management and validation

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file with:

```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Sweets Management System
VITE_ENABLE_DEV_TOOLS=true
```

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # Reusable components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── store/         # Zustand stores
├── utils/         # Utility functions
├── types/         # TypeScript types
├── context/       # React contexts
├── routes/         # Route configuration
└── styles/         # Global styles
```

## Features

- User authentication with role-based access control
- Dashboard with role-specific views
- User management (Super Admin only)
- Raw materials management
- Recipes management
- Production tracking
- Finished goods management
- Distribution management
- Branch stock tracking
- Orders management
- Returns management
- Reports and analytics

## User Roles

- **Super Admin**: Full system access
- **Kitchen Admin**: Production, recipes, raw materials, distribution
- **Branch Admin**: Branch-specific operations, orders, returns
- **User**: Basic order creation and viewing

