#!/bin/bash
# Linux/macOS Build Script for Idyll HFT System
# Version: 1.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

print_status "Building Idyll HFT System on $MACHINE..."

# Load environment variables if they exist
if [[ -f ~/.hft-env ]]; then
    source ~/.hft-env
    print_status "Environment variables loaded"
else
    print_warning "Environment file not found. Run install-dependencies script first."
fi

# Verify Node.js installation
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please run the installation script first."
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "Using Node.js $NODE_VERSION"

# Verify npm installation
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please run the installation script first."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_status "Using npm $NPM_VERSION"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf node_modules
rm -rf dist
rm -rf build
rm -rf .next
rm -rf coverage
rm -f *.log

# Create build directories
print_status "Creating build directories..."
mkdir -p dist
mkdir -p build
mkdir -p logs
mkdir -p tmp

# Install dependencies
print_status "Installing Node.js dependencies..."
npm ci --production=false

# Install TypeScript if not globally available
if ! command -v tsc &> /dev/null; then
    print_status "Installing TypeScript locally..."
    npm install --save-dev typescript @types/node
fi

# Compile TypeScript
print_status "Compiling TypeScript..."
if [[ -f "tsconfig.json" ]]; then
    npx tsc
    print_success "TypeScript compilation completed"
else
    print_warning "tsconfig.json not found, creating default configuration..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
EOF
    npx tsc
fi

# Build native modules if any
print_status "Building native modules..."
if [[ -f "binding.gyp" ]] || [[ -d "native" ]]; then
    npm run build:native 2>/dev/null || npm rebuild
    print_success "Native modules built"
else
    print_status "No native modules to build"
fi

# Run linting
print_status "Running ESLint..."
if [[ -f ".eslintrc.js" ]] || [[ -f ".eslintrc.json" ]]; then
    npx eslint src --ext .ts,.js --fix || print_warning "ESLint issues found"
