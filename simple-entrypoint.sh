#!/bin/bash
set -e

echo "🚀 Starting Idyll HFT System..."

# Wait for dependencies
echo "Waiting for Redis..."
while ! nc -z redis 6379; do sleep 1; done
echo "Redis is ready!"

echo "Waiting for MongoDB..."
while ! nc -z mongodb 27017; do sleep 1; done
echo "MongoDB is ready!"

echo "Waiting for InfluxDB..."
while ! nc -z influxdb 8086; do sleep 1; done
echo "InfluxDB is ready!"

# Create directories
mkdir -p logs data/cache tmp

# Start simple health server
cat > health.js << 'HEALTH_EOF'
const http = require('http');
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"status":"healthy","timestamp":"' + new Date().toISOString() + '"}');
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});
server.listen(3000, () => console.log('Health endpoint ready on port 3000'));
HEALTH_EOF

# Start health endpoint in background
node health.js &

echo "✅ System ready! Health endpoint available at :3000/health"

# Keep container running
tail -f /dev/null
