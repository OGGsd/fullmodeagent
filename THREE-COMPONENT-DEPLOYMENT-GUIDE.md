# 🚀 **THREE-COMPONENT DEPLOYMENT GUIDE**

## 🎯 **ARCHITECTURE OVERVIEW**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   LANGFLOW      │
│   (Vercel)      │◄──►│ (Digital Ocean) │◄──►│ (Digital Ocean) │
│                 │    │                 │    │                 │
│ • React + Vite  │    │ • FastAPI       │    │ • Existing      │
│ • Admin Panel   │    │ • Multi-tenant  │    │ • AI Workflows  │
│ • White-label   │    │ • User Mgmt     │    │ • Keep as-is    │
│ • Global CDN    │    │ • Database      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📋 **COMPONENT BREAKDOWN**

### **1. 🎨 FRONTEND - VERCEL**
- **Repository**: Your current frontend code
- **Platform**: Vercel (Global CDN, Edge Functions)
- **Domain**: `axiestudio.com` + `*.axiestudio.com`
- **Cost**: $20/month (Pro plan recommended)

### **2. 🔧 BACKEND - DIGITAL OCEAN APP PLATFORM**
- **Repository**: `https://github.com/OGGsd/agent-platform.git`
- **Platform**: Digital Ocean App Platform
- **Domain**: `api.axiestudio.com`
- **Cost**: $27/month (API + Database)

### **3. 🤖 LANGFLOW - EXISTING DIGITAL OCEAN**
- **Repository**: Keep current setup
- **Platform**: Your existing Digital Ocean instance
- **Domain**: Your current Langflow URL
- **Cost**: Current cost (unchanged)

---

## 🚀 **DEPLOYMENT PROCESS**

### **STEP 1: BACKEND DEPLOYMENT (30 minutes)**

#### **1.1 Update Your Backend Repository**

```bash
# Clone your existing repo
git clone https://github.com/OGGsd/agent-platform.git
cd agent-platform

# Add the backend files (from backend-digital-ocean-config.md)
# - app.yaml
# - Dockerfile  
# - main.py
# - requirements.txt
# - .env.example

# Commit and push
git add .
git commit -m "Add Axie Studio multi-tenant backend API"
git push origin main
```

#### **1.2 Deploy to Digital Ocean App Platform**

1. **Go to Digital Ocean App Platform**
   - https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub Repository**
   - Choose "GitHub"
   - Select repository: `OGGsd/agent-platform`
   - Branch: `main`
   - Enable auto-deploy

3. **Use App Spec Configuration**
   - Upload the `app.yaml` file
   - Or manually configure:
     ```yaml
     Database: PostgreSQL 15 ($15/month)
     Service: FastAPI Backend ($12/month)
     ```

4. **Set Environment Variables**
   ```bash
   LANGFLOW_URL=https://your-existing-langflow.ondigitalocean.app
   SECRET_KEY=your-generated-secret-key
   JWT_SECRET=your-generated-jwt-secret
   ADMIN_EMAIL=stefan@axiestudio.se
   ADMIN_PASSWORD=your-secure-password
   ALLOWED_ORIGINS=https://axiestudio.vercel.app,https://axiestudio.com
   ```

5. **Deploy and Test**
   - Deploy the application
   - Test health endpoint: `https://your-backend.ondigitalocean.app/health`

### **STEP 2: FRONTEND DEPLOYMENT (15 minutes)**

#### **2.1 Prepare Frontend for Vercel**

```bash
# In your frontend directory
cd axie-studio-frontend

# Copy Vercel configuration
cp vite.config.vercel.mts vite.config.mts

# Update package.json build script if needed
npm run build  # Test build locally
```

#### **2.2 Deploy to Vercel**

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Set root directory: `axie-studio-frontend`

3. **Configure Environment Variables**
   ```bash
   VITE_BACKEND_URL=https://your-backend.ondigitalocean.app
   VITE_LANGFLOW_URL=https://your-existing-langflow.ondigitalocean.app
   VITE_MULTI_TENANT=true
   VITE_DEFAULT_DOMAIN=axiestudio.com
   VITE_CONTACT_EMAIL=stefan@axiestudio.se
   ```

4. **Configure Custom Domain**
   - Add domain: `axiestudio.com`
   - Add wildcard: `*.axiestudio.com`
   - Update DNS:
     ```
     Type: CNAME
     Name: @
     Value: cname.vercel-dns.com
     
     Type: CNAME
     Name: *
     Value: cname.vercel-dns.com
     ```

### **STEP 3: CONNECT TO EXISTING LANGFLOW (5 minutes)**

#### **3.1 Get Your Langflow Details**

```bash
# Find your existing Langflow instance
# Note down:
# - URL: https://your-langflow.ondigitalocean.app
# - API Key (if configured)
# - Any authentication details
```

#### **3.2 Update Backend Configuration**

```bash
# In your backend environment variables
LANGFLOW_URL=https://your-actual-langflow-instance.ondigitalocean.app
LANGFLOW_API_KEY=your-api-key-if-needed
```

