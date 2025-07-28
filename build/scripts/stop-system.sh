#!/bin/bash

echo "Stopping Idyll HFT System..."

if [[ -f ../hft-system.pid ]]; then
    PID=$(cat ../hft-system.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping HFT System (PID: $PID)..."
        kill $PID
        rm -f ../hft-system.pid
        echo "HFT System stopped"
    else
        echo "HFT System is not running"
    fi
else
    echo "PID file not found, attempting to kill by process name..."
    pkill -f "node.*main.js" || echo "No HFT processes found"
fi
