#!/bin/bash

# HFT System Status and Monitor Script
# Shows system status and real-time logs

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[STATUS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check process status
check_processes() {
    print_info "🔍 Checking HFT System Status..."
    echo ""
    
    # Check main system
    if [ -f "main.pid" ]; then
        MAIN_PID=$(cat main.pid)
        if kill -0 $MAIN_PID 2>/dev/null; then
            print_status "✅ HFT Main System: Running (PID: $MAIN_PID)"
        else
            print_error "❌ HFT Main System: Not running (stale PID file)"
            rm -f main.pid
        fi
    else
        print_error "❌ HFT Main System: Not running (no PID file)"
    fi
    
    # Check web interface
    if [ -f "web.pid" ]; then
        WEB_PID=$(cat web.pid)
        if kill -0 $WEB_PID 2>/dev/null; then
            print_status "✅ Web Interface: Running (PID: $WEB_PID)"
        else
            print_error "❌ Web Interface: Not running (stale PID file)"
            rm -f web.pid
        fi
    else
        print_error "❌ Web Interface: Not running (no PID file)"
    fi
    
    echo ""
}

# Check port status
check_ports() {
    print_info "🌐 Checking Port Status..."
    echo ""
    
    # Check port 3000 (web interface)
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_status "✅ Port 3000: Web interface is listening"
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_status "✅ HTTP Response: Web interface is responding"
        else
            print_warning "⚠️  HTTP Response: Web interface not responding"
        fi
    else
        print_error "❌ Port 3000: No service listening"
    fi
    
    echo ""
}

# Show system info
show_system_info() {
    print_info "📊 System Information..."
    echo ""
    
    echo "  🖥️  Node.js Version: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "  📁 Working Directory: $(pwd)"
    echo "  ⏰ Current Time: $(date)"
    echo "  🔧 System Load: $(uptime | awk -F'load average:' '{print $2}' | xargs)"
    echo "  💾 Memory Usage: $(free -h 2>/dev/null | grep Mem: | awk '{print $3 "/" $2}' || echo 'N/A')"
    
    echo ""
}

# Show log files info
show_logs_info() {
    print_info "📄 Log Files..."
    echo ""
    
    if [ -f "logs/main.log" ]; then
        MAIN_SIZE=$(du -h logs/main.log | cut -f1)
        MAIN_LINES=$(wc -l < logs/main.log)
        print_status "📋 Main System Log: $MAIN_SIZE ($MAIN_LINES lines)"
    else
        print_warning "📋 Main System Log: Not found"
    fi
    
    if [ -f "logs/web.log" ]; then
        WEB_SIZE=$(du -h logs/web.log | cut -f1)
        WEB_LINES=$(wc -l < logs/web.log)
        print_status "🌐 Web Interface Log: $WEB_SIZE ($WEB_LINES lines)"
    else
        print_warning "🌐 Web Interface Log: Not found"
    fi
    
    echo ""
}

# Show recent logs
show_recent_logs() {
    if [ "$1" = "--logs" ] || [ "$1" = "-l" ]; then
        print_info "📝 Recent Log Entries..."
        echo ""
        
        if [ -f "logs/main.log" ]; then
            print_info "Last 10 lines from main.log:"
            tail -10 logs/main.log | sed 's/^/  /'
            echo ""
        fi
        
        if [ -f "logs/web.log" ]; then
            print_info "Last 10 lines from web.log:"
            tail -10 logs/web.log | sed 's/^/  /'
            echo ""
        fi
    fi
}

# Follow logs in real-time
follow_logs() {
    if [ "$1" = "--follow" ] || [ "$1" = "-f" ]; then
        print_info "📺 Following logs in real-time (Ctrl+C to stop)..."
        echo ""
        
        if [ -f "logs/main.log" ] && [ -f "logs/web.log" ]; then
            tail -f logs/main.log logs/web.log
        elif [ -f "logs/main.log" ]; then
            tail -f logs/main.log
        elif [ -f "logs/web.log" ]; then
            tail -f logs/web.log
        else
            print_error "No log files found to follow"
        fi
        exit 0
    fi
}

# Show usage
show_usage() {
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        print_info "HFT System Monitor Usage:"
        echo ""
        echo "  ./monitor.sh          - Show system status"
        echo "  ./monitor.sh -l       - Show recent logs"
        echo "  ./monitor.sh -f       - Follow logs in real-time"
        echo "  ./monitor.sh -h       - Show this help"
        echo ""
        exit 0
    fi
}

# Main execution
main() {
    show_usage "$1"
    follow_logs "$1"
    
    print_info "🚀 Idyll HFT System Monitor"
    echo ""
    
    check_processes
    check_ports
    show_system_info
    show_logs_info
    show_recent_logs "$1"
    
    print_info "💡 Quick Commands:"
    echo "  🔄 Restart System: ./stop.sh && ./start.sh"
    echo "  📺 Follow Logs: ./monitor.sh -f"
    echo "  🌐 Open Dashboard: open http://localhost:3000"
    echo ""
}

# Run main function
main "$@"
