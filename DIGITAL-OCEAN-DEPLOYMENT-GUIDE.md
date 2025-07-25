# 🚀 **DIGITAL OCEAN DEPLOYMENT GUIDE - AXIE STUDIO**

## 📁 **YOUR CURRENT FILE STRUCTURE ANALYSIS**

Based on your codebase, here's what we have:

```
📦 Your Project Structure:
├── axie-studio-frontend/          # React frontend with Vite
│   ├── src/                       # Source code
│   │   ├── pages/AdminPage/       # Admin panel (✅ Complete)
│   │   ├── services/              # API services (✅ Complete)
│   │   ├── config/                # Tenant config (✅ Complete)
│   │   └── components/            # UI components (✅ Complete)
│   ├── package.json               # Dependencies (✅ Ready)
│   ├── vite.config.mts           # Vite config (✅ Ready)
│   ├── Dockerfile.axie-studio     # Docker config (✅ Ready)
│   └── nginx.axie-studio.conf     # Nginx config (✅ Ready)
├── langflow-source/               # Langflow backend
│   └── deploy/                    # Deployment configs
└── deploy-simple-multitenant.sh   # Deployment script
```

---

## 🎯 **DIGITAL OCEAN APP PLATFORM DEPLOYMENT**

### **Step 1: GitHub Repository Setup**

#### **1.1 Create GitHub Repository**
```bash
# Initialize git in your project root
cd /path/to/your/project
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Axie Studio multi-tenant platform"

# Create repository on GitHub (via web interface)
# Then add remote and push
git remote add origin https://github.com/yourusername/axie-studio-platform.git
git branch -M main
git push -u origin main
```

#### **1.2 Repository Structure for DO App Platform**
```
📦 GitHub Repository:
├── axie-studio-frontend/          # Frontend app
├── langflow-backend/              # Backend service  
├── docker-compose.yml             # Multi-service config
├── .env.example                   # Environment template
└── README.md                      # Documentation
```

---

## 🐳 **STEP 2: CREATE PRODUCTION DOCKER SETUP**

### **2.1 Create Production Docker Compose**

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-langflow}
      POSTGRES_USER: ${POSTGRES_USER:-langflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-langflow}"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis for caching
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Langflow Backend
  langflow-backend:
    image: langflowai/langflow:latest
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - LANGFLOW_DATABASE_URL=postgresql://${POSTGRES_USER:-langflow}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-langflow}
      - LANGFLOW_REDIS_URL=redis://redis:6379
      - LANGFLOW_CACHE_TYPE=redis
      - LANGFLOW_LOG_LEVEL=INFO
      - LANGFLOW_AUTO_LOGIN=false
      - LANGFLOW_SUPERUSER=${LANGFLOW_SUPERUSER}
      - LANGFLOW_SUPERUSER_PASSWORD=${LANGFLOW_SUPERUSER_PASSWORD}
    ports:
      - "7860:7860"
    volumes:
      - langflow_data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7860/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Axie Studio Frontend
  axie-studio-frontend:
    build:
      context: ./axie-studio-frontend
      dockerfile: Dockerfile.axie-studio
    depends_on:
      langflow-backend:
        condition: service_healthy
    environment:
      - LANGFLOW_BACKEND_URL=http://langflow-backend:7860
      - NODE_ENV=production
      - REACT_APP_BACKEND_URL=http://langflow-backend:7860
      - REACT_APP_MULTI_TENANT=true
    ports:
      - "80:80"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  langflow_data:
