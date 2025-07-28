#!/bin/bash

echo "Idyll HFT System Status:"
echo "========================"

# Check if main process is running
if [[ -f ../hft-system.pid ]]; then
    PID=$(cat ../hft-system.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "✅ HFT System: Running (PID: $PID)"
    else
        echo "❌ HFT System: Not running (stale PID file)"
    fi
else
    echo "❌ HFT System: Not running"
fi

# Check databases
if pgrep mongod > /dev/null; then
    echo "✅ MongoDB: Running"
else
    echo "❌ MongoDB: Not running"
fi

if pgrep redis-server > /dev/null; then
    echo "✅ Redis: Running"
else
    echo "❌ Redis: Not running"
fi

if pgrep influxd > /dev/null; then
    echo "✅ InfluxDB: Running"
else
    echo "❌ InfluxDB: Not running"
fi

# Check web dashboard
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Web Dashboard: Accessible"
else
    echo "❌ Web Dashboard: Not accessible"
fi

# Check API
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ API: Accessible"
else
    echo "❌ API: Not accessible"
fi
