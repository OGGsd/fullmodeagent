# 🌐 **CUSTOM DOMAIN INFRASTRUCTURE SETUP**

## 🎯 **COMPLETE SOLUTION FOR CLIENT DOMAINS**

This guide shows you how to set up infrastructure that handles both:
- **Subdomains**: `client.axiestudio.com` (easy setup)
- **Custom Domains**: `ai.clientcompany.com` (premium feature)

---

## 🏗️ **INFRASTRUCTURE ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN ROUTING SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  axiestudio.com ──────────┐                                │
│  client1.axiestudio.com ──┤                                │
│  client2.axiestudio.com ──┤──▶ Load Balancer ──▶ App       │
│  ai.techcorp.com ─────────┤    (Nginx/Cloudflare)          │
│  platform.innovate.ai ────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 **NGINX CONFIGURATION**

### **1. Main Nginx Config (`/etc/nginx/sites-available/axiestudio`)**

```nginx
# Main server block for Axie Studio and subdomains
server {
    listen 80;
    listen 443 ssl http2;
    
    # Handle main domain and all subdomains
    server_name axiestudio.com *.axiestudio.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/axiestudio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/axiestudio.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Pass host header to application
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}

# Custom domain handler
server {
    listen 80;
    listen 443 ssl http2;
    
    # This will match any domain not handled above
    server_name _;
    
    # Default SSL certificate (will be replaced by custom ones)
    ssl_certificate /etc/letsencrypt/live/default/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/default/privkey.pem;
    
    # Check if this is a valid custom domain
    location / {
        # Pass to application with custom domain header
        proxy_set_header Host $host;
        proxy_set_header X-Custom-Domain $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔐 **SSL CERTIFICATE AUTOMATION**

### **1. Wildcard Certificate for Subdomains**

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get wildcard certificate for *.axiestudio.com
sudo certbot certonly --manual --preferred-challenges=dns \
  -d axiestudio.com -d *.axiestudio.com

# Add DNS TXT record when prompted:
# _acme-challenge.axiestudio.com TXT "verification-string"
```

### **2. Automatic Custom Domain SSL**

```bash
#!/bin/bash
# auto-ssl.sh - Automatically get SSL for custom domains

DOMAIN=$1
TENANT_ID=$2

if [ -z "$DOMAIN" ] || [ -z "$TENANT_ID" ]; then
    echo "Usage: $0 <domain> <tenant_id>"
    exit 1
fi

echo "Setting up SSL for custom domain: $DOMAIN"

# Get SSL certificate
sudo certbot certonly --nginx -d $DOMAIN --non-interactive --agree-tos \
  --email stefan@axiestudio.se

# Create nginx config for this domain
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    location / {
        proxy_set_header Host $DOMAIN;
        proxy_set_header X-Tenant-ID $TENANT_ID;
        proxy_set_header X-Custom-Domain $DOMAIN;
        proxy_pass http://localhost:3000;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "SSL setup complete for $DOMAIN"
```

---

## 🌐 **DNS SETUP INSTRUCTIONS**

### **For Your Clients (Custom Domains)**

When a client wants to use `ai.theircompany.com`:

1. **They add CNAME record:**
   ```
   Type: CNAME
   Name: ai
   Value: client1.axiestudio.com
   TTL: 300
   ```

2. **You run the SSL script:**
   ```bash
   ./auto-ssl.sh ai.theircompany.com client1
   ```

3. **Domain is live in 5-10 minutes!**

---

## 🚀 **CLOUDFLARE INTEGRATION (RECOMMENDED)**

### **Why Cloudflare?**
- **Automatic SSL** for custom domains
- **DDoS protection**
- **Global CDN**
- **Easy domain management**

### **Setup Process:**

1. **Add axiestudio.com to Cloudflare**
2. **Enable "Orange Cloud" for main domain**
3. **Create CNAME records for custom domains:**
   ```
   ai.techcorp.com → CNAME → client1.axiestudio.com (Orange Cloud)
   platform.innovate.ai → CNAME → client2.axiestudio.com (Orange Cloud)
   ```

### **Cloudflare Worker for Domain Routing:**

```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const hostname = url.hostname
  
  // Route custom domains to appropriate subdomains
  const customDomains = {
    'ai.techcorp.com': 'client1.axiestudio.com',
    'platform.innovate.ai': 'client2.axiestudio.com'
  }
  
  if (customDomains[hostname]) {
    // Rewrite URL to subdomain
    url.hostname = customDomains[hostname]
    
    // Add custom domain header
    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: {
        ...request.headers,
        'X-Custom-Domain': hostname,
        'Host': customDomains[hostname]
      },
      body: request.body
    })
    
    return fetch(modifiedRequest)
  }
  
  // Pass through normal requests
  return fetch(request)
}
```