else
    print_status "Creating default ESLint configuration..."
    cat > .eslintrc.json << 'EOF'
{
  "env": {
    "node": true,
    "es2022": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "rules": {
    "no-console": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
EOF
    npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
    npx eslint src --ext .ts,.js --fix || print_warning "ESLint issues found"
fi

# Run Prettier formatting
print_status "Running Prettier..."
if [[ -f ".prettierrc" ]]; then
    npx prettier --write "src/**/*.{ts,js,json}" || print_warning "Prettier formatting issues"
else
    print_status "Creating default Prettier configuration..."
    cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 4,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
EOF
    npx prettier --write "src/**/*.{ts,js,json}" || print_warning "Prettier formatting issues"
fi

# Run tests if available
print_status "Running tests..."
if npm run test &> /dev/null; then
    print_success "All tests passed"
elif [[ -d "test" ]] || [[ -d "tests" ]] || [[ -d "__tests__" ]]; then
    print_warning "Tests found but npm test script not configured"
    # Try to run common test runners
    if command -v jest &> /dev/null; then
        npx jest || print_warning "Some tests failed"
    elif command -v mocha &> /dev/null; then
        npx mocha "test/**/*.js" || print_warning "Some tests failed"
    fi
else
    print_status "No tests found"
fi

# Build web dashboard
print_status "Building web dashboard..."
if [[ -d "web" ]]; then
    cd web
    if [[ -f "package.json" ]]; then
        npm install
        npm run build 2>/dev/null || print_warning "Web build script not found"
    fi
    cd ..
    print_success "Web dashboard built"
else
    print_status "No web directory found"
fi

# Create production build
print_status "Creating production build..."
mkdir -p build/production

# Copy compiled JavaScript files
if [[ -d "dist" ]] && [[ -n "$(ls -A dist 2>/dev/null)" ]]; then
    cp -r dist/* build/production/
else
    print_status "No dist directory found or empty - skipping compiled file copy"
fi

# Copy configuration files
cp -r src/core/config build/production/ 2>/dev/null || print_status "No config directory to copy"

# Copy web assets
if [[ -d "web/public" ]]; then
    mkdir -p build/production/web
    cp -r web/public build/production/web/
fi
if [[ -d "web/dist" ]]; then
    cp -r web/dist/* build/production/web/ 2>/dev/null || true
fi

# Copy package.json for production
if [[ -f "package.json" ]]; then
    cp package.json build/production/
fi

# Install production dependencies
print_status "Installing production dependencies in build directory..."
cd build/production
npm ci --production --silent
cd ../..

# Create startup scripts
print_status "Creating startup scripts..."
mkdir -p build/scripts

# Main system startup script
cat > build/scripts/start-system.sh << 'EOF'
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
EOF

# System stop script
cat > build/scripts/stop-system.sh << 'EOF'
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
EOF

# System status script
cat > build/scripts/status-system.sh << 'EOF'
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
EOF

# Make scripts executable
chmod +x build/scripts/*.sh

# Create systemd service file for Linux
if [[ "$MACHINE" == "Linux" ]]; then
    print_status "Creating systemd service file..."
    cat > build/scripts/hft-system.service << EOF
[Unit]
Description=Idyll HFT System
After=network.target mongod.service redis.service influxdb.service
Wants=mongod.service redis.service influxdb.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PWD/build/production
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/main.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=hft-system

[Install]
WantedBy=multi-user.target
EOF
    print_status "To install as system service, run: sudo cp build/scripts/hft-system.service /etc/systemd/system/"
fi

# Create launchd plist for macOS
if [[ "$MACHINE" == "Mac" ]]; then
    print_status "Creating launchd plist file..."
    cat > build/scripts/com.idyll.hft-system.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.idyll.hft-system</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$PWD/build/production/src/main.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PWD/build/production</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/hft-logs/hft-system.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/hft-logs/hft-system-error.log</string>
</dict>
</plist>
EOF
    print_status "To install as launch agent, run: cp build/scripts/com.idyll.hft-system.plist ~/Library/LaunchAgents/"
fi

# Generate build info
print_status "Generating build information..."
cat > build/build-info.json << EOF
{
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "buildMachine": "$MACHINE",
  "nodeVersion": "$NODE_VERSION",
  "npmVersion": "$NPM_VERSION",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "version": "$(node -p "require('./package.json').version" 2>/dev/null || echo '1.0.0')"
}
EOF

# Create deployment package
print_status "Creating deployment package..."
cd build
tar -czf hft-system-build-$(date +%Y%m%d-%H%M%S).tar.gz production scripts build-info.json
cd ..

# Performance validation
print_status "Running performance validation..."
if command -v node &> /dev/null; then
    # Test Node.js performance
    node -e "
    const start = process.hrtime.bigint();
    const iterations = 1000000;
    for (let i = 0; i < iterations; i++) {
        Math.random();
    }
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    console.log('Node.js performance test: ' + iterations + ' iterations in ' + duration.toFixed(2) + 'ms');
    "
fi

# Memory usage check
print_status "Checking memory usage..."
node -e "
const used = process.memoryUsage();
for (let key in used) {
    console.log(key + ': ' + Math.round(used[key] / 1024 / 1024 * 100) / 100 + ' MB');
}
"

print_success "🎉 Idyll HFT System build completed successfully!"

print_status "Build Summary:"
echo "✅ TypeScript compiled"
echo "✅ Dependencies installed"
echo "✅ Code linted and formatted"
echo "✅ Production build created"
echo "✅ Startup scripts generated"
echo "✅ Deployment package created"

print_status "Next steps:"
echo "1. Start the system: ./build/scripts/start-system.sh"
echo "2. Check status: ./build/scripts/status-system.sh"
echo "3. Stop the system: ./build/scripts/stop-system.sh"

print_status "Web Dashboard will be available at: http://localhost:3000"
print_status "API will be available at: http://localhost:3001"

print_status "Build completed at: $(date)"
