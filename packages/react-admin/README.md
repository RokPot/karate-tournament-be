# React Admin Panel

A React-based administrative interface built with [React Admin](https://marmelab.com/react-admin/) and [Vite](https://vitejs.dev/).

## Overview

This package provides an admin panel interface for the LossDog application, built using React Admin framework with Material-UI components and TypeScript support.

## Prerequisites

- **Node.js**: Version 18 or higher
- **Yarn**: Version 4.9.1 (as specified in packageManager)

## Installation

1. **Navigate to the react-admin directory:**
   ```bash
   cd lossdog-be/packages/react-admin
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

## Development

### Running the Development Server

To start the development server:

```bash
yarn dev
```

The admin panel will be available at:
- **Local**: `http://localhost:5173/admin/panel`
- **Network**: `http://[your-ip]:5173/admin/panel`

> **Note**: The application is configured with a base path of `/admin/panel`

### Available Scripts

- **`yarn dev`** - Start the development server
- **`yarn build`** - Build the application for production
- **`yarn lint`** - Run ESLint with auto-fix
- **`yarn preview`** - Preview the production build locally

## Project Structure

```
src/
├── app.tsx          # Main app component
├── main.tsx         # Application entry point
├── common/          # Shared utilities and components
├── plugins/         # Admin panel plugins
└── vite-env.d.ts   # Vite environment types
```