```

### **2.2 Update Frontend Dockerfile**

Update `axie-studio-frontend/Dockerfile.axie-studio`:

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.axie-studio.conf /etc/nginx/conf.d/default.conf

# Create health check endpoint
RUN echo '#!/bin/sh\necho "healthy"' > /usr/share/nginx/html/health && chmod +x /usr/share/nginx/html/health

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### **2.3 Update Nginx Configuration**

Update `axie-studio-frontend/nginx.axie-studio.conf`:

```nginx
server {
    listen 80;
    server_name _;
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Serve static files
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Multi-tenant headers
        add_header X-Tenant-Domain $host always;
    }
    
    # API proxy to Langflow backend
    location /api/ {
        proxy_pass http://langflow-backend:7860;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-Domain $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSocket support
    location /ws/ {
        proxy_pass http://langflow-backend:7860;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

---

## 🌐 **STEP 3: DIGITAL OCEAN APP PLATFORM SETUP**

### **3.1 Create App Platform Application**

1. **Login to Digital Ocean**
   - Go to https://cloud.digitalocean.com
   - Navigate to "Apps" section
   - Click "Create App"

2. **Connect GitHub Repository**
   - Choose "GitHub" as source
   - Authorize Digital Ocean to access your repository
   - Select your `axie-studio-platform` repository
   - Choose `main` branch
   - Enable "Autodeploy" for automatic deployments

### **3.2 Configure App Components**

#### **Component 1: Database (PostgreSQL)**
```yaml
Name: axie-studio-db
Type: Database
Engine: PostgreSQL
Version: 15
Size: Basic ($15/month)
```

#### **Component 2: Backend Service**
```yaml
Name: langflow-backend
Type: Service
Source: Docker Hub
Image: langflowai/langflow:latest
HTTP Port: 7860
Instance Count: 1
Instance Size: Basic ($12/month)

Environment Variables:
- LANGFLOW_DATABASE_URL=${axie-studio-db.DATABASE_URL}
- LANGFLOW_CACHE_TYPE=memory
- LANGFLOW_LOG_LEVEL=INFO
- LANGFLOW_AUTO_LOGIN=false
- LANGFLOW_SUPERUSER=admin@axiestudio.se
- LANGFLOW_SUPERUSER_PASSWORD=${LANGFLOW_ADMIN_PASSWORD}

Health Check:
- HTTP Path: /health
- Initial Delay: 60s
- Period: 30s
```

#### **Component 3: Frontend Service**
```yaml
Name: axie-studio-frontend
Type: Service
Source: GitHub Repository
Source Directory: /axie-studio-frontend
Dockerfile Path: /axie-studio-frontend/Dockerfile.axie-studio
HTTP Port: 80
Instance Count: 1
Instance Size: Basic ($12/month)

Environment Variables:
- LANGFLOW_BACKEND_URL=http://langflow-backend:7860
- NODE_ENV=production
- REACT_APP_BACKEND_URL=https://your-app-name.ondigitalocean.app
- REACT_APP_MULTI_TENANT=true

Health Check:
- HTTP Path: /health
- Initial Delay: 30s
- Period: 30s
```

### **3.3 Configure Environment Variables**

In the App Platform dashboard, add these environment variables:

```bash
# Database (Auto-generated by DO)
DATABASE_URL=postgresql://user:pass@host:port/db

# Langflow Configuration
LANGFLOW_ADMIN_PASSWORD=your-secure-admin-password
LANGFLOW_SUPERUSER=admin@axiestudio.se

# Frontend Configuration
REACT_APP_BACKEND_URL=https://your-app-name.ondigitalocean.app
REACT_APP_MULTI_TENANT=true
REACT_APP_CONTACT_EMAIL=stefan@axiestudio.se

# Multi-tenant Configuration
ENABLE_MULTI_TENANT=true
DEFAULT_DOMAIN=axiestudio.com
```

---

## 🔧 **STEP 4: CUSTOM DOMAIN SETUP**

### **4.1 Configure Custom Domain**

1. **In Digital Ocean App Platform:**
   - Go to "Settings" → "Domains"
   - Add your domain: `axiestudio.com`
   - Add wildcard subdomain: `*.axiestudio.com`

2. **DNS Configuration:**
   ```
   Type: CNAME
   Name: @
   Value: your-app-name.ondigitalocean.app
   
   Type: CNAME  
   Name: *
   Value: your-app-name.ondigitalocean.app
   ```

### **4.2 SSL Certificate**
Digital Ocean automatically provides SSL certificates for your custom domains.

---

## 📊 **STEP 5: MONITORING & SCALING**

### **5.1 Enable Monitoring**
```yaml
Alerts:
- CPU Usage > 80%
- Memory Usage > 80%
- Response Time > 2s
- Error Rate > 5%

Metrics:
- Request Count
- Response Time
- Error Rate
- Resource Usage
```

### **5.2 Scaling Configuration**
```yaml
Auto-scaling:
- Min Instances: 1
- Max Instances: 3
- CPU Threshold: 70%
- Memory Threshold: 80%
```

---

## 💰 **STEP 6: COST ESTIMATION**

### **Digital Ocean App Platform Costs:**
```
Database (PostgreSQL): $15/month
Backend Service: $12/month
Frontend Service: $12/month
Bandwidth: $0.01/GB

Total: ~$39/month + bandwidth
```

### **Scaling Costs:**
```
With auto-scaling (3 instances max):
Database: $15/month
Backend: $36/month (3x $12)
Frontend: $36/month (3x $12)

Total: ~$87/month + bandwidth
```

---

## 🚀 **STEP 7: DEPLOYMENT PROCESS**

### **7.1 Pre-deployment Checklist**
- [ ] GitHub repository created and pushed
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Health checks configured
- [ ] Custom domain DNS configured

### **7.2 Deploy to Digital Ocean**
1. **Create App Platform application**
2. **Configure all components**
3. **Set environment variables**
4. **Deploy and test**
5. **Configure custom domain**
6. **Test multi-tenant functionality**

### **7.3 Post-deployment Testing**
```bash
# Test main domain
curl -I https://axiestudio.com

# Test subdomain routing
curl -I https://client01.axiestudio.com

# Test API endpoints
curl https://axiestudio.com/api/v1/health

# Test admin panel
curl https://axiestudio.com/admin
```

---

## 🎯 **STEP 8: BUSINESS READY FEATURES**

### **8.1 Multi-tenant Testing**
1. **Access admin panel:** `https://axiestudio.com/admin`
2. **Create mass users:** Use Mass Users tab
3. **Test subdomains:** `https://client01.axiestudio.com`
4. **Test white-label:** Toggle WL ON/OFF
5. **Export credentials:** CSV download

### **8.2 Production Monitoring**
- **Uptime monitoring:** Digital Ocean built-in
- **Performance metrics:** Response time, throughput
- **Error tracking:** Application logs
- **User analytics:** Custom implementation

---

## 🎉 **DEPLOYMENT SUMMARY**

### **What You Get:**
- ✅ **Production-ready Axie Studio** on Digital Ocean
- ✅ **Multi-tenant architecture** with subdomains
- ✅ **Admin-controlled white-label** system
- ✅ **Mass user creation** capability
- ✅ **Automatic scaling** and monitoring
- ✅ **Custom domain support** (*.axiestudio.com)
- ✅ **SSL certificates** automatically managed

### **Business Ready:**
- ✅ **Mass produce users** in admin panel
- ✅ **Sell differentiated packages** (Basic/Premium/Enterprise)
- ✅ **Instant delivery** via email
- ✅ **Professional subdomains** for each customer
- ✅ **Revenue scaling** through tiered pricing

### **Next Steps:**
1. **Push code to GitHub**
2. **Create Digital Ocean App Platform application**
3. **Configure components and environment variables**
4. **Deploy and test**
5. **Start selling your AI platform!**

**Total deployment time: 2-3 hours**
**Monthly cost: ~$39 (scales with usage)**

Your **multi-tenant AI platform business** is ready for Digital Ocean deployment! 🚀💰
