# HFT System - Docker Build & Run Instructions

## Overview
This document provides complete instructions for building and running the Idyll High-Frequency Trading (HFT) System using Docker.

## Quick Start Commands

### 1. Build and Start the Complete System
```bash
# Build and start all services
cd /workspaces/hft-system
./docker-run.sh start

# Or use docker-compose directly
docker-compose up --build -d
```

### 2. Check System Status
```bash
# Check all container status
./docker-run.sh status

# Or use docker-compose
docker-compose ps
```

### 3. View Logs
```bash
# View all logs
./docker-run.sh logs

# View specific service logs
docker-compose logs hft-system -f
docker-compose logs nginx -f
docker-compose logs grafana -f
```

### 4. Stop the System
```bash
# Stop all services
./docker-run.sh stop

# Or use docker-compose
docker-compose down
```

## Detailed Instructions

### Prerequisites
- Docker installed and running
- Docker Compose v2.0+ installed
- At least 4GB RAM available
- Ports 80, 443, 3000, 3001, 3100, 6379, 8080, 8087, 27018 available

### Step-by-Step Setup

#### 1. Clone and Navigate to Project
```bash
cd /workspaces/hft-system
```

#### 2. Environment Setup (Optional)
Create a `.env` file for custom configuration:
```bash
cat > .env << EOF
# Database Credentials
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=hft-secure-pass-2024
GRAFANA_PASSWORD=hft-admin-2024

# InfluxDB Configuration
INFLUXDB_USERNAME=admin
INFLUXDB_PASSWORD=hft-secure-pass-2024
INFLUXDB_ORG=hft-org
INFLUXDB_BUCKET=hft-data
INFLUXDB_TOKEN=hft-super-secret-token-2024

# Application Settings
NODE_ENV=production
WEB_PORT=3000
EOF
```

#### 3. Build and Deploy
```bash
# Method 1: Using the provided script (Recommended)
./docker-run.sh start

# Method 2: Using docker-compose directly
docker-compose up --build -d

# Method 3: Step by step
docker-compose build
docker-compose up -d
```

#### 4. Verify Deployment
```bash
# Check container health
docker-compose ps

# Check logs for any errors
docker-compose logs --tail=50

# Test web interface
curl -f http://localhost:3000/health
curl -f http://localhost:80/health
```

### Access Points

Once the system is running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Main Dashboard** | http://localhost:80 | Primary web interface (via Nginx) |
| **Direct Access** | http://localhost:3000 | Direct access to HFT system |
| **Trading Interface** | http://localhost:80/trading | Trading operations panel |
| **System Monitor** | http://localhost:80/monitor | System health monitoring |
| **Grafana Dashboard** | http://localhost:3001 | Advanced monitoring and visualization |
| **Health Check** | http://localhost:80/health | System health endpoint |

### Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| **Grafana** | admin | hft-admin-2024 |
| **MongoDB** | admin | hft-secure-pass-2024 |
| **InfluxDB** | admin | hft-secure-pass-2024 |

## Container Architecture

### Services Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Nginx Proxy                         │
│                   (Port 80/443)                        │
└─────────────────────┬───────────────────────────────────┘
                      │
    ┌─────────────────┼───────────────────────────────────┐
    │                 │                                   │
    ▼                 ▼                                   ▼
