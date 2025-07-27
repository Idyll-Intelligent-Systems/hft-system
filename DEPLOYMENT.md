# Idyll HFT System - Complete Deployment Guide

## 🚀 Overview

The Idyll HFT (High-Frequency Trading) System is a comprehensive, production-ready platform designed for nanosecond-level latency trading operations. This guide provides complete instructions for installing, building, and running the system across all major operating systems.

## 📋 Prerequisites

### System Requirements
- **CPU**: Minimum 8 cores, Intel/AMD x64 or Apple Silicon (M1/M2)
- **RAM**: Minimum 16GB, Recommended 32GB+
- **Storage**: 50GB+ available space (SSD recommended)
- **Network**: Low-latency internet connection
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+/CentOS 8+)

### Network Ports
The system uses the following ports:
- `3000`: Web Dashboard
- `3001`: API Server
- `27017`: MongoDB
- `6379`: Redis
- `8086`: InfluxDB
- `9092`: Kafka
- `2181`: Zookeeper

## 🛠 Installation

### Windows

1. **Run as Administrator** - Open Command Prompt or PowerShell as Administrator
2. **Install Dependencies**:
   ```batch
   cd /path/to/hft-system
   scripts\install-dependencies.bat
   ```
3. **Build System**:
   ```batch
   scripts\build-system.bat
   ```
4. **Run System**:
   ```batch
   scripts\run-system.bat
   ```

### Linux

1. **Make scripts executable**:
   ```bash
   chmod +x scripts/*.sh
   ```
2. **Install Dependencies**:
   ```bash
   ./scripts/install-dependencies.sh
   ```
3. **Build System**:
   ```bash
   ./scripts/build-system.sh
   ```
4. **Run System**:
   ```bash
   ./scripts/run-system.sh
   ```

### macOS

1. **Install Xcode Command Line Tools** (if not already installed):
   ```bash
   xcode-select --install
   ```
2. **Make scripts executable**:
   ```bash
   chmod +x scripts/*.sh
   ```
3. **Install Dependencies** (use macOS-specific installer):
   ```bash
   ./scripts/install-dependencies-macos.sh
   ```
4. **Build System**:
   ```bash
   ./scripts/build-system.sh
   ```
5. **Run System**:
   ```bash
   ./scripts/run-system.sh
   ```

## 📊 System Components

### Core Services
- **Trading Engine**: Ultra-low latency order execution
- **Risk Manager**: Real-time risk assessment and control
- **Market Data Handler**: Multi-exchange data feeds
- **Strategy Engine**: AI-powered trading strategies
- **Web Dashboard**: Real-time monitoring interface

### Databases
- **MongoDB**: Trade and order storage
- **Redis**: High-speed caching and session storage
- **InfluxDB**: Time-series market data and metrics

### Message Queue
- **Apache Kafka**: Real-time data streaming and event processing

## 🖥 System Management

### Starting the System

**Windows**:
```batch
scripts\run-system.bat
```

**Linux/macOS**:
```bash
./scripts/run-system.sh
```

### Stopping the System

**Windows**:
```batch
stop-system.bat
```

**Linux/macOS**:
```bash
./stop-system.sh
```

### Monitoring System Health

**Windows**:
```batch
monitor-system.bat
```

**Linux/macOS**:
```bash
./monitor-system.sh
```

## 🌐 Access Points

Once the system is running, access the following endpoints:

- **Web Dashboard**: http://localhost:3000
- **API Endpoint**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **API Documentation**: http://localhost:3001/api/docs

## 📁 Directory Structure

```
hft-system/
├── src/                    # Source code
│   ├── core/              # Core trading engine
│   ├── strategies/        # Trading strategies
│   ├── risk/              # Risk management
│   ├── data/              # Market data handlers
│   ├── web/               # Web API
│   └── ai/                # AI/ML components
├── web/                   # Web dashboard
├── tests/                 # Test suites
├── scripts/               # Deployment scripts
│   ├── install-dependencies.sh     # Linux/macOS installer
│   ├── install-dependencies.bat    # Windows installer
│   ├── install-dependencies-macos.sh # macOS-specific installer
│   ├── build-system.sh            # Linux/macOS build script
│   ├── build-system.bat           # Windows build script
│   ├── run-system.sh              # Linux/macOS run script
│   └── run-system.bat             # Windows run script
├── build/                 # Build output
├── logs/                  # System logs
└── docs/                  # Documentation
```

## 🔧 Configuration

