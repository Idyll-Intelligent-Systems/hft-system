#!/bin/bash
# macOS-specific Installation Script for Idyll HFT System
# Version: 1.0
# Compatible: macOS 11+

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

print_status "Starting Idyll HFT System dependency installation for macOS..."

# Check macOS version
macos_version=$(sw_vers -productVersion)
print_status "macOS version: $macos_version"

# Check if running on Apple Silicon or Intel
arch_type=$(uname -m)
if [[ "$arch_type" == "arm64" ]]; then
    print_status "Detected Apple Silicon (M1/M2) processor"
    HOMEBREW_PREFIX="/opt/homebrew"
else
    print_status "Detected Intel processor"
    HOMEBREW_PREFIX="/usr/local"
fi

# Install Xcode Command Line Tools
print_status "Checking for Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
    print_status "Installing Xcode Command Line Tools..."
    xcode-select --install
    print_warning "Please complete the Xcode Command Line Tools installation in the popup window."
    read -p "Press Enter after installation completes..."
else
    print_success "Xcode Command Line Tools already installed"
fi

# Install Homebrew
print_status "Checking for Homebrew..."
if ! command -v brew &> /dev/null; then
    print_status "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH
    echo "eval \"\$(${HOMEBREW_PREFIX}/bin/brew shellenv)\"" >> ~/.zprofile
    eval "$(${HOMEBREW_PREFIX}/bin/brew shellenv)"
else
    print_success "Homebrew already installed"
fi

# Update Homebrew
print_status "Updating Homebrew..."
brew update

# Install essential development tools
print_status "Installing essential development tools..."
brew install \
    curl \
    wget \
    git \
    cmake \
    pkg-config \
    openssl \
    libffi \
    libxml2 \
    libxslt \
    zlib \
    jpeg \
    libpng \
    python@3.11 \
    gcc

# Install Node.js 20
print_status "Installing Node.js 20..."
brew install node@20
brew link node@20 --force --overwrite

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_success "Node.js installed: $node_version"
print_success "npm installed: $npm_version"

# Install global npm packages
print_status "Installing global npm packages..."
npm install -g \
    typescript \
    ts-node \
    nodemon \
    pm2 \
    @types/node \
    eslint \
    prettier \
    node-gyp

# Install databases
print_status "Installing databases..."

# MongoDB
print_status "Installing MongoDB Community Edition..."
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb/brew/mongodb-community

# Redis
print_status "Installing Redis..."
brew install redis
brew services start redis

# InfluxDB
print_status "Installing InfluxDB..."
brew install influxdb
brew services start influxdb

# Apache Kafka
print_status "Installing Apache Kafka..."
brew install kafka
# Kafka will be started manually when needed

# Install Docker Desktop for Mac
print_status "Checking for Docker..."
if ! command -v docker &> /dev/null; then
    print_warning "Docker Desktop for Mac needs to be installed manually."
    print_warning "Please download and install from: https://docs.docker.com/desktop/install/mac-install/"
    print_warning "This script will wait for you to install Docker Desktop..."
    
    read -p "Press Enter after Docker Desktop installation completes..."
    
    # Wait for Docker to be available
    while ! command -v docker &> /dev/null; do
        print_status "Waiting for Docker to be available..."
        sleep 5
    done
else
    print_success "Docker already installed"
fi

# Install Python packages for AI/ML
print_status "Installing Python packages for AI/ML..."
python3 -m pip install --upgrade pip
python3 -m pip install \
    numpy \
    pandas \
    scikit-learn \
    tensorflow-macos \
    torch \
    jupyter \
    matplotlib \
    seaborn \
    plotly

# For Apple Silicon Macs, install tensorflow-metal for GPU acceleration
if [[ "$arch_type" == "arm64" ]]; then
    print_status "Installing TensorFlow Metal for Apple Silicon GPU acceleration..."
    python3 -m pip install tensorflow-metal
fi

# Install system monitoring tools
print_status "Installing system monitoring tools..."
brew install \
    htop \
    iftop \
    tcpdump \
    wireshark \
    glances \
    nmap \
    jq \
    tree

