#!/bin/bash
# Linux/macOS Run Script for Idyll HFT System
# Version: 1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[RUN]${NC} $1"
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is running
is_service_running() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services list | grep "$1" | grep -q "started"
    else
        # Linux
        systemctl is-active --quiet "$1" 2>/dev/null
    fi
}

# Function to check if a port is in use
is_port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local service=$1
    local port=$2
    local timeout=${3:-30}
    local count=0
    
    print_info "Waiting for $service to be ready on port $port..."
    
    while [ $count -lt $timeout ]; do
        if is_port_in_use $port; then
            print_status "$service is ready!"
            return 0
        fi
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    
    echo ""
    print_error "$service failed to start within $timeout seconds"
    return 1
}

# Load environment variables
if [ -f "$HOME/.hft-env" ]; then
    source "$HOME/.hft-env"
    print_status "Environment variables loaded"
else
    print_warning "Environment file not found. Some features may not work properly."
fi

# Check if system is built
if [ ! -d "build/production" ]; then
    print_error "System not built. Please run ./scripts/build-system.sh first."
    exit 1
fi

print_status "Starting Idyll HFT System..."

# Function to start MongoDB
start_mongodb() {
    print_info "Starting MongoDB..."
    
    if is_service_running "mongodb"; then
        print_status "MongoDB is already running"
        return 0
    fi
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew services start mongodb-community &
            wait_for_service "MongoDB" 27017 30
        else
            print_error "Homebrew not found. Cannot start MongoDB."
            return 1
        fi
    else
        # Linux - Check for Docker MongoDB first
        if command_exists docker && sudo docker ps -a | grep -q mongodb; then
            print_info "Starting MongoDB Docker container..."
            if sudo docker ps | grep -q mongodb; then
                print_status "MongoDB Docker container is already running"
            else
                sudo docker start mongodb || sudo systemctl start mongodb-docker
            fi
            wait_for_service "MongoDB" 27017 30
        elif command_exists systemctl; then
            # Try regular MongoDB service first, then Docker service
            if systemctl is-enabled mongod >/dev/null 2>&1; then
                sudo systemctl start mongod
            else
                sudo systemctl start mongodb-docker
            fi
            wait_for_service "MongoDB" 27017 30
        elif command_exists service; then
            sudo service mongod start
            wait_for_service "MongoDB" 27017 30
        else
            # Manual start
            print_info "Starting MongoDB manually..."
            mongod --dbpath="$HOME/mongodb-data" --logpath="$HOME/hft-logs/mongodb.log" --fork
            wait_for_service "MongoDB" 27017 30
        fi
    fi
}

# Function to start Redis
start_redis() {
    print_info "Starting Redis..."
    
    if is_service_running "redis"; then
        print_status "Redis is already running"
        return 0
    fi
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew services start redis &
            wait_for_service "Redis" 6379 30
        else
            print_error "Homebrew not found. Cannot start Redis."
            return 1
        fi
    else
        # Linux
        if command_exists systemctl; then
            sudo systemctl start redis
            wait_for_service "Redis" 6379 30
        elif command_exists service; then
            sudo service redis-server start
            wait_for_service "Redis" 6379 30
        else
            # Manual start
            print_info "Starting Redis manually..."
            redis-server --daemonize yes --logfile "$HOME/hft-logs/redis.log"
            wait_for_service "Redis" 6379 30
        fi
    fi
}

# Function to start InfluxDB
start_influxdb() {
    print_info "Starting InfluxDB..."
    
    if is_service_running "influxdb"; then
        print_status "InfluxDB is already running"
        return 0
    fi
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew services start influxdb &
            wait_for_service "InfluxDB" 8086 30
        else
            print_error "Homebrew not found. Cannot start InfluxDB."
            return 1
        fi
    else
        # Linux
        if command_exists systemctl; then
            sudo systemctl start influxdb
            wait_for_service "InfluxDB" 8086 30
        elif command_exists service; then
            sudo service influxdb start
            wait_for_service "InfluxDB" 8086 30
        else
            # Manual start
            print_info "Starting InfluxDB manually..."
            influxd --config=/etc/influxdb/influxdb.conf > "$HOME/hft-logs/influxdb.log" 2>&1 &
            wait_for_service "InfluxDB" 8086 30
        fi
    fi
}

# Function to start Kafka
start_kafka() {
    print_info "Starting Kafka..."
    
    if is_port_in_use 9092; then
        print_status "Kafka is already running"
        return 0
    fi
    
    # Start Zookeeper first
    if ! is_port_in_use 2181; then
        print_info "Starting Zookeeper..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command_exists brew; then
                brew services start zookeeper &
                wait_for_service "Zookeeper" 2181 30
            fi
        else
            # Try to start Zookeeper
            if [ -f "/opt/kafka/bin/zookeeper-server-start.sh" ]; then
                /opt/kafka/bin/zookeeper-server-start.sh -daemon /opt/kafka/config/zookeeper.properties
                wait_for_service "Zookeeper" 2181 30
            elif [ -f "/usr/local/kafka/bin/zookeeper-server-start.sh" ]; then
                /usr/local/kafka/bin/zookeeper-server-start.sh -daemon /usr/local/kafka/config/zookeeper.properties
                wait_for_service "Zookeeper" 2181 30
            fi
        fi
    fi
    
    # Start Kafka
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command_exists brew; then
            brew services start kafka &
            wait_for_service "Kafka" 9092 30
        fi
    else
        # Try to start Kafka
        if [ -f "/opt/kafka/bin/kafka-server-start.sh" ]; then
            /opt/kafka/bin/kafka-server-start.sh -daemon /opt/kafka/config/server.properties
            wait_for_service "Kafka" 9092 30
        elif [ -f "/usr/local/kafka/bin/kafka-server-start.sh" ]; then
            /usr/local/kafka/bin/kafka-server-start.sh -daemon /usr/local/kafka/config/server.properties
            wait_for_service "Kafka" 9092 30
        fi
    fi
}

