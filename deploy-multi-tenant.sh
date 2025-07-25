#!/bin/bash

# Multi-Tenant Axie Studio Deployment Script
# Sets up complete infrastructure for subdomains and custom domains

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
DOMAIN="axiestudio.com"
EMAIL="stefan@axiestudio.se"
APP_PORT="3000"
BACKEND_PORT="7860"

print_header "🚀 MULTI-TENANT AXIE STUDIO DEPLOYMENT"

echo "This script will set up:"
echo "• Nginx with domain routing"
echo "• SSL certificates (wildcard + custom domains)"
echo "• Docker containers for frontend and backend"
echo "• Domain management system"
echo "• Multi-tenant configuration"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

print_header "📦 Installing Dependencies"

# Update system
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_info "Installing required packages..."
sudo apt install -y nginx certbot python3-certbot-nginx docker.io docker-compose curl jq

# Start and enable services
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl start docker
sudo systemctl enable docker

print_success "Dependencies installed"

print_header "🐳 Setting Up Docker Environment"

# Create docker-compose for multi-tenant setup
cat > docker-compose.multi-tenant.yml << EOF
version: '3.8'

services:
  # Langflow Backend
  langflow-backend:
    image: langflowai/langflow:latest
    container_name: axiestudio-backend
    ports:
      - "${BACKEND_PORT}:7860"
    environment:
      - LANGFLOW_DATABASE_URL=sqlite:///app/langflow.db
      - LANGFLOW_CACHE_TYPE=memory
      - LANGFLOW_LOG_LEVEL=INFO
    volumes:
      - langflow_data:/app/data
      - langflow_logs:/app/logs
    restart: unless-stopped
    networks:
      - axiestudio-network

  # Axie Studio Frontend
  axiestudio-frontend:
    build: 
      context: ./axie-studio-frontend
      dockerfile: Dockerfile
    container_name: axiestudio-frontend
    ports:
      - "${APP_PORT}:3000"
    environment:
      - NODE_ENV=production
      - REACT_APP_BACKEND_URL=http://langflow-backend:7860
      - REACT_APP_MULTI_TENANT=true
      - REACT_APP_DEFAULT_DOMAIN=${DOMAIN}
    volumes:
      - ./axie-studio-frontend:/app
      - /app/node_modules
    depends_on:
      - langflow-backend
    restart: unless-stopped
    networks:
      - axiestudio-network

  # Redis for session management
  redis:
    image: redis:7-alpine
    container_name: axiestudio-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - axiestudio-network

volumes:
  langflow_data:
  langflow_logs:
  redis_data:

networks:
  axiestudio-network:
    driver: bridge
EOF

print_info "Starting Docker containers..."
docker-compose -f docker-compose.multi-tenant.yml up -d

print_success "Docker environment ready"

print_header "🌐 Configuring Nginx"

# Create main nginx configuration
sudo tee /etc/nginx/sites-available/axiestudio-multi-tenant << EOF
# Main server block for Axie Studio and subdomains
server {
    listen 80;
    server_name ${DOMAIN} *.${DOMAIN};
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} *.${DOMAIN};
    
    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy settings
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Tenant-Domain \$host;
    
    # Main application
    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# Custom domain handler
