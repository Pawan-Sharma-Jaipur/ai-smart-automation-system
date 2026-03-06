#!/bin/bash

# 🚀 AI Automation System - Production Setup Script
# This script sets up the complete production-ready system

set -e

echo "🚀 Starting AI Automation System Production Setup..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_status "Node.js $(node --version) is installed"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.9+ first."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 9) else 1)"; then
        print_error "Python 3.9+ is required. Current version: $(python3 --version)"
        exit 1
    fi
    
    print_status "Python $(python3 --version) is installed"
}

# Setup backend
setup_backend() {
    print_info "Setting up backend..."
    
    cd backend
    
    # Copy production files
    cp package-production.json package.json
    cp server-production.js server.js
    cp .env.production .env
    
    # Install dependencies
    npm install
    
    print_status "Backend setup completed"
    cd ..
}

# Setup AI engine
setup_ai_engine() {
    print_info "Setting up AI engine..."
    
    cd ai-engine
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate || source venv/Scripts/activate
    
    # Install dependencies
    pip install -r requirements-production.txt
    
    # Train the model
    python production_model.py
    
    print_status "AI engine setup completed"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_info "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    
    print_status "Frontend setup completed"
    cd ..
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    
    mkdir -p backend/uploads
    mkdir -p backend/logs
    mkdir -p ai-engine/models
    mkdir -p ai-engine/logs
    mkdir -p ssl
    mkdir -p monitoring
    mkdir -p nginx
    
    print_status "Directories created"
}

# Generate SSL certificates (self-signed for development)
generate_ssl() {
    print_info "Generating SSL certificates..."
    
    if [ ! -f ssl/cert.pem ]; then
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        print_status "SSL certificates generated"
    else
        print_status "SSL certificates already exist"
    fi
}

# Create nginx configuration
create_nginx_config() {
    print_info "Creating Nginx configuration..."
    
    cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }
    
    upstream frontend {
        server frontend:80;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    server {
        listen 443 ssl;
        server_name localhost;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
    
    print_status "Nginx configuration created"
}

# Start the system
start_system() {
    print_info "Starting the production system..."
    
    # Build and start all services
    docker-compose -f docker-compose.production.yml up --build -d
    
    print_status "System started successfully!"
}

# Display access information
show_access_info() {
    echo ""
    echo "🎉 AI Automation System is now running!"
    echo "======================================"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend:     http://localhost:3000"
    echo "   Backend API:  http://localhost:5000"
    echo "   AI Engine:    http://localhost:8000"
    echo "   Grafana:      http://localhost:3001 (admin/admin123)"
    echo "   Prometheus:   http://localhost:9090"
    echo ""
    echo "👤 Default Users:"
    echo "   Admin:  admin / admin123"
    echo "   User:   user / user123"
    echo "   Demo:   demo / demo123"
    echo ""
    echo "📊 Health Check:"
    echo "   curl http://localhost:5000/health"
    echo ""
    echo "🛑 To stop the system:"
    echo "   docker-compose -f docker-compose.production.yml down"
    echo ""
    echo "📝 Logs:"
    echo "   docker-compose -f docker-compose.production.yml logs -f"
    echo ""
}

# Main execution
main() {
    echo "Checking prerequisites..."
    check_docker
    check_nodejs
    check_python
    
    echo ""
    echo "Setting up components..."
    create_directories
    setup_backend
    setup_ai_engine
    setup_frontend
    generate_ssl
    create_nginx_config
    
    echo ""
    echo "Starting system..."
    start_system
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 30
    
    show_access_info
}

# Run main function
main "$@"