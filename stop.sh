#!/bin/bash

# Simple HFT System Stop Script
# This script stops all HFT system processes

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

# Stop processes by PID files
stop_by_pid() {
    if [ -f "main.pid" ]; then
        MAIN_PID=$(cat main.pid)
        if kill -0 $MAIN_PID 2>/dev/null; then
            print_info "Stopping HFT main system (PID: $MAIN_PID)..."
            kill $MAIN_PID
            sleep 2
            if kill -0 $MAIN_PID 2>/dev/null; then
                print_warning "Force killing main system..."
                kill -9 $MAIN_PID
            fi
            print_status "HFT main system stopped"
        else
            print_warning "Main system was not running"
        fi
        rm -f main.pid
    fi
    
    if [ -f "web.pid" ]; then
        WEB_PID=$(cat web.pid)
        if kill -0 $WEB_PID 2>/dev/null; then
            print_info "Stopping web interface (PID: $WEB_PID)..."
            kill $WEB_PID
            sleep 2
            if kill -0 $WEB_PID 2>/dev/null; then
                print_warning "Force killing web interface..."
                kill -9 $WEB_PID
            fi
            print_status "Web interface stopped"
        else
            print_warning "Web interface was not running"
        fi
        rm -f web.pid
    fi
}

# Stop processes by pattern matching
stop_by_pattern() {
    print_info "Stopping any remaining HFT processes..."
    
    # Stop main system processes
    pkill -f "node.*main.js" 2>/dev/null && print_status "Stopped main system processes" || true
    
    # Stop web interface processes
    pkill -f "node.*web-interface.js" 2>/dev/null && print_status "Stopped web interface processes" || true
    
    # Stop any npm start processes
    pkill -f "npm.*start" 2>/dev/null && print_status "Stopped npm processes" || true
    
    sleep 2
}

# Check for any remaining processes
check_remaining() {
    REMAINING=$(ps aux | grep -E "node.*(main\.js|web-interface\.js)" | grep -v grep | wc -l)
    if [ $REMAINING -gt 0 ]; then
        print_warning "Some processes may still be running:"
        ps aux | grep -E "node.*(main\.js|web-interface\.js)" | grep -v grep
        print_info "You may need to manually kill them with: sudo pkill -f node"
    else
        print_status "All HFT system processes stopped successfully"
    fi
}

# Main execution
main() {
    print_info "🛑 Stopping Idyll HFT System..."
    echo ""
    
    stop_by_pid
    stop_by_pattern
    check_remaining
    
    echo ""
    print_status "🏁 System shutdown complete!"
    print_info "All logs are preserved in the logs/ directory"
}

# Run main function
main "$@"