# Function to setup database schemas
setup_databases() {
    print_info "Setting up database schemas..."
    
    # MongoDB setup
    if is_port_in_use 27017; then
        print_info "Configuring MongoDB..."
        mongo --eval "
            use hft_system;
            db.createCollection('trades');
            db.createCollection('orders');
            db.createCollection('positions');
            db.createCollection('strategies');
            db.createCollection('risk_metrics');
            db.createCollection('market_data');
            print('MongoDB collections created');
        " 2>/dev/null || print_warning "MongoDB setup may have failed"
    fi
    
    # InfluxDB setup
    if is_port_in_use 8086; then
        print_info "Configuring InfluxDB..."
        if command_exists influx; then
            influx -execute "CREATE DATABASE hft_metrics" 2>/dev/null || print_warning "InfluxDB setup may have failed"
            influx -execute "CREATE DATABASE market_data" 2>/dev/null || print_warning "InfluxDB setup may have failed"
        fi
    fi
    
    # Redis setup
    if is_port_in_use 6379; then
        print_info "Configuring Redis..."
        redis-cli CONFIG SET save "900 1 300 10 60 10000" 2>/dev/null || print_warning "Redis configuration may have failed"
    fi
}

# Function to start the HFT system
start_hft_system() {
    print_info "Starting HFT Core System..."
    
    cd build/production
    
    # Check if system is already running
    if is_port_in_use 3001; then
        print_warning "HFT system appears to be already running on port 3001"
        cd ../..
        return 0
    fi
    
    # Set CPU affinity for better performance (Linux only)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists taskset; then
            print_info "Setting CPU affinity for better performance..."
            taskset -c 0-3 node src/main.js > "../../logs/hft-system.log" 2>&1 &
        else
            node src/main.js > "../../logs/hft-system.log" 2>&1 &
        fi
    else
        node src/main.js > "../../logs/hft-system.log" 2>&1 &
    fi
    
    HFT_PID=$!
    echo $HFT_PID > "../../hft-system.pid"
    
    cd ../..
    
    # Wait for the system to start
    wait_for_service "HFT System" 3001 60
}

# Function to start the web dashboard
start_web_dashboard() {
    print_info "Starting Web Dashboard..."
    
    if [ -d "web" ]; then
        cd web
        
        # Check if dashboard is already running
        if is_port_in_use 3000; then
            print_warning "Web dashboard appears to be already running on port 3000"
            cd ..
            return 0
        fi
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            print_info "Installing web dashboard dependencies..."
            npm install
        fi
        
        # Start the dashboard
        npm start > "../logs/web-dashboard.log" 2>&1 &
        WEB_PID=$!
        echo $WEB_PID > "../web-dashboard.pid"
        
        cd ..
        
        # Wait for the dashboard to start
        wait_for_service "Web Dashboard" 3000 60
    else
        print_warning "Web directory not found. Skipping web dashboard."
    fi
}

# Function to create monitoring script
create_monitoring() {
    print_info "Creating monitoring script..."
    
    cat > "monitor-system.sh" << 'EOF'
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
    
    if curl -s -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ API Endpoint: http://localhost:3001"
    else
        echo "❌ API Endpoint: http://localhost:3001 (not accessible)"
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
EOF
    
    chmod +x monitor-system.sh
}

# Function to create stop script
create_stop_script() {
    print_info "Creating stop script..."
    
    cat > "stop-system.sh" << 'EOF'
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
EOF
    
    chmod +x stop-system.sh
}

# Main execution
main() {
    # Create logs directory
    mkdir -p logs
    
    print_status "🚀 Starting Idyll HFT System..."
    
    # Start databases
    start_mongodb
    start_redis
    start_influxdb
    start_kafka
    
    # Setup database schemas
    setup_databases
    
    # Start the HFT system
    start_hft_system
    
    # Start web dashboard
    start_web_dashboard
    
    # Create utility scripts
    create_monitoring
    create_stop_script
    
    print_status "🎉 Idyll HFT System is now running!"
    echo ""
    print_info "System Status:"
    echo "  📊 Web Dashboard: http://localhost:3000"
    echo "  🔌 API Endpoint: http://localhost:3001"
    echo "  📈 System Monitoring: ./monitor-system.sh"
    echo "  🛑 Stop System: ./stop-system.sh"
    echo ""
    print_info "Log files:"
    echo "  📄 HFT System: logs/hft-system.log"
    echo "  📄 Web Dashboard: logs/web-dashboard.log"
    echo "  📄 System Health: logs/system-health.log"
    echo ""
    print_info "Process IDs saved to:"
    echo "  📝 HFT System: hft-system.pid"
    echo "  📝 Web Dashboard: web-dashboard.pid"
    echo ""
    
    # Run initial health check
    if [ -f "monitor-system.sh" ]; then
        print_info "Running initial health check..."
        ./monitor-system.sh
    fi
    
    print_status "System startup complete! 🚀"
}

# Handle signals
trap 'print_error "Interrupted! Run ./stop-system.sh to stop all services."; exit 1' INT TERM

# Run main function
main "$@"
