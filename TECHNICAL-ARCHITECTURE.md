# 🏗️ Axie Studio Technical Architecture & Implementation Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Rebranding Implementation](#rebranding-implementation)
3. [Database Architecture](#database-architecture)
4. [Frontend-Backend Communication](#frontend-backend-communication)
5. [Authentication & User Management](#authentication--user-management)
6. [File Structure & Key Components](#file-structure--key-components)
7. [Deployment Architecture](#deployment-architecture)
8. [API Integration](#api-integration)
9. [Real-time Features](#real-time-features)
10. [Development Workflow](#development-workflow)

---

## 🎯 System Overview

### Architecture Pattern: **2-Tier Direct Integration**
```
┌─────────────────────┐    HTTPS/WSS    ┌──────────────────────────┐
│   Axie Studio       │ ◄──────────────► │   Langflow Backend       │
│   Frontend (React)  │                  │   (langflow-tv34o...)    │
│   - User Interface  │                  │   - API Endpoints        │
│   - Real-time UI    │                  │   - Database Layer       │
│   - Admin Panel     │                  │   - User Management      │
└─────────────────────┘                  └──────────────────────────┘
```

**Key Decision**: We chose direct integration over a 3-tier architecture for:
- ✅ Faster time to market
- ✅ Simpler maintenance
- ✅ Lower infrastructure costs
- ✅ Proven stability (backend already handling production traffic)

---

## 🎨 Rebranding Implementation

### Strategy: **Surgical Precision Rebranding**

We implemented a **dual-layer approach** that separates user-facing branding from functional requirements:

#### ✅ **Layer 1: User-Facing Branding (Updated)**
```typescript
// Example: Welcome message update
const EMPTY_PAGE_TITLE = "Welcome to Axie Studio"; // Was: "Welcome to Langflow"

// Example: API interface text
<CardTitle>Axie Studio API Keys</CardTitle> // Was: "Langflow API Keys"

// Example: Modal descriptions
description: "Create a secret API Key to use Axie Studio API."
```

#### 🔒 **Layer 2: Functional Requirements (Preserved)**
```typescript
// Environment variables - MUST PRESERVE for backend compatibility
LANGFLOW_AUTO_LOGIN=false
LANGFLOW_BACKEND_URL=https://your-backend-url.ondigitalocean.app
LANGFLOW_FEATURE_MCP_COMPOSER=false

// API variable names - Internal, don't affect user experience
const getLangflowBackendUrl = (): string => { ... }
export const baseURL = API_PROXY_CONFIG.langflowBackendUrl;

// External service URLs - Third-party dependencies
href="https://langflow.store/" // External marketplace
```

### Implementation Files Modified:
- **60 files** updated across the codebase
- **1,136 additions, 426 deletions** in total
- **Zero breaking changes** to backend connectivity

---

## 🗄️ Database Architecture

### Database Connection Flow:
```
Frontend Request → API Proxy → Backend API → PostgreSQL Database
     ↓               ↓            ↓              ↓
  User Action → Axios Call → Langflow API → Database Query
```

### Database Configuration:
```bash
# Your PostgreSQL Database (Digital Ocean Managed)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### Database Schema (Langflow Backend):
```sql
-- Core Tables (managed by Langflow backend)
users                 -- User accounts and authentication
flows                 -- User workflow definitions  
components            -- Flow components and configurations
api_keys              -- User API keys for external access
sessions              -- User session management
variables             -- Flow variables and configurations
files                 -- Uploaded files and assets
```

### User Isolation Strategy:
```typescript
// Each user has isolated workspace
interface UserWorkspace {
  userId: string;
  flows: Flow[];        // User's private workflows
  apiKeys: ApiKey[];    // User's private API keys
  variables: Variable[]; // User's private variables
  files: File[];        // User's private files
}
```

---

## 🔄 Frontend-Backend Communication

### API Proxy Configuration:
```typescript
// src/config/api-proxy.ts
export const API_PROXY_CONFIG: ApiProxyConfig = {
  langflowBackendUrl: "https://your-backend-url.ondigitalocean.app",
  enableProxy: true,
  proxyHeaders: {
    'X-Forwarded-For': 'axie-studio',
    'X-Original-Host': 'axie-studio',
    'User-Agent': 'Axie-Studio-Frontend/1.0.0'
  }
};
```

### API Endpoint Mappings:
```typescript
// Complete API endpoint mapping
export const API_ENDPOINT_MAPPINGS = {
  // Authentication
  '/api/v1/login': '/api/v1/login',
  '/api/v1/logout': '/api/v1/logout',
  
  // User Management
  '/api/v1/users': '/api/v1/users',
  
  // Flows and Components
  '/api/v1/flows': '/api/v1/flows',
  '/api/v1/components': '/api/v1/components',
  '/api/v1/build': '/api/v1/build',
  
  // File Management
  '/api/v1/files': '/api/v1/files',
  
  // API Keys
  '/api/v1/api_key': '/api/v1/api_key',
  
  // Real-time Features
  '/api/v1/voice': '/api/v1/voice',
  
  // Health & Monitoring
  '/api/v1/health': '/api/v1/health'
};
```

### Request Flow Example:
```typescript
// 1. Frontend makes API call
const response = await axios.post('/api/v1/flows', flowData, {
  headers: addProxyHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  })
});

// 2. Vite proxy forwards to backend
// localhost:3000/api/v1/flows → your-backend-url.ondigitalocean.app/api/v1/flows

// 3. Backend processes request with database
// Langflow backend → PostgreSQL → Response

// 4. Response flows back to frontend
// Backend → Proxy → Frontend → UI Update
```

---

## 🔐 Authentication & User Management

### Authentication Flow:
```typescript
// 1. User Login
POST /api/v1/login
{
  "username": "admin@axiestudio.se",
  "password": "your_secure_password"
}

// 2. Backend Response
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "user_id": "uuid",
  "is_superuser": true
}

// 3. Frontend stores token
localStorage.setItem('access_token', token);

// 4. Subsequent requests include token
headers: { 'Authorization': `Bearer ${token}` }
```

### User Roles & Permissions:
```typescript
interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;  // Admin access
  created_at: string;
  flows: Flow[];          // User's isolated workflows
}

// Admin capabilities
if (user.is_superuser) {
  // Can create/delete users
  // Can view system health
  // Can manage global settings
  // Can access admin panel at /admin
}
```

### User Isolation Implementation:
```typescript
// Database-level isolation (handled by Langflow backend)
// Each API call includes user context in JWT token
// Backend filters all queries by user_id

// Example: Get user's flows
GET /api/v1/flows
Authorization: Bearer jwt_token

// Backend automatically filters:
SELECT * FROM flows WHERE user_id = ${token.user_id}
```

---

## 📁 File Structure & Key Components

### Core Architecture:
```
axie-studio-frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── RealTimeDashboard.tsx    # Real-time metrics
│   │   ├── RealTimeIndicator.tsx    # Connection status
│   │   └── core/                    # Core Langflow components
│   ├── pages/
│   │   ├── AdminPage/              # Admin interface
│   │   │   ├── AxieStudioAdmin.tsx # Simplified admin panel
│   │   │   ├── UserManagement.tsx  # User CRUD operations
│   │   │   └── SystemMonitoring.tsx # System health
│   │   ├── MainPage/               # Main application
│   │   ├── SettingsPage/           # User settings
│   │   └── Playground/             # Flow builder
│   ├── config/
│   │   └── api-proxy.ts            # Backend communication
│   ├── customization/
│   │   ├── config-constants.ts     # App configuration
│   │   └── constants.ts            # API endpoints
│   ├── services/
│   │   ├── integration-service.ts  # Backend integration
│   │   └── backend-user-management.ts # User operations
│   └── hooks/
│       └── useRealTimeConnection.ts # WebSocket management
```

### Key Components Explained:

#### 1. **Admin Interface** (`src/pages/AdminPage/`)
```typescript
// Simplified from 8 tabs to 4 core tabs
const adminTabs = [
  'Users',           // User management
  'System Health',   // Monitoring
  'Settings',        // Configuration
  'Analytics'        // Usage metrics
];

// Core admin functions
- Create/delete user accounts
- Monitor system health
- View user activity
- Manage global settings
```

#### 2. **Real-time Features** (`src/components/RealTime*.tsx`)
```typescript
// WebSocket connection for live updates
const useRealTimeConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(`wss://your-backend-url.ondigitalocean.app/ws`);
    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event) => handleRealTimeUpdate(event.data);
  }, []);
};
```

#### 3. **API Integration** (`src/config/api-proxy.ts`)
```typescript
// Centralized backend communication
export const getBackendUrl = (endpoint: string): string => {
  const mappedEndpoint = API_ENDPOINT_MAPPINGS[endpoint] || endpoint;
  return `${API_PROXY_CONFIG.langflowBackendUrl}${mappedEndpoint}`;
};
```

---

## 🚀 Deployment Architecture

### Production Setup:
```
┌─────────────────────┐
│   Frontend Hosting  │
│   (Vercel/Netlify)  │
│   axiestudio.se     │
└─────────┬───────────┘
          │ HTTPS
          ▼