---

## 💰 **PRICING STRATEGY**

### **Domain Tiers:**

```
🆓 BASIC (Subdomain)
├── client.axiestudio.com
├── Shared SSL certificate
├── Basic support
└── $0/month

💎 PREMIUM (Custom Domain)
├── ai.client.com
├── Dedicated SSL certificate
├── Custom branding
├── Priority support
└── $49/month

🏢 ENTERPRISE (Multiple Domains)
├── Multiple custom domains
├── Wildcard SSL certificates
├── Advanced analytics
├── SLA guarantee
└── $199/month
```

---

## 🔧 **BACKEND INTEGRATION**

### **Domain Detection in Frontend:**

```typescript
// Enhanced tenant detection
export const getCurrentTenant = (): TenantConfig => {
  const hostname = window.location.hostname;
  
  // Check for exact subdomain match
  if (TENANT_CONFIGS[hostname]) {
    return TENANT_CONFIGS[hostname];
  }
  
  // Check for custom domain match
  for (const config of Object.values(TENANT_CONFIGS)) {
    if (config.customDomain === hostname) {
      return config;
    }
  }
  
  return DEFAULT_TENANT;
};
```

### **Middleware for Domain Handling:**

```typescript
// Express middleware for domain routing
app.use((req, res, next) => {
  const hostname = req.get('host');
  const customDomain = req.get('x-custom-domain');
  
  // Determine tenant from domain
  const tenant = getTenantByDomain(customDomain || hostname);
  
  if (tenant) {
    req.tenant = tenant;
    req.tenantId = tenant.id;
  }
  
  next();
});
```

---

## 📊 **MONITORING & ANALYTICS**

### **Domain Health Monitoring:**

```bash
#!/bin/bash
# monitor-domains.sh

DOMAINS=(
  "axiestudio.com"
  "client1.axiestudio.com"
  "ai.techcorp.com"
  "platform.innovate.ai"
)

for domain in "${DOMAINS[@]}"; do
  echo "Checking $domain..."
  
  # Check HTTP status
  status=$(curl -s -o /dev/null -w "%{http_code}" https://$domain)
  
  # Check SSL expiry
  expiry=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
  
  echo "$domain: HTTP $status, SSL expires: $expiry"
done
```

---

## 🎯 **CLIENT ONBOARDING PROCESS**

### **For Custom Domain Setup:**

1. **Client purchases premium plan**
2. **You create tenant in admin panel**
3. **System generates DNS instructions**
4. **Client adds CNAME record**
5. **You run SSL automation script**
6. **Domain is live with their branding!**

### **Automated Email Template:**

```
Subject: Your Custom Domain Setup - Action Required

Hi [CLIENT_NAME],

Your Axie Studio premium account is ready! To complete setup of your custom domain (ai.yourcompany.com), please:

1. Log in to your domain registrar
2. Add this CNAME record:
   Name: ai
   Value: [TENANT_SUBDOMAIN].axiestudio.com
   TTL: 300

3. Reply to confirm when done

We'll handle SSL certificates and final setup automatically.

Your branded AI platform will be live within 10 minutes!

Best regards,
Stefan @ Axie Studio
```

---

## 🎉 **BUSINESS IMPACT**

### **Revenue Opportunities:**
- **Basic tenants**: $0/month (lead generation)
- **Premium tenants**: $49/month (custom domain)
- **Enterprise tenants**: $199/month (multiple domains)

### **Competitive Advantages:**
- ✅ **5-minute setup** vs. weeks of development
- ✅ **Automatic SSL** vs. manual certificate management
- ✅ **Global CDN** vs. single server
- ✅ **Professional appearance** vs. generic subdomains

### **Scaling Potential:**
- **100 premium tenants** = $4,900/month = $58,800/year
- **Minimal infrastructure costs** (Cloudflare handles most complexity)
- **High profit margins** (90%+ after setup)

---

## 🚀 **DEPLOYMENT CHECKLIST**

- [ ] Set up wildcard SSL for *.axiestudio.com
- [ ] Configure Nginx for domain routing
- [ ] Create SSL automation scripts
- [ ] Set up Cloudflare (optional but recommended)
- [ ] Test subdomain routing
- [ ] Test custom domain setup
- [ ] Create client onboarding process
- [ ] Set up domain monitoring
- [ ] Update pricing page with domain options
- [ ] Launch premium tier with custom domains

**Your multi-tenant platform with custom domain support is ready to generate serious revenue!** 🚀💰
