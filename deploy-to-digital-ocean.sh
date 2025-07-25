#!/bin/bash

# =============================================================================
# AXIE STUDIO - DIGITAL OCEAN DEPLOYMENT SCRIPT
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Configuration
GITHUB_REPO_NAME="axie-studio-platform"
DOMAIN="axiestudio.com"
EMAIL="stefan@axiestudio.se"

print_header "🚀 AXIE STUDIO - DIGITAL OCEAN DEPLOYMENT"

echo "This script will:"
echo "• Prepare your code for Digital Ocean App Platform"
echo "• Create production-ready Docker configurations"
echo "• Set up GitHub repository"
echo "• Generate deployment configurations"
echo "• Provide step-by-step Digital Ocean setup guide"
echo ""

read -p "Continue with deployment preparation? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment preparation cancelled."
    exit 1
fi

print_header "📁 Analyzing Current Project Structure"

# Check if we're in the right directory
if [[ ! -d "axie-studio-frontend" ]]; then
    print_error "axie-studio-frontend directory not found!"
    print_info "Please run this script from your project root directory"
    exit 1
fi

print_success "Project structure verified"

# Check for required files
REQUIRED_FILES=(
    "axie-studio-frontend/package.json"
    "axie-studio-frontend/Dockerfile.axie-studio"
    "axie-studio-frontend/nginx.axie-studio.conf"
    "axie-studio-frontend/vite.config.mts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_success "Found: $file"
    else
        print_warning "Missing: $file"
    fi
done

print_header "🔧 Creating Production Configuration Files"

# Create .env.production file
print_info "Creating production environment configuration..."
if [[ ! -f ".env.production" ]]; then
    cp .env.production.example .env.production
    print_success "Created .env.production (please edit with your values)"
else
    print_info ".env.production already exists"
fi

# Create app.yaml for Digital Ocean App Platform
print_info "Creating Digital Ocean App Platform configuration..."
cat > app.yaml << EOF
name: axie-studio-platform
region: nyc1

databases:
- name: axie-studio-db
  engine: PG
  version: "15"
  size: basic
  num_nodes: 1

services:
- name: langflow-backend
  source_dir: /
  github:
    repo: ${GITHUB_USERNAME}/${GITHUB_REPO_NAME}
    branch: main
  dockerfile_path: Dockerfile.langflow
  http_port: 7860
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: LANGFLOW_DATABASE_URL
    scope: RUN_TIME
    value: \${axie-studio-db.DATABASE_URL}
  - key: LANGFLOW_SUPERUSER
    scope: RUN_TIME
    value: admin@axiestudio.se
  - key: LANGFLOW_SUPERUSER_PASSWORD
    scope: RUN_TIME
    type: SECRET
  - key: LANGFLOW_SECRET_KEY
    scope: RUN_TIME
    type: SECRET
  - key: LANGFLOW_JWT_SECRET
    scope: RUN_TIME
    type: SECRET
  - key: LANGFLOW_LOG_LEVEL
    scope: RUN_TIME
    value: INFO
  - key: LANGFLOW_AUTO_LOGIN
    scope: RUN_TIME
    value: "false"
  - key: LANGFLOW_ENABLE_MULTI_USER
    scope: RUN_TIME
    value: "true"
  health_check:
    http_path: /health
    initial_delay_seconds: 60
    period_seconds: 30

- name: axie-studio-frontend
  source_dir: /axie-studio-frontend
  github:
    repo: ${GITHUB_USERNAME}/${GITHUB_REPO_NAME}
    branch: main
  dockerfile_path: Dockerfile.axie-studio
  http_port: 80
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: LANGFLOW_BACKEND_URL
    scope: BUILD_TIME
    value: http://langflow-backend:7860
  - key: NODE_ENV
    scope: BUILD_TIME
    value: production
  - key: REACT_APP_BACKEND_URL
    scope: BUILD_TIME
    value: https://axie-studio-platform.ondigitalocean.app
  - key: REACT_APP_MULTI_TENANT
    scope: BUILD_TIME
    value: "true"
  - key: REACT_APP_DEFAULT_DOMAIN
    scope: BUILD_TIME
    value: axiestudio.com
  - key: REACT_APP_CONTACT_EMAIL
    scope: BUILD_TIME
    value: stefan@axiestudio.se
  health_check:
    http_path: /health
    initial_delay_seconds: 30
    period_seconds: 30
  routes:
  - path: /

domains:
- domain: axiestudio.com
  type: PRIMARY
- domain: "*.axiestudio.com"
  type: ALIAS
EOF

print_success "Created app.yaml for Digital Ocean App Platform"

# Create Dockerfile for Langflow backend
print_info "Creating Langflow backend Dockerfile..."
cat > Dockerfile.langflow << EOF
FROM langflowai/langflow:latest

# Install additional dependencies if needed
RUN pip install --no-cache-dir psycopg2-binary redis

# Set working directory
WORKDIR /app

# Copy any custom configurations
COPY langflow-config/ ./config/ 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \\
  CMD curl -f http://localhost:7860/health || exit 1

# Expose port
EXPOSE 7860

# Start Langflow
CMD ["python", "-m", "langflow", "run", "--host", "0.0.0.0", "--port", "7860"]
EOF

print_success "Created Dockerfile.langflow"

# Update frontend Dockerfile for production
print_info "Updating frontend Dockerfile for production..."
cat > axie-studio-frontend/Dockerfile.axie-studio << EOF
# Multi-stage build for production optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Build arguments
ARG NODE_ENV=production
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_MULTI_TENANT=true
ARG REACT_APP_DEFAULT_DOMAIN=axiestudio.com
ARG REACT_APP_CONTACT_EMAIL=stefan@axiestudio.se

# Set environment variables
ENV NODE_ENV=\$NODE_ENV
ENV REACT_APP_BACKEND_URL=\$REACT_APP_BACKEND_URL
ENV REACT_APP_MULTI_TENANT=\$REACT_APP_MULTI_TENANT
ENV REACT_APP_DEFAULT_DOMAIN=\$REACT_APP_DEFAULT_DOMAIN
ENV REACT_APP_CONTACT_EMAIL=\$REACT_APP_CONTACT_EMAIL

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.axie-studio.conf /etc/nginx/conf.d/default.conf

# Create health check endpoint
RUN echo 'healthy' > /usr/share/nginx/html/health

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

print_success "Updated frontend Dockerfile"

print_header "📝 Creating README and Documentation"

# Create comprehensive README
cat > README.md << EOF
# 🎨 Axie Studio - Multi-Tenant AI Platform

A powerful multi-tenant AI workflow platform built on Langflow with complete white-label capabilities.

## 🚀 Features

- **Multi-Tenant Architecture** - Isolated workspaces for each customer
- **Admin-Controlled White-Label** - Customizable branding per tenant
- **Mass User Creation** - Generate hundreds of accounts instantly
- **Subdomain Routing** - client.axiestudio.com for each customer
- **Custom Domain Support** - ai.clientcompany.com (premium feature)
- **Tiered Pricing** - Basic/Premium/Enterprise packages

## 🏗️ Architecture

\`\`\`
Frontend (React + Vite) → Backend (Langflow) → Database (PostgreSQL)
                ↓
        Multi-Tenant Router
                ↓
    Isolated User Workspaces
\`\`\`

## 💰 Business Model

- **Basic (\$29/month)**: Standard branding, subdomain
- **Premium (\$99/month)**: White-label customization
- **Enterprise (\$299/month)**: Full white-label + custom domain

## 🚀 Digital Ocean Deployment

### Prerequisites
- Digital Ocean account
- GitHub repository
- Custom domain (optional)

### Quick Deploy
1. Fork this repository
2. Create Digital Ocean App Platform application
3. Connect GitHub repository
4. Configure environment variables
5. Deploy!

### Environment Variables
\`\`\`bash
# Database
POSTGRES_PASSWORD=your-secure-password

# Langflow
LANGFLOW_SUPERUSER_PASSWORD=admin-password
LANGFLOW_SECRET_KEY=your-secret-key
LANGFLOW_JWT_SECRET=your-jwt-secret

# Frontend
REACT_APP_BACKEND_URL=https://your-app.ondigitalocean.app
\`\`\`

## 📊 Admin Features

- **Mass User Creation** - Generate 10-100 users at once
- **Tenant Management** - Control white-label features
- **White-Label Toggle** - Enable/disable per tenant
- **CSV Export** - Download user credentials
- **System Monitoring** - Health checks and metrics

## 🎨 White-Label Features

When enabled by admin, users can customize:
- Company logo and name
- Color scheme (primary/secondary)
- Custom footer text
- Hide "Powered by Axie Studio" (enterprise)

## 🔧 Development

\`\`\`bash
# Install dependencies
cd axie-studio-frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build
\`\`\`

## 📈 Scaling

- **Auto-scaling**: 1-3 instances based on load
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session management
- **CDN**: Digital Ocean Spaces (optional)

## 🎯 Business Ready

This platform is designed for immediate revenue generation:
1. Mass create user accounts
2. Export credentials to CSV
3. Sell via your main website
4. Instant delivery to customers
5. Scale to thousands of users

## 📞 Support

- Email: stefan@axiestudio.se
- Documentation: [Deployment Guide](DIGITAL-OCEAN-DEPLOYMENT-GUIDE.md)
- Issues: GitHub Issues

## 📄 License

Proprietary - Axie Studio Platform
EOF

print_success "Created comprehensive README.md"

print_header "🔐 Security Configuration"

# Generate secure secrets
print_info "Generating secure secrets..."
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

cat > .env.secrets.example << EOF
# Generated secure secrets - KEEP THESE SAFE!
LANGFLOW_SECRET_KEY=${SECRET_KEY}
LANGFLOW_JWT_SECRET=${JWT_SECRET}

# Generate a secure admin password
LANGFLOW_SUPERUSER_PASSWORD=$(openssl rand -base64 24)

# Generate a secure database password
POSTGRES_PASSWORD=$(openssl rand -base64 24)
EOF

print_success "Generated secure secrets in .env.secrets.example"

print_header "📦 Git Repository Setup"

# Initialize git if not already done
if [[ ! -d ".git" ]]; then
    print_info "Initializing Git repository..."
    git init
    print_success "Git repository initialized"
else
    print_info "Git repository already exists"
fi

# Create .gitignore
print_info "Creating .gitignore..."
cat > .gitignore << EOF
# Environment files
.env
.env.local
.env.production
.env.secrets

# Dependencies
node_modules/
*/node_modules/

# Build outputs
dist/
build/
*/dist/
*/build/

# Logs
*.log
logs/
*/logs/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*/coverage/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Docker
.dockerignore

# Temporary files
tmp/
temp/
EOF

print_success "Created .gitignore"

# Add all files to git
print_info "Adding files to Git..."
git add .
git commit -m "Initial commit: Axie Studio multi-tenant platform ready for Digital Ocean deployment" || print_info "No changes to commit"

print_success "Files added to Git"

print_header "🎉 Deployment Preparation Complete!"

echo ""
echo "📋 Next Steps for Digital Ocean Deployment:"
echo ""
echo "1. 📤 Push to GitHub:"
echo "   git remote add origin https://github.com/yourusername/${GITHUB_REPO_NAME}.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "2. 🌊 Create Digital Ocean App:"
echo "   • Go to https://cloud.digitalocean.com/apps"
echo "   • Click 'Create App'"
echo "   • Connect your GitHub repository"
echo "   • Use the generated app.yaml configuration"
echo ""
echo "3. 🔧 Configure Environment Variables:"
echo "   • Copy secrets from .env.secrets.example"
echo "   • Set up database connection"
echo "   • Configure domain settings"
echo ""
echo "4. 🚀 Deploy and Test:"
echo "   • Deploy the application"
echo "   • Test multi-tenant functionality"
echo "   • Configure custom domain"
echo ""
echo "📊 Expected Costs:"
echo "   • Database: \$15/month"
echo "   • Backend: \$12/month"
echo "   • Frontend: \$12/month"
echo "   • Total: ~\$39/month"
echo ""
echo "💰 Revenue Potential:"
echo "   • 100 Basic customers: \$2,900/month"
echo "   • 50 Premium customers: \$4,950/month"
echo "   • 10 Enterprise customers: \$2,990/month"
echo "   • Total potential: \$10,840/month"
echo ""
echo "📖 For detailed instructions, see:"
echo "   • DIGITAL-OCEAN-DEPLOYMENT-GUIDE.md"
echo "   • README.md"
echo ""

print_success "Your Axie Studio platform is ready for Digital Ocean deployment!"
print_info "Don't forget to update .env.production with your actual values before deploying"

echo ""
echo "🎯 Quick Deploy Checklist:"
echo "□ Push code to GitHub"
echo "□ Create Digital Ocean App Platform application"
echo "□ Configure environment variables"
echo "□ Set up custom domain DNS"
echo "□ Deploy and test"
echo "□ Create first batch of users"
echo "□ Start generating revenue!"
EOF