#### **3.3 Test Connection**

```bash
# Test backend to Langflow connection
curl https://your-backend.ondigitalocean.app/api/v1/langflow/health

# Test frontend to backend connection  
curl https://axiestudio.vercel.app/api/health
```

---

## 🔗 **INTEGRATION TESTING**

### **Test Complete Flow:**

1. **Frontend → Backend**
   ```bash
   # Test API connection
   curl https://axiestudio.vercel.app/api/v1/users
   ```

2. **Backend → Langflow**
   ```bash
   # Test Langflow proxy
   curl https://your-backend.ondigitalocean.app/api/v1/langflow/health
   ```

3. **Multi-tenant Routing**
   ```bash
   # Test subdomain routing
   curl https://client01.axiestudio.com
   ```

4. **Admin Panel**
   ```bash
   # Test admin access
   https://axiestudio.com/admin
   ```

---

## 💰 **COST BREAKDOWN**

### **Monthly Costs:**

```
🎨 FRONTEND (Vercel)
├── Hobby: $0/month (limited)
├── Pro: $20/month (recommended)
└── Enterprise: $40/month (high traffic)

🔧 BACKEND (Digital Ocean)
├── Database: $15/month
├── API Service: $12/month
└── Total: $27/month

🤖 LANGFLOW (Existing)
├── Current cost: $X/month
└── No change needed

💰 TOTAL MONTHLY COST
├── Vercel Pro: $20/month
├── DO Backend: $27/month
├── Existing Langflow: $X/month
└── Total: $47/month + existing Langflow
```

### **Revenue Potential:**
```
100 customers × $29/month = $2,900/month
Infrastructure cost: $47/month
Profit margin: 98.4%
```

---

## 🎯 **ADVANTAGES OF THREE-COMPONENT ARCHITECTURE**

### **✅ Benefits:**

1. **Separation of Concerns**
   - Frontend: UI/UX optimization
   - Backend: Business logic & data
   - Langflow: AI processing

2. **Independent Scaling**
   - Scale frontend globally (Vercel CDN)
   - Scale backend regionally (Digital Ocean)
   - Keep Langflow stable (existing setup)

3. **Technology Optimization**
   - Vercel: Best for React/static sites
   - Digital Ocean: Great for APIs/databases
   - Langflow: Specialized AI platform

4. **Cost Efficiency**
   - Pay only for what you need
   - Vercel handles CDN/edge functions
   - Digital Ocean handles heavy processing

5. **Reliability**
   - Multiple providers = reduced single point of failure
   - Vercel 99.99% uptime SLA
   - Digital Ocean 99.95% uptime SLA

---

## 🔧 **CONFIGURATION FILES SUMMARY**

### **Files Created:**
- ✅ `vercel.json` - Vercel deployment config
- ✅ `vite.config.vercel.mts` - Vercel-optimized Vite config
- ✅ `backend-digital-ocean-config.md` - Complete backend setup
- ✅ `app.yaml` - Digital Ocean App Platform config
- ✅ `Dockerfile` - Backend containerization
- ✅ `main.py` - FastAPI backend application
- ✅ `requirements.txt` - Python dependencies

### **Environment Variables:**
- ✅ Frontend (Vercel) - 5 variables
- ✅ Backend (Digital Ocean) - 8 variables
- ✅ Langflow (Existing) - No changes needed

---

## 🎉 **DEPLOYMENT CHECKLIST**

### **Pre-deployment:**
- [ ] Backend repo updated with new files
- [ ] Frontend Vercel configuration ready
- [ ] Environment variables prepared
- [ ] Domain DNS ready to update

### **Deployment:**
- [ ] Backend deployed to Digital Ocean App Platform
- [ ] Frontend deployed to Vercel
- [ ] Custom domains configured
- [ ] SSL certificates active

### **Testing:**
- [ ] Health checks passing
- [ ] API connections working
- [ ] Multi-tenant routing functional
- [ ] Admin panel accessible
- [ ] White-label features working

### **Business Ready:**
- [ ] Mass user creation tested
- [ ] CSV export working
- [ ] Email templates ready
- [ ] Pricing tiers configured

---

## 🚀 **READY TO DEPLOY**

### **Total Deployment Time: ~50 minutes**
- Backend setup: 30 minutes
- Frontend setup: 15 minutes  
- Integration testing: 5 minutes

### **Business Launch: Same Day**
- Deploy → Test → Create Users → Start Selling

### **Expected Results:**
- ✅ **Global frontend** via Vercel CDN
- ✅ **Reliable backend** on Digital Ocean
- ✅ **Existing Langflow** unchanged
- ✅ **Multi-tenant system** fully functional
- ✅ **Admin controls** for white-label
- ✅ **Mass user creation** ready
- ✅ **Revenue generation** immediate

**Your three-component Axie Studio platform is ready for deployment!** 🎨💰

This architecture gives you the best performance, reliability, and cost efficiency while keeping your existing Langflow instance unchanged.

**Ready to start with the backend deployment?** 🚀
