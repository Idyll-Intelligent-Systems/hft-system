# HFT System Docker Setup

This document provides instructions for running the Idyll HFT System using Docker containers for a complete end-to-end deployment.

## 🚀 Quick Start

### Prerequisites
- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- At least 4GB RAM available for containers
- At least 10GB disk space

### 1. Initial Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd hft-system

# Copy and configure environment variables
cp .env.example .env
# Edit .env file with your specific settings
nano .env
```

### 2. Start the Complete System

```bash
# Build and start all services
./docker-run.sh start

# Or use docker-compose directly
docker-compose up -d
```

### 3. Access the System

Once started, you can access:

- **Main Web Interface**: http://localhost:3000
- **Trading Dashboard**: http://localhost:3000/trading
- **System Monitor**: http://localhost:3000/monitor
- **Grafana Monitoring**: http://localhost:3001 (admin/hft-admin)
- **Load Balancer**: http://localhost:80

## 📋 Available Commands

Use the `docker-run.sh` script for easy management:

```bash
./docker-run.sh build      # Build Docker image
./docker-run.sh start      # Start complete system
./docker-run.sh stop       # Stop all services
./docker-run.sh restart    # Restart all services
./docker-run.sh logs       # View all logs
./docker-run.sh status     # Show system status
./docker-run.sh shell      # Open shell in container
./docker-run.sh backup     # Backup persistent data
./docker-run.sh clean      # Remove all containers/images
./docker-run.sh update     # Update and rebuild system
```

## 🏗️ Architecture

The Docker setup includes:

### Core Services
- **hft-system**: Main trading application
- **redis**: High-speed caching and real-time data
- **mongodb**: Persistent data storage
- **influxdb**: Time-series data for metrics
- **grafana**: Monitoring and visualization
- **nginx**: Reverse proxy and load balancer

### Network Configuration
- Internal network: `172.20.0.0/16`
- All services communicate via Docker network
- External access through configured ports

### Data Persistence
- MongoDB data: `mongodb_data` volume
- InfluxDB data: `influxdb_data` volume
- Redis data: `redis_data` volume
- Grafana dashboards: `grafana_data` volume
- Application logs: `./logs` directory
- Trading data: `./data` directory

## ⚙️ Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Database credentials
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password

# InfluxDB settings
INFLUXDB_USERNAME=admin
INFLUXDB_PASSWORD=your-influx-password
INFLUXDB_ORG=idyll-hft-systems
INFLUXDB_BUCKET=trading-data

# Trading configuration
ENABLE_LIVE_TRADING=false
PAPER_TRADING_MODE=true
MAX_POSITION_SIZE=10000
RISK_LIMIT_PERCENT=2.0
```

### Service Configuration

Each service has dedicated configuration files in the `config/` directory:

- `config/redis.conf` - Redis optimization settings
- `config/mongo-init.js` - MongoDB initialization
- `config/nginx/nginx.conf` - Load balancer configuration
- `config/grafana/` - Monitoring dashboards

## 🔧 Development

### Building Custom Images

```bash
# Build only the main application
docker build -t idyll-hft-system:latest .

# Build with specific tag
docker build -t idyll-hft-system:v1.0.0 .
```

### Development Mode

For development with hot reloading:

```bash
# Override docker-compose for development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Debugging

```bash
# View logs for specific service
./docker-run.sh logs hft-system

# Open shell in running container
./docker-run.sh shell

# Check container resource usage
docker stats

# Inspect container details
docker inspect idyll-hft-system
```

## 📊 Monitoring

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect --format='{{json .State.Health}}' idyll-hft-system
```

### Grafana Dashboards

Access Grafana at http://localhost:3001:
- Username: `admin`
- Password: Set in `.env` file (default: `hft-admin`)

Pre-configured dashboards monitor:
- Trading performance metrics
- System resource usage
- Database performance
- Network latency

### Log Management

```bash
# Follow all logs
./docker-run.sh logs

# Follow specific service logs
./docker-run.sh logs hft-system

# View logs inside container
docker-compose exec hft-system tail -f logs/main.log
```

## 🔒 Security

### Network Security
- Services communicate via private Docker network
- External access only through defined ports
- Nginx proxy provides additional security layer

### Database Security
- MongoDB with authentication enabled
- Redis with optional password protection
- InfluxDB with token-based authentication

### Application Security
- Non-root user in containers
- Minimal base images (Alpine Linux)
- Security headers in Nginx configuration

## 🚀 Production Deployment

### Resource Requirements

Minimum production requirements:
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Network**: 1Gbps for HFT operations

### Scaling

```bash
# Scale specific services
docker-compose up -d --scale hft-system=3

# Use external load balancer for multiple instances
# Configure nginx upstream with multiple backend servers
```

### SSL/TLS Setup

1. Place SSL certificates in `config/nginx/ssl/`
2. Update `nginx.conf` to enable HTTPS
3. Restart nginx service

### Backup Strategy

```bash
# Create backup
./docker-run.sh backup

# Automated backups with cron
0 2 * * * /path/to/hft-system/docker-run.sh backup > /var/log/hft-backup.log 2>&1
```

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check ports in use
   netstat -tulpn | grep -E ':(3000|8080|6379|27017|8086)'
   
   # Change ports in docker-compose.yml if needed
   ```

2. **Memory issues**
   ```bash
   # Increase Docker memory limit
   docker system prune -a
   
   # Check memory usage
   docker stats --no-stream
   ```

3. **Permission issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER data/ logs/
   chmod 755 *.sh
   ```

4. **Service startup failures**
   ```bash
   # Check service logs
   ./docker-run.sh logs [service-name]
   
   # Restart specific service
   docker-compose restart [service-name]
   ```

### Performance Tuning

1. **Redis optimization**
   - Adjust `maxmemory` in `config/redis.conf`
   - Enable AOF for persistence

2. **MongoDB tuning**
   - Configure appropriate indexes
   - Adjust memory settings

3. **Application tuning**
   - Set appropriate `MAX_WORKERS` in `.env`
   - Adjust `MEMORY_LIMIT` and `CPU_LIMIT`

## 📞 Support

For issues and questions:
1. Check the logs: `./docker-run.sh logs`
2. Review configuration files in `config/`
3. Ensure all environment variables are set correctly
4. Verify Docker and Docker Compose versions

## 🔄 Updates

To update the system:

```bash
# Pull latest changes and rebuild
./docker-run.sh update

# Or manually
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
