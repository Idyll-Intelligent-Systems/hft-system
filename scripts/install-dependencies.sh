#!/bin/bash
# Linux/macOS Installation Script for Idyll HFT System
# Version: 1.0
# Compatible: Ubuntu 20.04+, macOS 11+

set -e  # Exit on any error

# Check for dry-run flag
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "[DRY-RUN] This is a dry run - no packages will be installed"
fi

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

# Function to run commands with dry-run support
run_cmd() {
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] Would run: $*"
    else
        "$@"
    fi
}

# Function to wait for package manager lock
wait_for_apt_lock() {
    local timeout=300  # 5 minutes timeout
    local elapsed=0
    local interval=5
    
    while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
        if [ $elapsed -ge $timeout ]; then
            print_error "Timeout waiting for package manager lock"
            return 1
        fi
        print_status "Waiting for package manager lock to be released... (${elapsed}s elapsed)"
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    return 0
}

# Function to run apt commands with lock handling
apt_install() {
    wait_for_apt_lock
    sudo apt-get "$@"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

print_status "Detected OS: $MACHINE"

# Check if running as root (not recommended)
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. This is not recommended for development."
   read -p "Continue anyway? (y/N): " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

print_status "Starting Idyll HFT System dependency installation..."

# Update system packages
print_status "Updating system packages..."
if [[ "$MACHINE" == "Linux" ]]; then
    apt_install update -y
    
    # Handle broken packages first (common in container environments)
    print_status "Checking for broken packages..."
    if ! sudo dpkg --configure -a 2>/dev/null; then
        print_warning "Found broken packages, attempting to fix..."
        
        # Fix the pcp package issue specifically
        if dpkg -l | grep -q "^ii.*pcp"; then
            print_status "Fixing pcp package configuration..."
            sudo dpkg --remove --force-remove-reinstreq pcp 2>/dev/null || true
        fi
        
        # Clean up any other broken packages
        sudo apt-get -f install -y || true
        sudo dpkg --configure -a || true
    fi
    
    # Perform upgrade with automatic handling of problematic packages
    print_status "Upgrading system packages..."
    DEBIAN_FRONTEND=noninteractive apt_install -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade -y
elif [[ "$MACHINE" == "Mac" ]]; then
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        print_status "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew update
fi

# Install essential build tools
print_status "Installing essential build tools..."
if [[ "$MACHINE" == "Linux" ]]; then
    apt_install install -y \
        curl \
        wget \
        git \
        build-essential \
        cmake \
        python3 \
        python3-pip \
        pkg-config \
        libssl-dev \
        libffi-dev \
        libxml2-dev \
        libxslt1-dev \
        zlib1g-dev \
        libjpeg-dev \
        libpng-dev \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
elif [[ "$MACHINE" == "Mac" ]]; then
    # Install Xcode command line tools if not present
    if ! xcode-select -p &> /dev/null; then
        print_status "Installing Xcode command line tools..."
        xcode-select --install
        read -p "Press enter after Xcode command line tools installation completes..."
    fi
    
    brew install \
        curl \
        wget \
        git \
        cmake \
        python3 \
        pkg-config \
        openssl \
        libffi \
        libxml2 \
        libxslt \
        zlib \
        jpeg \
        libpng
fi

# Install Node.js 20+
print_status "Installing Node.js 20..."
if [[ "$MACHINE" == "Linux" ]]; then
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt_install install -y nodejs
elif [[ "$MACHINE" == "Mac" ]]; then
    brew install node@20
    brew link node@20 --force
fi

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
    prettier

# Install MongoDB
print_status "Installing MongoDB..."
if [[ "$MACHINE" == "Linux" ]]; then
    # Check Ubuntu version and install appropriately
    UBUNTU_VERSION=$(lsb_release -rs)
    if [[ "$UBUNTU_VERSION" == "24.04" ]]; then
        print_status "Ubuntu 24.04 detected - using Docker for MongoDB..."
        # Install Docker if not present
        if ! command_exists docker; then
            print_status "Installing Docker..."
            sudo apt-get update
            sudo apt-get install -y docker.io
            sudo systemctl start docker || sudo service docker start
            sudo systemctl enable docker || true
            sudo usermod -aG docker $USER
        fi
        
        # Install MongoDB via Docker
        sudo docker pull mongo:7.0
        
        # Create MongoDB data directory
        sudo mkdir -p /var/lib/mongodb-docker
        sudo chown $USER:$USER /var/lib/mongodb-docker
        
        # Create MongoDB service for Docker
        sudo tee /etc/systemd/system/mongodb-docker.service > /dev/null <<EOF
[Unit]
Description=MongoDB Docker Container
After=docker.service
Requires=docker.service

[Service]
Type=forking
ExecStart=/usr/bin/docker run -d --name mongodb -p 27017:27017 -v /var/lib/mongodb-docker:/data/db mongo:7.0
ExecStop=/usr/bin/docker stop mongodb
ExecStopPost=/usr/bin/docker rm mongodb
TimeoutStartSec=0
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF
        
        # Try to start with systemd, fallback to direct docker run
        if command -v systemctl &> /dev/null && sudo systemctl daemon-reload 2>/dev/null && sudo systemctl enable mongodb-docker 2>/dev/null; then
            sudo systemctl start mongodb-docker 2>/dev/null || {
                print_warning "Systemd not fully available, starting MongoDB container directly..."
                # Remove any existing container first
                sudo docker rm -f mongodb 2>/dev/null || true
                sudo docker run -d --name mongodb -p 27017:27017 -v /var/lib/mongodb-docker:/data/db mongo:7.0
            }
        else
            print_warning "Systemd not available, starting MongoDB container directly..."
            # Remove any existing container first
            sudo docker rm -f mongodb 2>/dev/null || true
            sudo docker run -d --name mongodb -p 27017:27017 -v /var/lib/mongodb-docker:/data/db mongo:7.0
        fi
    else
        # For older Ubuntu versions, use official MongoDB repository
        wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        sudo apt-get update
        sudo apt-get install -y mongodb-org
        sudo systemctl start mongod
        sudo systemctl enable mongod
    fi
    
elif [[ "$MACHINE" == "Mac" ]]; then
    brew tap mongodb/brew
    brew install mongodb-community@7.0
    
    # Start MongoDB service
    brew services start mongodb/brew/mongodb-community
fi

# Install Redis
print_status "Installing Redis..."
if [[ "$MACHINE" == "Linux" ]]; then
    sudo apt-get install -y redis-server
    sudo systemctl start redis-server || sudo service redis-server start
    sudo systemctl enable redis-server || true
elif [[ "$MACHINE" == "Mac" ]]; then
    brew install redis
    brew services start redis
fi

# Install InfluxDB
print_status "Installing InfluxDB..."
if [[ "$MACHINE" == "Linux" ]]; then
    # For Ubuntu 24.04, use a more compatible approach
    UBUNTU_VERSION=$(lsb_release -rs)
    if [[ "$UBUNTU_VERSION" == "24.04" ]]; then
        print_status "Ubuntu 24.04 detected - checking InfluxDB installation options..."
        
        # Try snap first, fallback to Docker if snap is not available
        if command_exists snap; then
            print_status "Installing InfluxDB via snap..."
            sudo snap install influxdb
        else
            print_status "Snap not available - installing InfluxDB via Docker..."
            # Install Docker if not present
            if ! command_exists docker; then
                print_status "Installing Docker..."
                sudo apt-get update
                sudo apt-get install -y docker.io
                sudo systemctl start docker || sudo service docker start
                sudo systemctl enable docker || true
                sudo usermod -aG docker $USER
            fi
            
            # Install InfluxDB via Docker
            sudo docker pull influxdb:2.7
            
            # Create InfluxDB data directory
            sudo mkdir -p /var/lib/influxdb-docker
            sudo chown $USER:$USER /var/lib/influxdb-docker
            
            # Create InfluxDB service for Docker
            sudo tee /etc/systemd/system/influxdb-docker.service > /dev/null <<EOF
[Unit]
Description=InfluxDB Docker Container
After=docker.service
Requires=docker.service

[Service]
Type=forking
ExecStart=/usr/bin/docker run -d --name influxdb -p 8086:8086 -v /var/lib/influxdb-docker:/var/lib/influxdb2 influxdb:2.7
ExecStop=/usr/bin/docker stop influxdb
ExecStopPost=/usr/bin/docker rm influxdb
TimeoutStartSec=0
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF
            
            # Try to start with systemd, fallback to direct docker run
            if command -v systemctl &> /dev/null && sudo systemctl daemon-reload 2>/dev/null && sudo systemctl enable influxdb-docker 2>/dev/null; then
                sudo systemctl start influxdb-docker 2>/dev/null || {
                    print_warning "Systemd not fully available, starting InfluxDB container directly..."
                    # Remove any existing container first
                    sudo docker rm -f influxdb 2>/dev/null || true
                    sudo docker run -d --name influxdb -p 8086:8086 -v /var/lib/influxdb-docker:/var/lib/influxdb2 influxdb:2.7
                }
            else
                print_warning "Systemd not fully available, starting InfluxDB container directly..."
                # Remove any existing container first
                sudo docker rm -f influxdb 2>/dev/null || true
                sudo docker run -d --name influxdb -p 8086:8086 -v /var/lib/influxdb-docker:/var/lib/influxdb2 influxdb:2.7
            fi
        fi
    else
        # Add InfluxDB repository for older versions
        wget -qO- https://repos.influxdata.com/influxdb.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/influxdb.gpg > /dev/null
        export DISTRIB_ID=$(lsb_release -si); export DISTRIB_CODENAME=$(lsb_release -sc)
        echo "deb [signed-by=/etc/apt/trusted.gpg.d/influxdb.gpg] https://repos.influxdata.com/${DISTRIB_ID,,} ${DISTRIB_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/influxdb.list > /dev/null
        
        sudo apt-get update
        sudo apt-get install -y influxdb2
        
        # Start and enable InfluxDB
        sudo systemctl start influxdb
        sudo systemctl enable influxdb
    fi
    
elif [[ "$MACHINE" == "Mac" ]]; then
    brew install influxdb
    brew services start influxdb
fi

# Install Apache Kafka
print_status "Installing Apache Kafka..."
if [[ "$MACHINE" == "Linux" ]]; then
    # Install Java (required for Kafka)
    sudo apt-get install -y openjdk-11-jdk
    
    # Download and install Kafka (using current version)
    cd /opt
    
    # Clean up any existing Kafka installations
    sudo rm -rf kafka* 2>/dev/null || true
    
    # Try to download Kafka with fallback versions
    KAFKA_VERSIONS=("3.8.0" "3.7.1" "3.7.0" "3.6.2")
    KAFKA_DOWNLOADED=false
    
    for version in "${KAFKA_VERSIONS[@]}"; do
        print_status "Attempting to download Kafka ${version}..."
        if sudo wget "https://downloads.apache.org/kafka/${version}/kafka_2.13-${version}.tgz"; then
            sudo tar -xzf "kafka_2.13-${version}.tgz"
            sudo mv "kafka_2.13-${version}" kafka
            sudo chown -R $USER:$USER /opt/kafka
            sudo rm -f "kafka_2.13-${version}.tgz"
            KAFKA_DOWNLOADED=true
            print_success "Kafka ${version} downloaded and installed successfully"
            break
        else
            print_warning "Failed to download Kafka ${version}, trying next version..."
            sudo rm -f "kafka_2.13-${version}.tgz" 2>/dev/null || true
        fi
    done
    
    if [[ "$KAFKA_DOWNLOADED" == "false" ]]; then
        print_error "Failed to download any Kafka version. Please install manually."
    fi
    
elif [[ "$MACHINE" == "Mac" ]]; then
    brew install kafka
fi

# Install Docker and Docker Compose
print_status "Installing Docker..."
if [[ "$MACHINE" == "Linux" ]]; then
    # Remove any conflicting Docker packages first
    print_status "Removing conflicting Docker packages..."
    sudo apt-get remove -y docker docker-engine docker.io containerd runc moby-engine moby-cli moby-buildx moby-compose 2>/dev/null || true
    
    # Clean up conflicting packages that might prevent Docker installation
    sudo apt-get autoremove -y || true
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    
    # Install Docker with conflict resolution
    print_status "Installing Docker CE..."
    if ! sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin; then
        print_warning "Standard Docker installation failed, trying alternative approach..."
        
        # Remove any problematic moby packages that might conflict
        sudo apt-get remove -y moby-tini 2>/dev/null || true
        
        # Try installing again
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    fi
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Start and enable Docker
    sudo systemctl start docker || sudo service docker start
    sudo systemctl enable docker || true
    
elif [[ "$MACHINE" == "Mac" ]]; then
    print_warning "Please install Docker Desktop for macOS from: https://docs.docker.com/desktop/install/mac-install/"
    print_warning "This script cannot automatically install Docker Desktop on macOS."
fi

# Install Python packages for AI/ML
print_status "Installing Python packages for AI/ML..."
pip3 install \
    numpy \
    pandas \
    scikit-learn \
    tensorflow \
    torch \
    jupyter \
    matplotlib \
    seaborn \
    plotly

# Install system monitoring tools
print_status "Installing system monitoring tools..."
if [[ "$MACHINE" == "Linux" ]]; then
    # Don't install dstat (pcp) in container environments due to systemd conflicts
    if [[ -f /.dockerenv ]] || ! systemctl is-system-running >/dev/null 2>&1; then
        print_status "Skipping dstat/pcp - systemd not available in container"
        apt_install install -y htop iotop nethogs tcpdump wireshark-common sysstat
    else
        apt_install install -y htop iotop nethogs tcpdump wireshark-common sysstat dstat
    fi
elif [[ "$MACHINE" == "Mac" ]]; then
    brew install \
        htop \
        iftop \
        tcpdump \
        wireshark \
        glances
fi

# Create necessary directories
print_status "Creating project directories..."
mkdir -p ~/hft-logs
mkdir -p ~/hft-data
mkdir -p ~/hft-backups
mkdir -p ~/.hft-config

# Set up environment variables
print_status "Setting up environment variables..."
cat > ~/.hft-env << 'EOF'
# Idyll HFT System Environment Variables
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
EOF

# Add environment variables to shell profile
if [[ -f ~/.bashrc ]]; then
    echo "source ~/.hft-env" >> ~/.bashrc
fi
if [[ -f ~/.zshrc ]]; then
    echo "source ~/.hft-env" >> ~/.zshrc
fi

# Install project dependencies
print_status "Installing project Node.js dependencies..."
if [[ -f "package.json" ]]; then
    npm install
else
    print_warning "package.json not found. Make sure you're in the project directory."
fi

# Set up system optimizations for trading
print_status "Applying system optimizations for low-latency trading..."
if [[ "$MACHINE" == "Linux" ]]; then
    # Kernel parameters for low latency
    sudo tee /etc/sysctl.d/99-hft-optimizations.conf > /dev/null << 'EOF'
# HFT System Optimizations
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_fastopen = 3
net.core.default_qdisc = fq
vm.swappiness = 1
kernel.numa_balancing = 0
EOF
    
    sudo sysctl -p /etc/sysctl.d/99-hft-optimizations.conf
    
    # CPU governor for performance
    echo 'GOVERNOR="performance"' | sudo tee /etc/default/cpufrequtils > /dev/null
    
    # Disable CPU frequency scaling
    for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
        if [[ -f "$cpu" ]]; then
            echo performance | sudo tee "$cpu" > /dev/null
        fi
    done
fi

# Verify installations
print_status "Verifying installations..."

# Node.js verification
if command -v node &> /dev/null; then
    print_success "Node.js: $(node --version)"
else
    print_error "Node.js installation failed"
fi

# MongoDB verification
if command -v mongod &> /dev/null; then
    print_success "MongoDB: $(mongod --version | head -n1)"
else
    print_error "MongoDB installation failed"
fi

# Redis verification
if command -v redis-server &> /dev/null; then
    print_success "Redis: $(redis-server --version)"
else
    print_error "Redis installation failed"
fi

# InfluxDB verification
if command -v influxd &> /dev/null; then
    print_success "InfluxDB: $(influxd version)"
else
    print_error "InfluxDB installation failed"
fi

# Docker verification
if command -v docker &> /dev/null; then
    print_success "Docker: $(docker --version)"
else
    print_error "Docker installation failed"
fi

print_success "🎉 Idyll HFT System dependencies installation completed!"

print_status "Next steps:"
echo "1. Source the environment variables: source ~/.hft-env"
echo "2. Run the build script: ./scripts/build-system.sh"
echo "3. Start the system: ./scripts/run-system.sh"

if [[ "$MACHINE" == "Linux" ]] && groups $USER | grep -q docker; then
    print_warning "You've been added to the docker group. Please log out and log back in for the changes to take effect."
fi

print_status "Installation log saved to: ~/hft-installation.log"