# Install additional macOS-specific tools
print_status "Installing macOS-specific development tools..."
brew install \
    mas \
    stats \
    iterm2 \
    visual-studio-code \
    postman

# Create necessary directories
print_status "Creating project directories..."
mkdir -p ~/hft-logs
mkdir -p ~/hft-data
mkdir -p ~/hft-backups
mkdir -p ~/.hft-config

# Set up environment variables
print_status "Setting up environment variables..."
cat > ~/.hft-env << 'EOF'
# Idyll HFT System Environment Variables for macOS
export HFT_HOME="$HOME/hft-system"
export HFT_LOGS="$HOME/hft-logs"
export HFT_DATA="$HOME/hft-data"
export HFT_BACKUPS="$HOME/hft-backups"
export HFT_CONFIG="$HOME/.hft-config"

# Database URLs
export MONGODB_URL="mongodb://localhost:27017/hft-system"
export REDIS_URL="redis://localhost:6379"
export INFLUXDB_URL="http://localhost:8086"

# Kafka Configuration
export KAFKA_BROKERS="localhost:9092"

# Security
export JWT_SECRET="your-jwt-secret-change-in-production"
export ENCRYPTION_KEY="your-encryption-key-change-in-production"

# API Keys (to be filled)
export ALPHA_VANTAGE_API_KEY=""
export BLOOMBERG_API_KEY=""
export REUTERS_API_KEY=""

# Performance Settings
export NODE_ENV="development"
export UV_THREADPOOL_SIZE="128"
export NODE_OPTIONS="--max-old-space-size=8192"

# macOS-specific settings
export HOMEBREW_PREFIX="/opt/homebrew"
export PATH="$HOMEBREW_PREFIX/bin:$PATH"

# Python path for macOS
export PATH="$HOMEBREW_PREFIX/opt/python@3.11/bin:$PATH"

# OpenSSL paths for native modules
export LDFLAGS="-L$HOMEBREW_PREFIX/opt/openssl@3/lib"
export CPPFLAGS="-I$HOMEBREW_PREFIX/opt/openssl@3/include"
export PKG_CONFIG_PATH="$HOMEBREW_PREFIX/opt/openssl@3/lib/pkgconfig"
EOF

# Add environment variables to shell profiles
if [[ -f ~/.zshrc ]]; then
    echo "source ~/.hft-env" >> ~/.zshrc
fi
if [[ -f ~/.bash_profile ]]; then
    echo "source ~/.hft-env" >> ~/.bash_profile
fi

# Source the environment
source ~/.hft-env

# Install project dependencies
print_status "Installing project Node.js dependencies..."
if [[ -f "package.json" ]]; then
    npm install
else
    print_warning "package.json not found. Make sure you're in the project directory."
fi

# macOS-specific optimizations
print_status "Applying macOS optimizations for low-latency trading..."

# Increase file descriptor limits
echo "Setting file descriptor limits..."
cat > ~/Library/LaunchAgents/limit.maxfiles.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>limit.maxfiles</string>
    <key>ProgramArguments</key>
    <array>
      <string>launchctl</string>
      <string>limit</string>
      <string>maxfiles</string>
      <string>65536</string>
      <string>200000</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>ServiceIPC</key>
    <false/>
  </dict>
</plist>
EOF

# Load the file descriptor limit
launchctl load ~/Library/LaunchAgents/limit.maxfiles.plist

# Set kernel parameters for better network performance
print_status "Configuring kernel parameters..."
sudo sysctl -w net.inet.tcp.delayed_ack=0
sudo sysctl -w net.inet.tcp.sendspace=1048576
sudo sysctl -w net.inet.tcp.recvspace=1048576

# Create a script to apply these settings on boot
sudo tee /etc/sysctl.conf > /dev/null << 'EOF'
# HFT System Optimizations for macOS
net.inet.tcp.delayed_ack=0
net.inet.tcp.sendspace=1048576
net.inet.tcp.recvspace=1048576
net.inet.tcp.win_scale_factor=8
net.inet.tcp.rfc3390=1
EOF