┌─────────┐    ┌─────────────┐                    ┌─────────────┐
│ HFT     │    │  Grafana    │                    │  External   │
│ System  │    │ (Port 3001) │                    │  Services   │
│(Port    │    └─────────────┘                    └─────────────┘
│3000/8080│           │
└─────────┘           │
    │                 │
    │         ┌───────┴────────┬────────────────┬──────────────┐
    │         │                │                │              │
    ▼         ▼                ▼                ▼              ▼
┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐
│  Redis  │ │ MongoDB │ │  InfluxDB   │ │   Market    │ │    AI      │
│(Port    │ │(Port    │ │ (Port 8087) │ │    Data     │ │  Agents    │
│ 6379)   │ │ 27018)  │ │             │ │   Feeds     │ │            │
└─────────┘ └─────────┘ └─────────────┘ └─────────────┘ └────────────┘
```

### Port Mapping
- **80**: Nginx reverse proxy (HTTP)
- **443**: Nginx reverse proxy (HTTPS - if SSL configured)
- **3000**: HFT System main web interface
- **3001**: Grafana monitoring dashboard  
- **3100**: Alternative web interface port
- **6379**: Redis cache
- **8080**: HFT System API endpoints
- **8087**: InfluxDB time-series database
- **27018**: MongoDB document database

## Management Commands

### Using docker-run.sh Script
```bash
# Build containers
./docker-run.sh build

# Start all services
./docker-run.sh start

# Stop all services  
./docker-run.sh stop

# Restart all services
./docker-run.sh restart

# View logs
./docker-run.sh logs

# Check status
./docker-run.sh status

# Open shell in main container
./docker-run.sh shell

# Clean up containers and images
./docker-run.sh clean

# Backup data
./docker-run.sh backup

# Update and rebuild
./docker-run.sh update
```

### Using Docker Compose Directly
```bash
# Build and start
docker-compose up --build -d

# Start existing containers
docker-compose start

# Stop containers
docker-compose stop

# Stop and remove containers
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Scale a service
docker-compose up -d --scale hft-system=2

# Execute commands in container
docker-compose exec hft-system bash
```

### Individual Container Management
```bash
# Start specific service
docker-compose start hft-system

# Stop specific service
docker-compose stop hft-system

# Restart specific service  
docker-compose restart hft-system

# View specific service logs
docker-compose logs hft-system -f

# Execute command in specific container
docker-compose exec hft-system node --version
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Container Won't Start
```bash
# Check logs for errors
docker-compose logs hft-system

# Check disk space
df -h

# Check port conflicts
netstat -tlnp | grep -E ':(80|3000|3001|6379|27018|8087)'

# Restart Docker daemon
sudo systemctl restart docker
```

#### 2. Web Interface Not Accessible
```bash
# Check if containers are running
docker-compose ps

# Test direct connection
curl -f http://localhost:3000/health

# Check nginx logs
docker-compose logs nginx

# Restart nginx
docker-compose restart nginx
```

#### 3. Database Connection Issues
```bash
# Check database containers
docker-compose ps | grep -E '(mongo|redis|influx)'

# Test database connections
docker-compose exec hft-system nc -z mongodb 27017
docker-compose exec hft-system nc -z redis 6379
docker-compose exec hft-system nc -z influxdb 8086
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats

# Check system resources
free -h
df -h

# Scale down if needed
docker-compose up -d --scale hft-system=1
```

### Log Analysis
```bash
# View all logs with timestamps
docker-compose logs -t

# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View logs for specific time range
docker-compose logs --since="2024-01-01T00:00:00Z" --until="2024-01-01T12:00:00Z"
```

## Performance Optimization

### Resource Allocation
```yaml
# Add to docker-compose.yml under services
services:
  hft-system:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

### Network Optimization
```bash
# Use host networking for ultra-low latency (Linux only)
docker-compose -f docker-compose.yml -f docker-compose.performance.yml up -d
```

### Storage Optimization
```bash
# Use tmpfs for cache (faster but volatile)
# Add to docker-compose.yml:
# tmpfs:
#   - /app/cache:rw,size=1g
```

## Backup and Recovery

### Data Backup
```bash
# Backup all persistent data
./docker-run.sh backup

# Manual backup
docker-compose exec mongodb mongodump --out /backup
docker-compose exec redis redis-cli BGSAVE
```

### System Backup
```bash
# Export all containers
docker export $(docker ps -q) > hft-system-backup.tar

# Save all images
docker save $(docker images -q) > hft-images-backup.tar
```

### Recovery
```bash
# Restore from backup
./docker-run.sh restore

# Import containers
docker import hft-system-backup.tar

# Load images
docker load < hft-images-backup.tar
```

## Development Mode

### Running in Development
```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up --build

# Enable hot reload
docker-compose -f docker-compose.dev.yml up --build -d
docker-compose exec hft-system npm run dev
```

### Debugging
```bash
# Enable debug mode
docker-compose exec hft-system node --inspect=0.0.0.0:9229 src/main.js

# Access logs
docker-compose logs hft-system -f

# Shell access
docker-compose exec hft-system bash
```

## Security Considerations

### Production Deployment
1. **Change default passwords** in `.env` file
2. **Enable SSL/TLS** for nginx
3. **Configure firewall** rules
4. **Use secrets management** for sensitive data
5. **Enable container scanning** for vulnerabilities
6. **Implement backup strategy**
7. **Monitor system logs** regularly

### SSL Configuration
```bash
# Generate SSL certificates
mkdir -p config/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout config/nginx/ssl/hft.key \
  -out config/nginx/ssl/hft.crt
```

## Monitoring and Alerts

### Health Checks
```bash
# System health
curl http://localhost:80/health

# Individual service health
docker-compose ps
docker inspect $(docker-compose ps -q) | grep Health
```

### Metrics Collection
- **Grafana**: http://localhost:3001
- **InfluxDB**: Time-series metrics storage
- **System logs**: Real-time log streaming via WebSocket

### Alerting
Configure alerts in Grafana for:
- High CPU/Memory usage
- Database connection failures
- Trading system errors
- Network latency issues

## Support and Documentation

### Getting Help
1. Check logs: `docker-compose logs`
2. Review this documentation
3. Check container health: `docker-compose ps`
4. Verify network connectivity: `docker network ls`

### Additional Resources
- Docker documentation: https://docs.docker.com/
- Docker Compose documentation: https://docs.docker.com/compose/
- System architecture: See `README.md`
- API documentation: Available at http://localhost:3000/api/docs

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Author**: Idyll Intelligent Systems