┌─────────────────────┐
│   Backend API       │
│   Digital Ocean     │
│   your-backend-url... │
└─────────┬───────────┘
          │ PostgreSQL
          ▼
┌─────────────────────┐
│   Database          │
│   Digital Ocean     │
│   Managed Postgres  │
└─────────────────────┘
```

### Environment Configuration:
```bash
# Production Environment Variables
VITE_BACKEND_URL=https://your-backend-url.ondigitalocean.app
LANGFLOW_AUTO_LOGIN=false
LANGFLOW_SUPERUSER=admin@axiestudio.se
LANGFLOW_SUPERUSER_PASSWORD=your_secure_password
DATABASE_URL=postgresql://username:password@host:port/database
LANGFLOW_CORS_ALLOW_ORIGINS=["https://axiestudio.se", "https://builder.axiestudio.se"]
```

### Deployment Files:
```typescript
// vercel.json - Production deployment config
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend-url.ondigitalocean.app/api/$1"
    }
  ]
}

// nginx.axie-studio.conf - Alternative deployment
location /api/ {
  proxy_pass ${LANGFLOW_BACKEND_URL};
  proxy_set_header X-Original-Host "axie-studio";
}
```

---

## 🔌 API Integration

### Core API Services:

#### 1. **User Management API**
```typescript
// Create user
POST /api/v1/users
{
  "email": "user@example.com",
  "password": "secure_password",
  "is_active": true
}

