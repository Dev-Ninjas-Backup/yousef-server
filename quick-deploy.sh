#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 Quick AWS EC2 Deployment Script      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Variables
EC2_HOST="ubuntu@ec2-13-62-72-14.eu-north-1.compute.amazonaws.com"
PEM_FILE="yousef-server.pem"
REMOTE_DIR="/home/ubuntu/yousef-server"
DOCKER_IMAGE="softvence/yousef_server:latest"

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo -e "${RED}❌ Error: PEM file '$PEM_FILE' not found${NC}"
    exit 1
fi

# Set correct permissions
chmod 400 "$PEM_FILE"
echo -e "${GREEN}✓ PEM file permissions set${NC}"

# Test SSH connection
echo -e "\n${YELLOW}🔐 Testing SSH connection...${NC}"
if ! ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$EC2_HOST" "echo 'Connection successful'" &>/dev/null; then
    echo -e "${RED}❌ Cannot connect to EC2 instance${NC}"
    echo -e "${YELLOW}💡 Please check:${NC}"
    echo "   - EC2 instance is running"
    echo "   - Security group allows SSH (port 22) from your IP"
    echo "   - PEM file is correct"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"

# Step 1: Build and push Docker image
echo -e "\n${YELLOW}📦 Building Docker image...${NC}"
docker build -t "$DOCKER_IMAGE" . || {
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Docker image built${NC}"

echo -e "\n${YELLOW}📤 Pushing Docker image to registry...${NC}"
docker push "$DOCKER_IMAGE" || {
    echo -e "${RED}❌ Docker push failed. Make sure you're logged in: docker login${NC}"
    exit 1
}
echo -e "${GREEN}✓ Docker image pushed${NC}"

# Step 2: Prepare remote directory
echo -e "\n${YELLOW}📁 Preparing remote directory...${NC}"
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_HOST" "mkdir -p $REMOTE_DIR"
echo -e "${GREEN}✓ Remote directory ready${NC}"

# Step 3: Copy necessary files
echo -e "\n${YELLOW}📋 Copying configuration files...${NC}"

# Copy docker-compose file
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no docker-compose.yaml "$EC2_HOST:$REMOTE_DIR/docker-compose.yaml"

# Copy .env file if exists
if [ -f ".env" ]; then
    scp -i "$PEM_FILE" -o StrictHostKeyChecking=no .env "$EC2_HOST:$REMOTE_DIR/.env"
    echo -e "${GREEN}✓ .env file copied${NC}"
else
    echo -e "${YELLOW}⚠️  No .env file found locally (you may need to create it on server)${NC}"
fi

# Copy Caddyfile if exists
if [ -f "Caddyfile" ]; then
    scp -i "$PEM_FILE" -o StrictHostKeyChecking=no Caddyfile "$EC2_HOST:$REMOTE_DIR/Caddyfile"
    echo -e "${GREEN}✓ Caddyfile copied${NC}"
fi

echo -e "${GREEN}✓ Configuration files copied${NC}"

# Step 4: Deploy on EC2
echo -e "\n${YELLOW}🐳 Deploying on EC2...${NC}"
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_HOST" << 'ENDSSH'
set -e

cd /home/ubuntu/yousef-server

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📥 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✓ Docker installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "📥 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✓ Docker Compose installed"
fi

# Pull latest image
echo "📥 Pulling latest Docker image..."
docker pull softvence/yousef_server:latest

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker-compose down 2>/dev/null || true
docker compose down 2>/dev/null || true

# Remove old images to save space
echo "🧹 Cleaning up old images..."
docker image prune -f

# Start new containers with prod profile
echo "▶️  Starting new containers..."
docker-compose --profile prod up -d 2>/dev/null || docker compose --profile prod up -d

# Wait a bit for containers to start
sleep 5

# Show status
echo ""
echo "📊 Container status:"
docker-compose ps 2>/dev/null || docker compose ps

# Check if app is healthy
echo ""
echo "🏥 Health check:"
if docker ps | grep -q "yousef_server.*Up"; then
    echo "✓ Application container is running"
else
    echo "⚠ Application container might have issues"
fi

if docker ps | grep -q "yousef-postgres.*Up"; then
    echo "✓ Database container is running"
else
    echo "⚠ Database container might have issues"
fi

# Show recent logs
echo ""
echo "📝 Recent logs (last 30 lines):"
echo "================================"
docker-compose logs --tail=30 app 2>/dev/null || docker compose logs --tail=30 app

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ Deployment completed successfully!    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📍 Your application is now available at:${NC}"
    echo -e "   http://ec2-13-62-72-14.eu-north-1.compute.amazonaws.com:3000"
    echo ""
    echo -e "${BLUE}📚 Swagger documentation:${NC}"
    echo -e "   http://ec2-13-62-72-14.eu-north-1.compute.amazonaws.com:3000/docs"
    echo ""
    echo -e "${YELLOW}📝 Useful commands:${NC}"
    echo ""
    echo -e "${BLUE}View logs:${NC}"
    echo "   ssh -i $PEM_FILE $EC2_HOST 'cd $REMOTE_DIR && docker-compose logs -f app'"
    echo ""
    echo -e "${BLUE}Check status:${NC}"
    echo "   ssh -i $PEM_FILE $EC2_HOST 'cd $REMOTE_DIR && docker-compose ps'"
    echo ""
    echo -e "${BLUE}Restart services:${NC}"
    echo "   ssh -i $PEM_FILE $EC2_HOST 'cd $REMOTE_DIR && docker-compose restart'"
    echo ""
    echo -e "${BLUE}SSH into server:${NC}"
    echo "   ssh -i $PEM_FILE $EC2_HOST"
    echo ""
else
    echo -e "${RED}❌ Deployment failed. Check the logs above for details.${NC}"
    exit 1
fi
