#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[STOP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_status "Stopping Idyll HFT System..."

# Stop HFT system
if [ -f "hft-system.pid" ]; then
    PID=$(cat hft-system.pid)
    if ps -p $PID > /dev/null; then
        kill $PID
        print_status "HFT system stopped (PID: $PID)"
    else
        print_warning "HFT system was not running"
    fi
    rm -f hft-system.pid
else
    # Try to find and kill by process name
    pkill -f "src/main.js" && print_status "HFT system stopped" || print_warning "HFT system was not running"
fi

# Stop web dashboard
if [ -f "web-dashboard.pid" ]; then
    PID=$(cat web-dashboard.pid)
    if ps -p $PID > /dev/null; then
        kill $PID
        print_status "Web dashboard stopped (PID: $PID)"
    else
        print_warning "Web dashboard was not running"
    fi
    rm -f web-dashboard.pid
else
    # Try to find and kill by process name
    pkill -f "npm.*start" && print_status "Web dashboard stopped" || print_warning "Web dashboard was not running"
fi

print_status "All system components stopped"