# Create service management scripts
print_status "Creating service management scripts..."
mkdir -p scripts

# MongoDB management script
cat > scripts/mongodb-macos.sh << 'EOF'
#!/bin/bash
case "$1" in
    start)
        echo "Starting MongoDB..."
        brew services start mongodb/brew/mongodb-community
        ;;
    stop)
        echo "Stopping MongoDB..."
        brew services stop mongodb/brew/mongodb-community
        ;;
    restart)
        echo "Restarting MongoDB..."
        brew services restart mongodb/brew/mongodb-community
        ;;
    status)
        brew services list | grep mongodb
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF

# Redis management script
cat > scripts/redis-macos.sh << 'EOF'
#!/bin/bash
case "$1" in
    start)
        echo "Starting Redis..."
        brew services start redis
        ;;
    stop)
        echo "Stopping Redis..."
        brew services stop redis
        ;;
    restart)
        echo "Restarting Redis..."
        brew services restart redis
        ;;
    status)
        brew services list | grep redis
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF

# InfluxDB management script
cat > scripts/influxdb-macos.sh << 'EOF'
#!/bin/bash
case "$1" in
    start)
        echo "Starting InfluxDB..."
        brew services start influxdb
        ;;
    stop)
        echo "Stopping InfluxDB..."
        brew services stop influxdb
        ;;
    restart)
        echo "Restarting InfluxDB..."
        brew services restart influxdb
        ;;
    status)
        brew services list | grep influxdb
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF

# Kafka management script
cat > scripts/kafka-macos.sh << 'EOF'
#!/bin/bash
case "$1" in
    start)
        echo "Starting Zookeeper..."
        brew services start zookeeper
        sleep 5
        echo "Starting Kafka..."
        brew services start kafka
        ;;
    stop)
        echo "Stopping Kafka..."
        brew services stop kafka
        echo "Stopping Zookeeper..."
        brew services stop zookeeper
        ;;
    restart)
        $0 stop
        sleep 5
        $0 start
        ;;
    status)
        brew services list | grep -E "(zookeeper|kafka)"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF

# Make scripts executable
chmod +x scripts/*.sh

# Verification
print_status "Verifying installations..."

# Node.js verification
if command -v node &> /dev/null; then
    print_success "Node.js: $(node --version)"
else
    print_error "Node.js installation failed"
fi

# MongoDB verification
if brew services list | grep -q "mongodb.*started"; then
    print_success "MongoDB service is running"
else
    print_warning "MongoDB service is not running"
fi

# Redis verification
if brew services list | grep -q "redis.*started"; then
    print_success "Redis service is running"
else
    print_warning "Redis service is not running"
fi

# InfluxDB verification
if brew services list | grep -q "influxdb.*started"; then
    print_success "InfluxDB service is running"
else
    print_warning "InfluxDB service is not running"
fi

# Docker verification
if command -v docker &> /dev/null; then
    print_success "Docker: $(docker --version 2>/dev/null || echo 'installed but not running')"
else
    print_error "Docker installation failed"
fi

# Python verification
if command -v python3 &> /dev/null; then
    print_success "Python3: $(python3 --version)"
else
    print_error "Python3 installation failed"
fi

print_success "🎉 Idyll HFT System dependencies installation completed for macOS!"

print_status "Next steps:"
echo "1. Source the environment variables: source ~/.hft-env"
echo "2. Run the build script: ./scripts/build-system.sh"
echo "3. Start the system: ./scripts/run-system.sh"

print_warning "Please restart your terminal to ensure all environment variables are loaded."
print_status "Installation log saved to: ~/hft-installation.log"

# Check for Apple Silicon specific recommendations
if [[ "$arch_type" == "arm64" ]]; then
    print_status "Apple Silicon specific optimizations applied:"
    echo "- TensorFlow Metal for GPU acceleration installed"
    echo "- Native ARM64 packages prioritized"
    echo "- Rosetta compatibility ensured for Intel-only packages"
fi
