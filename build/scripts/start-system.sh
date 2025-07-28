#!/bin/bash
set -e

# Load environment variables
if [[ -f ~/.hft-env ]]; then
    source ~/.hft-env
fi

echo "Starting Idyll HFT System..."

# Start databases if not running
if ! pgrep mongod > /dev/null; then
    echo "Starting MongoDB..."
    if [[ "$(uname)" == "Darwin" ]]; then
        brew services start mongodb/brew/mongodb-community
    else
        sudo systemctl start mongod
    fi
fi

if ! pgrep redis-server > /dev/null; then
    echo "Starting Redis..."
    if [[ "$(uname)" == "Darwin" ]]; then
        brew services start redis
    else
        sudo systemctl start redis-server
    fi
fi

if ! pgrep influxd > /dev/null; then
    echo "Starting InfluxDB..."
    if [[ "$(uname)" == "Darwin" ]]; then
        brew services start influxdb
    else
        sudo systemctl start influxdb
    fi
fi

# Start the HFT system
echo "Starting HFT Core System..."
cd "$(dirname "$0")/../production"
node src/main.js &
HFT_PID=$!

echo "HFT System started with PID: $HFT_PID"
echo $HFT_PID > ../hft-system.pid

# Wait for system to initialize
sleep 5

echo "✅ Idyll HFT System is now running!"
echo "Web Dashboard: http://localhost:3000"
echo "API Endpoint: http://localhost:3001"
echo "To stop the system, run: ./stop-system.sh"
