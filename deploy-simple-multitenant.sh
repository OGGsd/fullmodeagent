#!/bin/bash

# Simple Multi-Tenant Axie Studio Deployment
# Focus: Mass user creation + subdomain routing + "Contact Us" for custom domains

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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
DOMAIN="axiestudio.com"
EMAIL="stefan@axiestudio.se"
APP_PORT="3000"
BACKEND_PORT="7860"

print_header "🚀 SIMPLE MULTI-TENANT DEPLOYMENT"

echo "This deployment focuses on:"
echo "• Mass user creation in admin panel"
echo "• Subdomain routing (*.axiestudio.com)"
echo "• 'Contact Us' for custom domains"
echo "• No payment integration (admin-managed)"
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
sudo apt install -y nginx certbot python3-certbot-nginx docker.io docker-compose curl

# Start services
sudo systemctl start nginx docker
sudo systemctl enable nginx docker

print_success "Dependencies installed"

print_header "🐳 Setting Up Docker Environment"

# Create simplified docker-compose
cat > docker-compose.simple.yml << EOF
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
      - REACT_APP_CONTACT_EMAIL=${EMAIL}
    volumes:
      - ./axie-studio-frontend:/app
      - /app/node_modules
    depends_on:
      - langflow-backend
    restart: unless-stopped
    networks:
      - axiestudio-network

volumes:
  langflow_data:
  langflow_logs:

networks:
  axiestudio-network:
    driver: bridge
EOF

print_info "Starting Docker containers..."
docker-compose -f docker-compose.simple.yml up -d

print_success "Docker environment ready"

print_header "🌐 Configuring Nginx for Subdomains"

# Create nginx configuration for subdomain routing
sudo tee /etc/nginx/sites-available/axiestudio-simple << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ${DOMAIN} *.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

# Main server for axiestudio.com and all subdomains
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
    
    # Pass tenant information to application
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
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/axiestudio-simple /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

print_success "Nginx configured for subdomain routing"

print_header "🔐 Setting Up SSL Certificate"

print_info "Getting wildcard SSL certificate for *.${DOMAIN}..."
print_info "You'll need to add a DNS TXT record when prompted"

# Get wildcard SSL certificate
sudo certbot certonly --manual --preferred-challenges=dns \
    -d ${DOMAIN} -d *.${DOMAIN} \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email

# Reload nginx with SSL
sudo systemctl reload nginx

print_success "SSL certificate configured"

print_header "🛠️ Creating Management Scripts"

# Create subdomain test script
sudo tee /usr/local/bin/test-subdomain << 'EOF'
#!/bin/bash

SUBDOMAIN=$1

if [ -z "$SUBDOMAIN" ]; then
    echo "Usage: $0 <subdomain>"
    echo "Example: $0 client01"
    exit 1
fi

FULL_DOMAIN="${SUBDOMAIN}.axiestudio.com"

echo "Testing subdomain: $FULL_DOMAIN"

# Test HTTP status
echo -n "HTTP Status: "
status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$FULL_DOMAIN 2>/dev/null)
if [ "$status" = "200" ]; then
    echo "✅ OK ($status)"
else
    echo "❌ FAILED ($status)"
fi

# Test SSL
echo -n "SSL Status: "
if echo | timeout 10 openssl s_client -servername $FULL_DOMAIN -connect $FULL_DOMAIN:443 >/dev/null 2>&1; then
    echo "✅ Valid SSL"
else
    echo "❌ SSL Issue"
fi

echo "🌐 Test URL: https://$FULL_DOMAIN"
EOF

sudo chmod +x /usr/local/bin/test-subdomain

# Create monitoring script
sudo tee /usr/local/bin/monitor-subdomains << 'EOF'
#!/bin/bash

echo "🔍 Subdomain Health Check - $(date)"
echo "================================"

# Test main domain
echo -n "axiestudio.com: "
status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://axiestudio.com 2>/dev/null)
if [ "$status" = "200" ]; then
    echo "✅ OK"
else
    echo "❌ FAILED ($status)"
fi

# Test some example subdomains
SUBDOMAINS=("client01" "client02" "test")

for subdomain in "${SUBDOMAINS[@]}"; do
    echo -n "${subdomain}.axiestudio.com: "
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://${subdomain}.axiestudio.com 2>/dev/null)
    if [ "$status" = "200" ]; then
        echo "✅ OK"
    else
        echo "❌ FAILED ($status)"
    fi
done
EOF

sudo chmod +x /usr/local/bin/monitor-subdomains

print_success "Management scripts created"

print_header "🧪 Testing Deployment"

# Wait for services
print_info "Waiting for services to start..."
sleep 30

# Test main application
print_info "Testing main application..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${APP_PORT} | grep -q "200"; then
    print_success "Frontend is responding"
else
    print_info "Frontend may still be starting up"
fi

# Test backend
print_info "Testing backend..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${BACKEND_PORT}/health | grep -q "200"; then
    print_success "Backend is responding"
else
    print_info "Backend may still be starting up"
fi

print_header "📊 Deployment Complete!"

echo "🎉 Simple Multi-Tenant Axie Studio is ready!"
echo ""
echo "📍 Access Points:"
echo "  • Main site: https://${DOMAIN}"
echo "  • Admin panel: https://${DOMAIN}/admin"
echo "  • Any subdomain: https://anything.${DOMAIN}"
echo ""
echo "🔧 Management Commands:"
echo "  • Test subdomain: sudo test-subdomain client01"
echo "  • Monitor health: sudo monitor-subdomains"
echo "  • View logs: docker-compose -f docker-compose.simple.yml logs -f"
echo ""
echo "💼 Your Business Model:"
echo "  1. Mass create users in admin panel"
echo "  2. Each user gets: username@domain + client##.axiestudio.com"
echo "  3. Export CSV with credentials"
echo "  4. Sell pre-configured accounts"
echo "  5. Custom domains = 'Contact Us' button"
echo ""
echo "🚀 Next Steps:"
echo "  1. Access admin panel and create mass users"
echo "  2. Test subdomain routing with generated accounts"
echo "  3. Set up your main website (axiestudio.se) to sell accounts"
echo "  4. Start generating revenue!"

print_success "Ready to mass produce and sell AI accounts!"
EOF
