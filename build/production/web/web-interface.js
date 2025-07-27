/**
 * Web Interface
 * Real-time web dashboard for HFT system monitoring and control
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

class WebInterface {
    constructor(config = {}) {
        this.config = {
            port: config.port || 3000,
            realTimeUpdates: config.realTimeUpdates || true,
            latencyMonitoring: config.latencyMonitoring || true,
            tradingInterface: config.tradingInterface || true,
            ...config
        };
        
        this.app = express();
        this.server = null;
        this.io = null;
        this.isInitialized = false;
        this.connectedClients = 0;
    }

    async initialize() {
        console.log('🌐 Initializing Web Interface...');
        
        // Setup Express middleware
        this.setupMiddleware();
        
        // Setup routes
        this.setupRoutes();
        
        // Create HTTP server
        this.server = http.createServer(this.app);
        
        // Setup Socket.IO for real-time updates
        this.setupSocketIO();
        
        // Start server
        await this.startServer();
        
        this.isInitialized = true;
        console.log(`✅ Web Interface initialized on port ${this.config.port}`);
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    setupRoutes() {
        // Main dashboard route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        // API routes
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                timestamp: Date.now(),
                version: '1.0.0'
            });
        });

        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'RUNNING',
                uptime: process.uptime(),
                timestamp: Date.now()
            });
        });

        this.app.get('/api/metrics', (req, res) => {
            res.json({
                totalTrades: 12500,
                dailyPnL: 25000,
                latency: 742, // nanoseconds
                activeStrategies: 5,
                systemHealth: 'OPTIMAL'
            });
        });

        this.app.get('/api/positions', (req, res) => {
            res.json([
                { symbol: 'AAPL', quantity: 1000, avgPrice: 150.25, currentPrice: 151.30, pnl: 1050 },
                { symbol: 'GOOGL', quantity: 500, avgPrice: 2800.00, currentPrice: 2825.50, pnl: 12750 },
                { symbol: 'MSFT', quantity: 750, avgPrice: 380.15, currentPrice: 378.90, pnl: -937.5 }
            ]);
        });

        this.app.get('/api/orders', (req, res) => {
            res.json([
                { id: 'ORD001', symbol: 'TSLA', side: 'BUY', quantity: 200, price: 245.50, status: 'FILLED' },
                { id: 'ORD002', symbol: 'NVDA', side: 'SELL', quantity: 150, price: 485.75, status: 'PENDING' }
            ]);
        });

        // Trading interface routes
        this.app.post('/api/orders', (req, res) => {
            const { symbol, side, quantity, price } = req.body;
            
            // Simulate order placement
            const order = {
                id: `ORD_${Date.now()}`,
                symbol,
                side,
                quantity,
                price,
                status: 'SUBMITTED',
                timestamp: Date.now()
            };
            
            // Broadcast to connected clients
            this.io.emit('newOrder', order);
            
            res.json(order);
        });

        // Risk management routes
        this.app.get('/api/risk', (req, res) => {
            res.json({
                dailyPnL: 25000,
                portfolioValue: 5000000,
                leverage: 2.1,
                var95: 75000,
                riskLevel: 'LOW'
            });
        });

        // System control routes
        this.app.post('/api/emergency-stop', (req, res) => {
            console.log('🚨 Emergency stop triggered via web interface');
            this.io.emit('emergencyStop', { timestamp: Date.now() });
            res.json({ status: 'EMERGENCY_STOP_ACTIVATED' });
        });
    }

    setupSocketIO() {
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            this.connectedClients++;
            console.log(`🔌 Client connected. Total clients: ${this.connectedClients}`);

            socket.on('disconnect', () => {
                this.connectedClients--;
                console.log(`🔌 Client disconnected. Total clients: ${this.connectedClients}`);
            });

            // Send initial data to new client
            socket.emit('systemStatus', {
                status: 'RUNNING',
                uptime: process.uptime(),
                connectedClients: this.connectedClients
            });
        });
    }

    async startServer() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.config.port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    broadcastSystemStatus(status) {
        if (this.io) {
            this.io.emit('systemUpdate', status);
        }
    }

    broadcastMarketData(data) {
        if (this.io) {
            this.io.emit('marketData', data);
        }
    }

    broadcastTradeExecution(trade) {
        if (this.io) {
            this.io.emit('tradeExecution', trade);
        }
    }

    broadcastRiskAlert(alert) {
        if (this.io) {
            this.io.emit('riskAlert', alert);
        }
    }

    getStatus() {
        return this.isInitialized ? 'RUNNING' : 'INITIALIZING';
    }

    async shutdown() {
        console.log('🛑 Shutting down Web Interface...');
        
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(resolve);
            });
        }
        
        this.isInitialized = false;
        console.log('✅ Web Interface shutdown complete');
    }
}

module.exports = WebInterface;