server {
    listen 80 default_server;
    server_name _;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2 default_server;
    server_name _;
    
    # Default SSL certificate
    ssl_certificate /etc/letsencrypt/live/default/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/default/privkey.pem;
    
    # Handle custom domains
    location / {
        proxy_set_header Host \$host;
        proxy_set_header X-Custom-Domain \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/axiestudio-multi-tenant /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

print_success "Nginx configured"

print_header "🔐 Setting Up SSL Certificates"

# Get wildcard SSL certificate
print_info "Getting wildcard SSL certificate for *.${DOMAIN}..."
print_warning "You'll need to add a DNS TXT record when prompted"

sudo certbot certonly --manual --preferred-challenges=dns \
    -d ${DOMAIN} -d *.${DOMAIN} \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email

# Create default SSL certificate for custom domains
print_info "Creating default SSL certificate..."
sudo mkdir -p /etc/letsencrypt/live/default
sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /etc/letsencrypt/live/default/
sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem /etc/letsencrypt/live/default/

# Reload nginx with SSL
sudo systemctl reload nginx

print_success "SSL certificates configured"

print_header "🛠️ Creating Management Scripts"

# Create custom domain SSL script
sudo tee /usr/local/bin/setup-custom-domain << 'EOF'
#!/bin/bash

DOMAIN=$1
TENANT_ID=$2

if [ -z "$DOMAIN" ] || [ -z "$TENANT_ID" ]; then
    echo "Usage: $0 <domain> <tenant_id>"
    echo "Example: $0 ai.techcorp.com client1"
    exit 1
fi

echo "Setting up custom domain: $DOMAIN for tenant: $TENANT_ID"

# Get SSL certificate
echo "Getting SSL certificate..."
sudo certbot certonly --nginx -d $DOMAIN --non-interactive --agree-tos \
    --email stefan@axiestudio.se

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained for $DOMAIN"
    
    # Update nginx to use the new certificate
    sudo systemctl reload nginx
    
    echo "✅ Custom domain $DOMAIN is now live!"
    echo "🌐 Test it: https://$DOMAIN"
else
    echo "❌ Failed to get SSL certificate for $DOMAIN"
    exit 1
fi
EOF

sudo chmod +x /usr/local/bin/setup-custom-domain

# Create domain monitoring script
sudo tee /usr/local/bin/monitor-domains << 'EOF'
#!/bin/bash

DOMAINS=(
    "axiestudio.com"
    "client1.axiestudio.com"
    "client2.axiestudio.com"
)

echo "🔍 Domain Health Check - $(date)"
echo "================================"

for domain in "${DOMAINS[@]}"; do
    echo -n "Checking $domain... "
    
    # Check HTTP status
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$domain 2>/dev/null)
    
    if [ "$status" = "200" ]; then
        echo "✅ OK ($status)"
    else
        echo "❌ FAILED ($status)"
    fi
done

echo ""
echo "SSL Certificate Status:"
echo "======================"

for domain in "${DOMAINS[@]}"; do
    echo -n "$domain: "
    expiry=$(echo | timeout 10 openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
    
    if [ -n "$expiry" ]; then
        echo "Expires: $expiry"
    else
        echo "❌ SSL check failed"
    fi
done
EOF

sudo chmod +x /usr/local/bin/monitor-domains

# Create auto-renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet && /usr/bin/systemctl reload nginx" | sudo crontab -

print_success "Management scripts created"

print_header "🧪 Testing Deployment"

# Wait for services to be ready
print_info "Waiting for services to start..."
sleep 30

# Test main domain
print_info "Testing main domain..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${APP_PORT} | grep -q "200"; then
    print_success "Frontend is responding"
else
    print_warning "Frontend may not be ready yet"
fi

# Test backend
print_info "Testing backend..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${BACKEND_PORT}/health | grep -q "200"; then
    print_success "Backend is responding"
else
    print_warning "Backend may not be ready yet"
fi

# Test nginx
print_info "Testing nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
fi

print_header "📊 Deployment Summary"

echo "🎉 Multi-Tenant Axie Studio deployment complete!"
echo ""
echo "📍 Access Points:"
echo "  • Main site: https://${DOMAIN}"
echo "  • Admin panel: https://${DOMAIN}/admin"
echo "  • Backend API: https://${DOMAIN}/api"
echo ""
echo "🔧 Management Commands:"
echo "  • Setup custom domain: sudo setup-custom-domain ai.client.com tenant-id"
echo "  • Monitor domains: sudo monitor-domains"
echo "  • View logs: docker-compose -f docker-compose.multi-tenant.yml logs -f"
echo ""
echo "💰 Revenue Opportunities:"
echo "  • Basic (subdomain): \$0/month"
echo "  • Premium (custom domain): \$49/month"
echo "  • Enterprise (multiple domains): \$199/month"
echo ""
echo "🚀 Next Steps:"
echo "  1. Test subdomain routing: https://test.${DOMAIN}"
echo "  2. Create your first tenant in admin panel"
echo "  3. Set up custom domain for premium client"
echo "  4. Launch your multi-tenant business!"

print_success "Deployment completed successfully!"
EOF
