# 🔧 **BACKEND CONFIGURATION FOR DIGITAL OCEAN**

## 📍 **Repository: https://github.com/OGGsd/agent-platform.git**

This configuration will turn your existing repo into the backend API for the Axie Studio multi-tenant system.

---

## 📁 **FILES TO ADD TO YOUR BACKEND REPO**

### **1. Create `app.yaml` for Digital Ocean App Platform**

```yaml
name: agent-platform-backend
region: nyc1

databases:
- name: agent-platform-db
  engine: PG
  version: "15"
  size: basic
  num_nodes: 1

services:
- name: backend-api
  source_dir: /
  github:
    repo: OGGsd/agent-platform
    branch: main
  dockerfile_path: Dockerfile
  http_port: 8000
  instance_count: 1
  instance_size_slug: basic-xxs
  
  envs:
  # Database
  - key: DATABASE_URL
    scope: RUN_TIME
    value: ${agent-platform-db.DATABASE_URL}
  
  # Langflow Connection
  - key: LANGFLOW_URL
    scope: RUN_TIME
    value: "https://langflow-tv34o.ondigitalocean.app"
  - key: LANGFLOW_API_KEY
    scope: RUN_TIME
    type: SECRET
  
  # Multi-tenant Configuration
  - key: ENABLE_MULTI_TENANT
    scope: RUN_TIME
    value: "true"
  - key: DEFAULT_DOMAIN
    scope: RUN_TIME
    value: "axiestudio.com"
  
  # Security
  - key: SECRET_KEY
    scope: RUN_TIME
    type: SECRET
  - key: JWT_SECRET
    scope: RUN_TIME
    type: SECRET
  
  # CORS Configuration
  - key: ALLOWED_ORIGINS
    scope: RUN_TIME
    value: "https://axiestudio.vercel.app,https://axiestudio.com,https://*.axiestudio.com"
  
  # Admin Configuration
  - key: ADMIN_EMAIL
    scope: RUN_TIME
    value: "stefan@axiestudio.se"
  - key: ADMIN_PASSWORD
    scope: RUN_TIME
    type: SECRET
  
  health_check:
    http_path: /health
    initial_delay_seconds: 30
    period_seconds: 30
  
  routes:
  - path: /api
  - path: /health

domains:
- domain: api.axiestudio.com
  type: PRIMARY
```

### **2. Create `Dockerfile` for Backend**

```dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **3. Create `requirements.txt`**

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.13.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
httpx==0.25.2
redis==5.0.1
celery==5.3.4
python-dotenv==1.0.0
cors==1.0.1
```

### **4. Create `main.py` - FastAPI Backend**

```python
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import os
import httpx
import json
from datetime import datetime, timedelta
import jwt
import hashlib

app = FastAPI(
    title="Axie Studio Backend API",
    description="Multi-tenant backend for Axie Studio platform",
    version="1.0.0"
)

# CORS Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
LANGFLOW_URL = os.getenv("LANGFLOW_URL", "https://langflow-tv34o.ondigitalocean.app")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret")

# Security
security = HTTPBearer()

# Models
class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    is_active: bool = True
    is_superuser: bool = False
    tenant_id: Optional[str] = None

class TenantConfig(BaseModel):
    id: str
    name: str
    domain: str
    custom_domain: Optional[str] = None
    white_label_enabled: bool = False
    features: dict = {}

class WhiteLabelCustomization(BaseModel):
    logo: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    company_name: Optional[str] = None
    custom_footer: Optional[str] = None
    hide_axie_branding: bool = False

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Tenant Detection Middleware
def get_tenant_from_domain(host: str = Header(None)) -> str:
    """Extract tenant ID from domain"""
    if not host:
        return "default"
    
    # Handle subdomains (client01.axiestudio.com)
    if ".axiestudio.com" in host:
        subdomain = host.split(".axiestudio.com")[0]
        if subdomain != "axiestudio":
            return subdomain
    
    # Handle custom domains (stored in database)
    # TODO: Query database for custom domain mappings
    
    return "default"

# User Management Endpoints
@app.post("/api/v1/users")
async def create_user(user: User, tenant_id: str = Depends(get_tenant_from_domain)):
    """Create a new user in the tenant"""
    # TODO: Implement user creation with tenant isolation
    user.tenant_id = tenant_id
    return {"message": "User created", "user": user}

@app.get("/api/v1/users")
async def list_users(tenant_id: str = Depends(get_tenant_from_domain)):
    """List users for the current tenant"""
    # TODO: Implement user listing with tenant filtering
    return {"users": [], "tenant_id": tenant_id}

@app.post("/api/v1/users/bulk")
async def create_bulk_users(users: List[User], tenant_id: str = Depends(get_tenant_from_domain)):
    """Create multiple users at once"""
    # TODO: Implement bulk user creation
    for user in users:
        user.tenant_id = tenant_id
    return {"message": f"Created {len(users)} users", "tenant_id": tenant_id}

# Tenant Management Endpoints
@app.get("/api/v1/tenants/{tenant_id}")
async def get_tenant(tenant_id: str):
    """Get tenant configuration"""
    # TODO: Implement tenant retrieval from database
    return {"tenant_id": tenant_id, "config": {}}

@app.put("/api/v1/tenants/{tenant_id}")
async def update_tenant(tenant_id: str, config: TenantConfig):
    """Update tenant configuration"""
    # TODO: Implement tenant update
    return {"message": "Tenant updated", "tenant_id": tenant_id}

@app.patch("/api/v1/admin/tenants/{tenant_id}/white-label")
async def toggle_white_label(tenant_id: str, enabled: bool):
    """Toggle white-label features for tenant"""
    # TODO: Implement white-label toggle
    return {"message": f"White-label {'enabled' if enabled else 'disabled'}", "tenant_id": tenant_id}

# White-Label Customization Endpoints
@app.get("/api/v1/tenants/{tenant_id}/customization")
async def get_customization(tenant_id: str):
    """Get white-label customization for tenant"""
    # TODO: Implement customization retrieval
    return {"customization": {}, "tenant_id": tenant_id}

@app.put("/api/v1/tenants/{tenant_id}/customization")
async def update_customization(tenant_id: str, customization: WhiteLabelCustomization):
    """Update white-label customization"""
    # TODO: Implement customization update
    return {"message": "Customization updated", "tenant_id": tenant_id}

# Langflow Proxy Endpoints
@app.api_route("/api/v1/langflow/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_to_langflow(path: str, request, tenant_id: str = Depends(get_tenant_from_domain)):
    """Proxy requests to Langflow with tenant context"""
    async with httpx.AsyncClient() as client:
        # Add tenant context to headers
        headers = dict(request.headers)
        headers["X-Tenant-ID"] = tenant_id
        
        # Forward request to Langflow
        response = await client.request(
            method=request.method,
            url=f"{LANGFLOW_URL}/api/v1/{path}",
            headers=headers,
            content=await request.body()
        )
        
        return response.json()

# Admin Endpoints
@app.get("/api/v1/admin/stats")
async def get_admin_stats():
    """Get platform statistics"""
    # TODO: Implement admin statistics
    return {
        "total_tenants": 0,
        "total_users": 0,
        "active_users": 0,
        "white_label_enabled": 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### **5. Create `.env.example`**

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/agent_platform

# Langflow Connection
LANGFLOW_URL=https://langflow-tv34o.ondigitalocean.app
LANGFLOW_API_KEY=your-langflow-api-key

# Security
SECRET_KEY=your-secret-key-here-minimum-32-characters
JWT_SECRET=your-jwt-secret-here-minimum-32-characters

# Multi-tenant Configuration
ENABLE_MULTI_TENANT=true
DEFAULT_DOMAIN=axiestudio.com

# CORS Configuration
ALLOWED_ORIGINS=https://axiestudio.vercel.app,https://axiestudio.com,https://*.axiestudio.com

# Admin Configuration
ADMIN_EMAIL=stefan@axiestudio.se
ADMIN_PASSWORD=your-secure-admin-password
```

