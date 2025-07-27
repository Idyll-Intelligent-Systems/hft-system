#!/bin/bash

# System monitoring script
check_system_health() {
    echo "==================================="
    echo "Idyll HFT System Health Check"
    echo "==================================="
    echo "Timestamp: $(date)"
    echo ""
    
    # Check HFT system
    if pgrep -f "src/main.js" > /dev/null; then
        echo "✅ HFT System: Running (PID: $(pgrep -f 'src/main.js'))"
    else
        echo "❌ HFT System: Not running"
    fi
    
    # Check web dashboard
    if pgrep -f "npm.*start" > /dev/null; then
        echo "✅ Web Dashboard: Running (PID: $(pgrep -f 'npm.*start'))"
    else
        echo "❌ Web Dashboard: Not running"
    fi
    
    # Check databases
    if lsof -Pi :27017 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ MongoDB: Running"
    else
        echo "❌ MongoDB: Not running"
    fi
    
    if lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Redis: Running"
    else
        echo "❌ Redis: Not running"
    fi
    
    if lsof -Pi :8086 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ InfluxDB: Running"
    else
        echo "❌ InfluxDB: Not running"
    fi
    
    if lsof -Pi :9092 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Kafka: Running"
    else
        echo "❌ Kafka: Not running"
    fi
    
    # Check URLs
    echo ""
    echo "Service Endpoints:"
    if curl -s -f http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Web Dashboard: http://localhost:3000"
    else
        echo "❌ Web Dashboard: http://localhost:3000 (not accessible)"
    fi
    
    if curl -s -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo "✅ API Endpoint: http://localhost:3000/api"
    else
        echo "❌ API Endpoint: http://localhost:3000/api (not accessible)"
    fi
    
    # System resources
    echo ""
    echo "System Resources:"
    echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
    echo "Memory Usage: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
    echo "Disk Usage: $(df -h / | awk 'NR==2 {print $5}')"
    
    echo ""
    echo "==================================="
}

# Run health check
check_system_health

# Write to log
check_system_health >> "logs/system-health.log"