### Environment Variables

The system uses environment variables for configuration. These are automatically set during installation:

- `HFT_ENV`: Environment (development/production)
- `HFT_LOG_LEVEL`: Logging level
- `MONGODB_URL`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `INFLUXDB_URL`: InfluxDB connection string

### Configuration Files

- `src/core/config/`: Core system configuration
- `web/config/`: Web dashboard configuration
- `build/production/config/`: Production configuration

## 📝 Logs

System logs are stored in the `logs/` directory:

- `hft-system.log`: Main system log
- `web-dashboard.log`: Web dashboard log
- `system-health.log`: Health check log
- `mongodb.log`: MongoDB log
- `redis.log`: Redis log
- `influxdb.log`: InfluxDB log

## 🧪 Testing

Run the test suite:

**Windows**:
```batch
npm test
```

**Linux/macOS**:
```bash
npm test
```

## 🚀 Production Deployment

### Performance Optimization

The installation scripts automatically apply performance optimizations:

- **CPU Affinity**: Pins processes to specific CPU cores
- **Memory Management**: Optimizes memory allocation
- **Network Tuning**: Adjusts TCP/IP settings for low latency
- **Kernel Parameters**: Tunes OS-level settings

### Security

- All services run with minimal privileges
- Database connections are secured
- API endpoints use authentication
- Sensitive data is encrypted

### High Availability

- Automatic service restart on failure
- Health monitoring and alerting
- Database replication (configurable)
- Load balancing (configurable)

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   - Check if services are already running
   - Use `netstat -tulpn` (Linux/macOS) or `netstat -an` (Windows) to check ports

2. **Permission Denied**:
   - Run scripts as administrator/root
   - Check file permissions

3. **Dependencies Not Found**:
   - Re-run the installation script
   - Check system package manager

4. **Database Connection Failed**:
   - Verify database services are running
   - Check firewall settings
   - Verify connection strings

### Log Analysis

Check the system logs for detailed error information:

```bash
# View recent errors
tail -f logs/hft-system.log

# Search for specific errors
grep -i "error" logs/hft-system.log
```

### Support

For additional support:

1. Check the logs in the `logs/` directory
2. Run the health check script
3. Verify all dependencies are installed
4. Check system resource usage

## 📈 Performance Metrics

The system includes comprehensive performance monitoring:

- **Latency**: Order execution time
- **Throughput**: Orders per second
- **Resource Usage**: CPU, memory, network
- **Trading Metrics**: P&L, positions, risk metrics

Access metrics through:
- Web Dashboard: http://localhost:3000
- InfluxDB: http://localhost:8086
- API: http://localhost:3001/api/metrics

## 🔄 Updates and Maintenance

### System Updates

1. Stop the system: `./stop-system.sh`
2. Pull latest code
3. Rebuild: `./scripts/build-system.sh`
4. Restart: `./scripts/run-system.sh`

### Database Maintenance

- MongoDB: Regular backups and index optimization
- Redis: Memory usage monitoring
- InfluxDB: Data retention policy management

## 📚 API Documentation

The system provides comprehensive API documentation accessible at:
http://localhost:3001/api/docs

Key endpoints:
- `/api/health`: System health check
- `/api/trades`: Trading operations
- `/api/orders`: Order management
- `/api/positions`: Position tracking
- `/api/strategies`: Strategy management
- `/api/risk`: Risk metrics

## 🏗 Architecture

The system follows a microservices architecture with:

- **Event-driven design**: Kafka for message passing
- **Real-time processing**: Stream processing for market data
- **Scalable storage**: Time-series and document databases
- **AI/ML integration**: TensorFlow.js for predictive models
- **Web interface**: React-based dashboard

## 🎯 Trading Features

- **Multi-exchange support**: Connect to various trading venues
- **Strategy framework**: Implement custom trading strategies
- **Risk management**: Real-time risk monitoring and controls
- **Backtesting**: Historical strategy testing
- **Paper trading**: Risk-free strategy testing
- **Live trading**: Production trading with real money

## 📊 Monitoring and Alerting

- **Real-time dashboards**: Web-based monitoring
- **Performance metrics**: Latency and throughput tracking
- **Risk alerts**: Automated risk notifications
- **System health**: Service availability monitoring
- **Custom alerts**: Configurable notification system

---

**Version**: 1.0  
**Last Updated**: 2024  
**License**: Proprietary  

For technical support or questions, refer to the system logs and API documentation.