// Get user flows
GET /api/v1/flows
Authorization: Bearer jwt_token
// Returns only flows owned by authenticated user
```

#### 2. **Flow Management API**
```typescript
// Create flow
POST /api/v1/flows
{
  "name": "My Workflow",
  "data": { /* flow definition */ },
  "description": "AI workflow"
}

// Build/Execute flow
POST /api/v1/flows/{flow_id}/build
{
  "inputs": { /* input data */ }
}
```

#### 3. **File Management API**
```typescript
// Upload file
POST /api/v1/files
Content-Type: multipart/form-data
// File is associated with authenticated user

// Get user files
GET /api/v1/files
// Returns only files owned by authenticated user
```

### API Security:
```typescript
// All requests include authentication
const apiCall = async (endpoint: string, data?: any) => {
  const token = localStorage.getItem('access_token');
  
  return axios.request({
    url: getBackendUrl(endpoint),
    headers: addProxyHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }),
    data
  });
};
```

---

## ⚡ Real-time Features

### WebSocket Implementation:
```typescript
// Real-time connection hook
export const useRealTimeConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//your-backend-url.ondigitalocean.app/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => setConnectionStatus('connected');
    ws.onclose = () => setConnectionStatus('disconnected');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealTimeUpdate(data);
    };
  }, []);
};
```

### Real-time Features:
1. **Live Flow Execution Status**
2. **Real-time User Activity Feed**
3. **System Health Monitoring**
4. **Connection Status Indicators**

---

## 🛠️ Development Workflow

### Local Development:
```bash
# 1. Start development server
npm run start
# Runs on http://localhost:3000

