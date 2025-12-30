#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment to EC2...${NC}"

# Variables
EC2_HOST="ubuntu@ec2-13-50-107-250.eu-north-1.compute.amazonaws.com"
PEM_FILE="yousef-server.pem"
REMOTE_DIR="/home/ubuntu/yousef-server"
DOCKER_IMAGE="softvence/yousef_server:latest"

# Check if PEM file exists
if [ ! -f "$PEM_FILE" ]; then
    echo -e "${RED}❌ Error: PEM file not found${NC}"
    exit 1
fi

# Set correct permissions
chmod 400 "$PEM_FILE"

echo -e "${YELLOW}📁 Creating remote directory...${NC}"
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_HOST" "mkdir -p $REMOTE_DIR"

echo -e "${YELLOW}📤 Copying files to EC2...${NC}"
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no docker-compose.prod.yaml "$EC2_HOST:$REMOTE_DIR/docker-compose.yaml"
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no .env "$EC2_HOST:$REMOTE_DIR/.env" 2>/dev/null || echo -e "${YELLOW}⚠️  No .env file found locally${NC}"

echo -e "${YELLOW}🐳 Deploying on EC2...${NC}"
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_HOST" << 'ENDSSH'
cd /home/ubuntu/yousef-server

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Pull latest image
echo "Pulling latest Docker image..."
docker pull softvence/yousef_server:latest

# Stop and remove old containers
echo "Stopping old containers..."
docker-compose down 2>/dev/null || true

# Start new containers
echo "Starting new containers..."
docker-compose up -d

# Show status
echo "Container status:"
docker-compose ps

# Show logs
echo "Recent logs:"
docker-compose logs --tail=50
ENDSSH

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${YELLOW}📝 To view logs, run:${NC}"
echo -e "ssh -i $PEM_FILE $EC2_HOST 'cd $REMOTE_DIR && docker-compose logs -f'"
