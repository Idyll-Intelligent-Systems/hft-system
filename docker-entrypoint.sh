#!/bin/bash

# Docker entrypoint script for HFT System
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
    echo -e "${BLUE}[SYSTEM]${NC} $1"
}

# Wait for external services if needed
wait_for_services() {
    if [ ! -z "$REDIS_HOST" ]; then
        print_info "Waiting for Redis at $REDIS_HOST:${REDIS_PORT:-6379}..."
        while ! nc -z "$REDIS_HOST" "${REDIS_PORT:-6379}"; do
            sleep 1
        done
        print_status "Redis is ready ✓"
    fi

    if [ ! -z "$MONGODB_HOST" ]; then
        print_info "Waiting for MongoDB at $MONGODB_HOST:${MONGODB_PORT:-27017}..."
        while ! nc -z "$MONGODB_HOST" "${MONGODB_PORT:-27017}"; do
            sleep 1
        done
        print_status "MongoDB is ready ✓"
    fi

    if [ ! -z "$INFLUXDB_HOST" ]; then
        print_info "Waiting for InfluxDB at $INFLUXDB_HOST:${INFLUXDB_PORT:-8086}..."
        while ! nc -z "$INFLUXDB_HOST" "${INFLUXDB_PORT:-8086}"; do
            sleep 1
        done
        print_status "InfluxDB is ready ✓"
    fi
}

# Initialize directories and permissions
initialize_directories() {
    print_info "Initializing directories..."
    mkdir -p logs data/cache tmp build/production
    
    # Try to set permissions, ignore if fails due to mounted volumes
    chmod 755 logs data/cache tmp build/production 2>/dev/null || true
    
    print_status "Directories initialized ✓"
}

# Start main HFT system in background
start_main_system() {
    print_info "Starting HFT main system..."
    
    # Start main system with process management
    node src/main.js > logs/main.log 2>&1 &
    MAIN_PID=$!
    echo $MAIN_PID > main.pid
    
    print_status "HFT main system started (PID: $MAIN_PID)"
    
    # Wait for system to initialize
    sleep 5
    
    # Check if the process is still running
    if ! kill -0 $MAIN_PID 2>/dev/null; then
        print_error "HFT main system failed to start. Check logs/main.log for details."
        cat logs/main.log | tail -20
        exit 1
    fi
}

# Start web interface in background
start_web_interface() {
    print_info "Starting web interface..."
    
    cd web
    # Set web interface to use port 3100 to avoid conflict with main system
    WEB_PORT=3100 node web-interface.js > ../logs/web.log 2>&1 &
    WEB_PID=$!
    echo $WEB_PID > ../web.pid
    cd ..
    
    print_status "Web interface started (PID: $WEB_PID)"
    
    # Wait for web server to start
    sleep 3
    
    # Check if the process is still running
    if ! kill -0 $WEB_PID 2>/dev/null; then
        print_warning "Web interface process died, but continuing with main system..."
        rm -f web.pid
    fi
}

# Monitor processes and restart if needed
monitor_processes() {
    print_info "Starting process monitor..."
    
    while true; do
        # Check main system
        if [ -f main.pid ]; then
            MAIN_PID=$(cat main.pid)
            if ! kill -0 $MAIN_PID 2>/dev/null; then
                print_warning "Main system died, restarting..."
                start_main_system
            fi
        fi
        
        # Check web interface
        if [ -f web.pid ]; then
            WEB_PID=$(cat web.pid)
            if ! kill -0 $WEB_PID 2>/dev/null; then
                print_warning "Web interface died, restarting..."
                start_web_interface
            fi
        fi
        
        sleep 10
    done
}

# Graceful shutdown handler
shutdown_handler() {
    print_info "Received shutdown signal, stopping services..."
    
    # Stop web interface
    if [ -f web.pid ]; then
        WEB_PID=$(cat web.pid)
        if kill -0 $WEB_PID 2>/dev/null; then
            print_info "Stopping web interface (PID: $WEB_PID)..."
            kill -TERM $WEB_PID
            wait $WEB_PID 2>/dev/null || true
        fi
        rm -f web.pid
    fi
    
    # Stop main system
    if [ -f main.pid ]; then
        MAIN_PID=$(cat main.pid)
        if kill -0 $MAIN_PID 2>/dev/null; then
            print_info "Stopping main system (PID: $MAIN_PID)..."
            kill -TERM $MAIN_PID
            wait $MAIN_PID 2>/dev/null || true
        fi
        rm -f main.pid
    fi
    
    print_status "Shutdown complete"
    exit 0
}

# Set up signal handlers
trap shutdown_handler SIGTERM SIGINT

# Main execution
main() {
    print_info "🚀 Starting Idyll HFT System in Docker..."
    echo ""
    
    # Initialize environment
    wait_for_services
    initialize_directories
    
    # Start services
    start_main_system
    start_web_interface
    
    echo ""
    print_status "🎉 System started successfully!"
    echo ""
    print_info "Access points:"
    echo "  🌐 Web Dashboard: http://localhost:3000"
    echo "  📊 Trading Interface: http://localhost:3000/trading"
    echo "  📈 System Monitor: http://localhost:3000/monitor"
    echo ""
    print_info "Container is ready and monitoring processes..."
    
    # Start monitoring loop
    monitor_processes
}

# Run main function
main "$@"
