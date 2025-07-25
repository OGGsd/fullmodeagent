# Axie Studio - Rebranded Langflow Frontend

Axie Studio is a rebranded version of Langflow with a custom frontend that connects to the Langflow backend. This setup allows you to have your own branded AI flow builder while leveraging the powerful Langflow engine.

## Features

- ✨ **Complete Rebranding**: All "Langflow" references replaced with "Axie Studio"
- 🔐 **Environment-based User Management**: No signup required - users managed via environment variables
- 🎨 **Custom Logo and Branding**: Axie Studio visual identity
- 🔄 **API Proxy Layer**: Seamless integration with Langflow backend
- 🐳 **Docker Deployment**: Easy deployment on Digital Ocean or any Docker host
- 🚫 **No Signup Flow**: Login-only authentication system

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Digital Ocean droplet (or any Linux server)
- Domain name (optional, for SSL)

### 1. Clone and Setup

```bash
git clone <your-repo>
cd axie-studio
```

### 2. Configure Environment

```bash
cp axie-studio-frontend/.env.example .env
nano .env  # Edit with your configuration
```

### 3. Deploy

```bash
./deploy-axie-studio.sh
```

## Environment Configuration

### User Management

Configure users via environment variables in `.env`:

```bash
# Superuser (admin)
AXIE_STUDIO_SUPERUSER=admin
AXIE_STUDIO_SUPERUSER_PASSWORD=your-secure-password

# Additional users (format: username:password:role,username:password:role)
AXIE_STUDIO_USERS=user1:pass1:user,user2:pass2:user,manager:pass3:superuser
```

### Backend Configuration

```bash
# Langflow backend URL
LANGFLOW_BACKEND_URL=http://localhost:7860

# Token expiration
ACCESS_TOKEN_EXPIRE_SECONDS=3600
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │───▶│  Axie Studio     │───▶│   Langflow      │
│                 │    │  Frontend        │    │   Backend       │
│                 │    │  (Port 80)       │    │   (Port 7860)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

- **Frontend**: Custom Axie Studio interface (React/TypeScript)
- **Backend**: Original Langflow API and engine
- **Proxy**: Nginx routes API calls from frontend to backend

## User Roles

- **superuser**: Full admin access, can manage all flows and users
- **user**: Standard user access, can create and manage own flows

## Deployment Options

### Digital Ocean Droplet

1. Create a new droplet (Ubuntu 20.04+, 2GB RAM minimum)
2. SSH into your droplet
3. Install Docker and Docker Compose
4. Clone this repository
5. Run the deployment script

### Custom Server

The Docker Compose setup works on any Linux server with Docker installed.

## SSL/HTTPS Setup

For production, enable SSL by:

1. Uncomment the `nginx-proxy` service in `docker-compose.axie-studio.yml`
2. Add your SSL certificates to `nginx/ssl/`
3. Update the nginx configuration

## Customization

### Branding

- Logo: `axie-studio-frontend/src/assets/AxieStudioLogo.svg`
- Colors: Update CSS variables in theme files
- Title: Change in `axie-studio-frontend/index.html`

### API Endpoints

Modify `axie-studio-frontend/src/config/api-proxy.ts` to customize API routing.

## Troubleshooting

### Check Service Status

```bash
docker-compose -f docker-compose.axie-studio.yml ps
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.axie-studio.yml logs -f

# Specific service
docker-compose -f docker-compose.axie-studio.yml logs -f axie-studio-frontend
```

### Restart Services

```bash
docker-compose -f docker-compose.axie-studio.yml restart
```

## Security Considerations

1. **Change Default Passwords**: Always change default credentials in production
2. **Use HTTPS**: Set up SSL certificates for secure communication
3. **Firewall**: Configure firewall to only allow necessary ports
4. **Regular Updates**: Keep Docker images updated
5. **Backup**: Set up regular backups of your data

## Support

For issues related to:
- **Frontend/Branding**: Check the Axie Studio frontend code
- **Backend/API**: Refer to Langflow documentation
- **Deployment**: Check Docker and nginx logs

## License

This project maintains the same license as the original Langflow project.
