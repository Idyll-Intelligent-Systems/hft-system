#!/bin/bash

# Docker Management Script for HFT System
# Provides easy commands to build, run, and manage the HFT system in Docker

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[DOCKER]${NC} $1"
}

# Show usage information
show_usage() {
    echo "HFT System Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build       Build the Docker image"
    echo "  start       Start the complete system (build + run)"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs        Show logs from all services"
    echo "  status      Show status of all services"
    echo "  clean       Clean up containers and images"
    echo "  shell       Open shell in the main container"
    echo "  backup      Backup persistent data"
    echo "  restore     Restore from backup"
    echo "  update      Update and rebuild the system"
    echo ""
    echo "Examples:"
    echo "  $0 start                 # Start the complete system"
    echo "  $0 logs hft-system       # Show logs for main system"
    echo "  $0 shell                 # Open shell in container"
}

# Build Docker image
build_image() {
    print_info "Building HFT System Docker image..."
    docker build -t idyll-hft-system:latest .
    print_status "Docker image built successfully ✓"
}

# Start the complete system
start_system() {
    print_info "Starting HFT System with all dependencies..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from example..."
        cp .env.example .env
        print_warning "Please review and update .env file with your settings"
    fi
    
    # Start all services
    docker-compose up -d
    
    print_status "All services started successfully ✓"
    echo ""
    print_info "Access points:"
    echo "  🌐 Web Dashboard: http://localhost:3000"
    echo "  📊 Grafana Monitor: http://localhost:3001"
    echo "  🔧 Admin Interface: http://localhost:80"
    echo ""
    print_info "To view logs: $0 logs"
    print_info "To stop system: $0 stop"
}

# Stop all services
stop_system() {
    print_info "Stopping HFT System..."
    docker-compose down
    print_status "All services stopped ✓"
}

# Restart all services
restart_system() {
    print_info "Restarting HFT System..."
    docker-compose restart
    print_status "All services restarted ✓"
}

# Show logs
show_logs() {
    if [ -n "$2" ]; then
        print_info "Showing logs for service: $2"
        docker-compose logs -f "$2"
    else
        print_info "Showing logs for all services (Ctrl+C to exit)"
        docker-compose logs -f
    fi
}

# Show status
show_status() {
    print_info "System Status:"
    docker-compose ps
    echo ""
    print_info "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Clean up
clean_system() {
    print_warning "This will remove all containers, images, and volumes. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_info "Cleaning up Docker resources..."
        docker-compose down -v --rmi all
        docker system prune -a -f
        print_status "Cleanup completed ✓"
    else
        print_info "Cleanup cancelled"
    fi
}

# Open shell in container
open_shell() {
    print_info "Opening shell in HFT system container..."
    if docker-compose ps | grep -q "hft-system.*Up"; then
        docker-compose exec hft-system /bin/bash
    else
        print_error "HFT system container is not running. Start it first with: $0 start"
        exit 1
    fi
}

# Backup data
backup_data() {
    print_info "Creating backup of persistent data..."
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup MongoDB
    docker-compose exec -T mongodb mongodump --archive | gzip > "$BACKUP_DIR/mongodb.gz"
    
    # Backup InfluxDB
    docker-compose exec -T influxdb influx backup /tmp/backup
    docker cp "$(docker-compose ps -q influxdb):/tmp/backup" "$BACKUP_DIR/influxdb"
    
    # Backup application data
    cp -r data "$BACKUP_DIR/"
    cp -r logs "$BACKUP_DIR/"
    
    print_status "Backup created in $BACKUP_DIR ✓"
}

# Update system
update_system() {
    print_info "Updating HFT System..."
    
    # Pull latest changes (if in git repo)
    if [ -d .git ]; then
        print_info "Pulling latest changes..."
        git pull
    fi
    
    # Rebuild and restart
    docker-compose down
    build_image
    docker-compose up -d
    
    print_status "System updated successfully ✓"
}

# Check Docker requirements
check_requirements() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker to continue."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose to continue."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker and try again."
        exit 1
    fi
}

# Main execution
main() {
    check_requirements
    
    case "${1:-}" in
        build)
            build_image
            ;;
        start)
            build_image
            start_system
            ;;
        stop)
            stop_system
            ;;
        restart)
            restart_system
            ;;
        logs)
            show_logs "$@"
            ;;
        status)
            show_status
            ;;
        clean)
            clean_system
            ;;
        shell)
            open_shell
            ;;
        backup)
            backup_data
            ;;
        update)
            update_system
            ;;
        help|--help|-h)
            show_usage
            ;;
        "")
            print_error "No command specified"
            echo ""
            show_usage
            exit 1
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