---

## 🚀 **DEPLOYMENT STEPS**

### **Step 1: Update Your Backend Repo**

1. **Clone your repo:**
   ```bash
   git clone https://github.com/OGGsd/agent-platform.git
   cd agent-platform
   ```

2. **Add the files above to your repo**

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add Axie Studio backend API configuration"
   git push origin main
   ```

### **Step 2: Deploy to Digital Ocean App Platform**

1. **Create new App Platform application**
2. **Connect to your GitHub repo: `OGGsd/agent-platform`**
3. **Use the `app.yaml` configuration above**
4. **Set environment variables**
5. **Deploy!**

### **Step 3: Update Frontend Configuration**

Update your frontend environment variables to point to the new backend:

```bash
VITE_BACKEND_URL=https://agent-platform-backend.ondigitalocean.app
VITE_LANGFLOW_URL=https://your-existing-langflow-instance.ondigitalocean.app
```

---

## 🔗 **ARCHITECTURE FLOW**

```
Vercel Frontend → Digital Ocean Backend → Existing Langflow Instance
     ↓                    ↓                        ↓
Multi-tenant UI    API + User Management    AI Workflow Engine
```

### **API Endpoints:**
- `GET /health` - Health check
- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - List users (tenant-filtered)
- `POST /api/v1/users/bulk` - Mass user creation
- `GET /api/v1/tenants/{id}` - Get tenant config
- `PUT /api/v1/tenants/{id}` - Update tenant
- `PATCH /api/v1/admin/tenants/{id}/white-label` - Toggle white-label
- `GET /api/v1/tenants/{id}/customization` - Get customization
- `PUT /api/v1/tenants/{id}/customization` - Update customization
- `/api/v1/langflow/*` - Proxy to Langflow

---

## 💰 **COST BREAKDOWN**

### **Digital Ocean Backend:**
```
Database: $15/month
Backend API: $12/month
Total: $27/month
```

### **Vercel Frontend:**
```
Hobby Plan: $0/month (with limits)
Pro Plan: $20/month (recommended)
```

### **Existing Langflow:**
```
Current cost: $X/month (unchanged)
```

### **Total Monthly Cost:**
```
Backend: $27/month
Frontend: $20/month
Langflow: $X/month (existing)
Total: $47/month + existing Langflow cost
```

---

## 🎯 **NEXT STEPS**

1. **Add files to your backend repo** (`OGGsd/agent-platform`)
2. **Deploy backend to Digital Ocean App Platform**
3. **Deploy frontend to Vercel**
4. **Connect to your existing Langflow instance**
5. **Test the complete system**
6. **Start mass producing users!**

This architecture gives you the best of all worlds:
- ✅ **Vercel**: Fast, global frontend deployment
- ✅ **Digital Ocean**: Reliable backend API
- ✅ **Existing Langflow**: Keep your current AI setup

**Ready to implement this three-component architecture?** 🚀