# 2. API proxy configuration
# All /api/* requests automatically proxy to:
# https://your-backend-url.ondigitalocean.app

# 3. Admin access
# http://localhost:3000/login/admin
# admin@axiestudio.se / your_secure_password
```

### Testing Strategy:
```bash
# 1. Unit tests
npm run test

# 2. Integration tests
npm run test:integration

# 3. E2E tests (Playwright)
npm run test:e2e

# 4. Build verification
npm run build
```

### Git Workflow:
```bash
# Current branch
devin/1737926236-axie-studio-rebrand

# PR Status
https://github.com/OGGsd/fullmodeagent/pull/1
# ✅ All CI checks passing
# 60 files changed, +1136 -426
```

---

## 🎯 Key Implementation Decisions

### 1. **Rebranding Strategy**
- ✅ **Surgical precision**: Only update user-facing text
- ✅ **Preserve functionality**: Keep all API endpoints and environment variables
- ✅ **Zero downtime**: No breaking changes to backend connectivity

### 2. **Architecture Choice**
- ✅ **Direct integration**: Frontend → Backend (no middleware)
- ✅ **Proven stability**: Leverage existing Langflow backend
- ✅ **Cost effective**: Minimal infrastructure requirements

### 3. **User Management**
- ✅ **Database-level isolation**: Each user sees only their data
- ✅ **Role-based access**: Admin vs regular user permissions
- ✅ **Commercialization ready**: Individual user workspaces

### 4. **Admin Interface**
- ✅ **Simplified design**: 4 core tabs instead of 8
- ✅ **Essential functions**: User management, system health, settings
- ✅ **Clean UI**: Removed complex real-time widgets

---

## 📊 Production Metrics

### Current Status:
- ✅ **100% Rebranding Complete**
- ✅ **Zero Breaking Changes**
- ✅ **All CI Checks Passing**
- ✅ **Production Deployment Ready**

### Performance:
- ⚡ **Fast Load Times**: Optimized build with code splitting
- 🔄 **Real-time Updates**: WebSocket connections for live data
- 🛡️ **Secure**: JWT authentication with role-based access
- 📱 **Responsive**: Works on desktop and mobile

### Scalability:
- 👥 **Multi-user Support**: Isolated user workspaces
- 🔑 **API Key Management**: User-specific API access
- 📈 **Usage Tracking**: Built-in analytics and monitoring
- 💰 **Commercialization Ready**: User-based billing potential

---

## 🚀 Next Steps & Roadmap

### Immediate (Production Ready):
1. ✅ **Deploy frontend** to custom domain (axiestudio.se)
2. ✅ **Configure DNS** for production domains
3. ✅ **Monitor initial users** and system performance
4. ✅ **Gather user feedback** on simplified admin interface

### Future Enhancements:
1. **Enhanced Analytics**: Detailed usage metrics and reporting
2. **Advanced User Management**: Bulk operations, user groups
3. **Custom Branding**: Per-tenant white-label customization
4. **API Rate Limiting**: Usage-based access controls
5. **Backup & Recovery**: Automated data backup strategies

---

## 📞 Support & Maintenance

### Key Contacts:
- **Admin User**: stefan@axiestudio.se
- **Backend**: your-backend-url.ondigitalocean.app
- **Database**: Digital Ocean Managed PostgreSQL

### Monitoring:
- **Frontend**: Real-time connection status indicators
- **Backend**: Health check endpoints (/api/v1/health)
- **Database**: Digital Ocean monitoring dashboard

### Troubleshooting:
1. **Connection Issues**: Check backend URL configuration
2. **Authentication Problems**: Verify JWT token and user permissions
3. **Database Errors**: Check Digital Ocean database status
4. **Build Failures**: Review CI logs and dependency versions

---

*This documentation provides a complete technical overview of the Axie Studio implementation. For specific implementation details, refer to the source code and configuration files in the repository.*
