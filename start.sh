#!/bin/bash

# Simple HFT System Startup Script
# This script starts the complete HFT system with web interface

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

# Kill any existing processes
cleanup() {
    print_info "Cleaning up any existing processes..."
    pkill -f "node.*main.js" 2>/dev/null || true
    pkill -f "node.*web-interface.js" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    sleep 2
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ to continue."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_status "Node.js version: $(node --version) ✓"
}

# Install dependencies if needed
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
    else
        print_status "Dependencies already installed ✓"
    fi
    
    # Install web dependencies
    if [ ! -d "web/node_modules" ]; then
        print_info "Installing web dependencies..."
        cd web && npm install && cd ..
    else
        print_status "Web dependencies already installed ✓"
    fi
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p logs data/cache tmp
    print_status "Directories created ✓"
}

# Start the main HFT system
start_main_system() {
    print_info "Starting HFT main system..."
    
    # Start main system in background
    nohup node src/main.js > logs/main.log 2>&1 &
    MAIN_PID=$!
    echo $MAIN_PID > main.pid
    
    print_status "HFT main system started (PID: $MAIN_PID)"
    
    # Wait a moment for the system to initialize
    sleep 3
    
    # Check if the process is still running
    if ! kill -0 $MAIN_PID 2>/dev/null; then
        print_error "HFT main system failed to start. Check logs/main.log for details."
        exit 1
    fi
}

# Start the web interface
start_web_interface() {
    print_info "Starting web interface..."
    
    # Start web interface in background
    cd web
    nohup node web-interface.js > ../logs/web.log 2>&1 &
    WEB_PID=$!
    echo $WEB_PID > ../web.pid
    cd ..
    
    print_status "Web interface started (PID: $WEB_PID)"
    
    # Wait a moment for the web server to start
    sleep 3
    
    # Check if the process is still running
    if ! kill -0 $WEB_PID 2>/dev/null; then
        print_error "Web interface failed to start. Check logs/web.log for details."
        exit 1
    fi
}

# Check system health
check_health() {
    print_info "Checking system health..."
    
    # Check if port 3000 is responding
    sleep 2
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_status "Web interface is responding on http://localhost:3000 ✓"
    else
        print_warning "Web interface may not be fully ready yet. Check http://localhost:3000 in a moment."
    fi
}

# Main execution
main() {
    print_info "🚀 Starting Idyll HFT System..."
    echo ""
    
    cleanup
    check_node
    install_dependencies
    create_directories
    start_main_system
    start_web_interface
    check_health
    
    echo ""
    print_status "🎉 System started successfully!"
    echo ""
    print_info "Access points:"
    echo "  🌐 Web Dashboard: http://localhost:3000"
    echo "  📊 Trading Interface: http://localhost:3000/trading"
    echo "  📈 System Monitor: http://localhost:3000/monitor"
    echo ""
    print_info "Management:"
    echo "  📄 Main System Logs: tail -f logs/main.log"
    echo "  📄 Web Interface Logs: tail -f logs/web.log"
    echo "  🛑 Stop System: ./stop.sh"
    echo ""
    print_info "System is now running in background..."
    print_status "You can safely close this terminal. The system will continue running."
}

# Handle interrupts
trap 'print_error "Interrupted! The system is still running in background. Use ./stop.sh to stop it."; exit 1' INT TERM

# Run main function
main "$@"
