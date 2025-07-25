#!/bin/bash

# Axie Studio Deployment Script for Digital Ocean
# This script sets up and deploys Axie Studio on a Digital Ocean droplet

set -e

echo "🚀 Starting Axie Studio deployment..."

# Configuration
PROJECT_NAME="axie-studio"
COMPOSE_FILE="docker-compose.axie-studio.yml"
ENV_FILE=".env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    print_status "Creating environment file from template..."
    cp axie-studio-frontend/.env.example "$ENV_FILE"
    print_warning "Please edit $ENV_FILE with your configuration before continuing."
    print_warning "Press Enter to continue after editing the file..."
    read -r
fi

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    print_status "Loading environment variables..."
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs/nginx
mkdir -p nginx/ssl

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f "$COMPOSE_FILE" pull

# Build custom images
print_status "Building Axie Studio frontend..."
docker-compose -f "$COMPOSE_FILE" build axie-studio-frontend

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down

# Start services
print_status "Starting Axie Studio services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up (healthy)"; then
    print_status "✅ Services are running and healthy!"
else
    print_warning "Some services may not be fully ready yet. Check logs with:"
    echo "docker-compose -f $COMPOSE_FILE logs"
fi

# Display access information
print_status "🎉 Deployment complete!"
echo ""
echo "Access your Axie Studio instance at:"
echo "  Frontend: http://$(curl -s ifconfig.me)"
echo "  Backend API: http://$(curl -s ifconfig.me):7860"
echo ""
echo "Default login credentials:"
echo "  Username: ${AXIE_STUDIO_SUPERUSER:-admin}"
echo "  Password: ${AXIE_STUDIO_SUPERUSER_PASSWORD:-admin123}"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop services: docker-compose -f $COMPOSE_FILE down"
echo "  Restart services: docker-compose -f $COMPOSE_FILE restart"
echo "  Update: ./deploy-axie-studio.sh"

print_warning "Remember to:"
print_warning "1. Change default passwords in production"
print_warning "2. Set up SSL certificates for HTTPS"
print_warning "3. Configure firewall rules"
print_warning "4. Set up regular backups"
