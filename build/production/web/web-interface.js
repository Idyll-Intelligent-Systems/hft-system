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
        
        // System components
        this.marketDataManager = null;
        this.demoTradingInterface = null;
        this.aiOrchestrator = null;
        this.systemHealth = null;
        
        // Real-time data
        this.systemMetrics = {
            totalTrades: 0,
            dailyPnL: 0,
            averageLatency: 742,
            systemHealth: 'OPTIMAL',
            tradingActive: true,
            uptime: 0
        };
    }

    async initialize(systemComponents = {}) {
        console.log('🌐 Initializing Web Interface...');
        
        // Store system components
        this.marketDataManager = systemComponents.marketDataManager;
        this.demoTradingInterface = systemComponents.demoTradingInterface;
        this.aiOrchestrator = systemComponents.aiOrchestrator;
        this.systemHealth = systemComponents.systemHealth;
        
        // Setup Express middleware
        this.setupMiddleware();
        
        // Setup routes
        this.setupRoutes();
        
        // Create HTTP server
        this.server = http.createServer(this.app);
        
        // Setup Socket.IO for real-time updates
        this.setupSocketIO();
        
        // Setup real-time data broadcasting
        this.setupRealTimeUpdates();
        
        // Start server
        await this.startServer();
        
        this.isInitialized = true;
        console.log(`✅ Web Interface initialized on port ${this.config.port}`);
        console.log(`🌐 Dashboard available at: http://localhost:${this.config.port}`);
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

        // System health and status routes
        this.app.get('/api/health', (req, res) => {
            try {
                res.json({
                    status: 'healthy',
                    uptime: process.uptime(),
                    timestamp: Date.now(),
                    version: '2.0.0',
                    components: this.getComponentStatus()
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'RUNNING',
                uptime: process.uptime(),
                timestamp: Date.now(),
                systemMetrics: this.systemMetrics
            });
        });

        // Enhanced metrics endpoint
        this.app.get('/api/metrics', (req, res) => {
            try {
                const metrics = this.gatherSystemMetrics();
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Market data routes
        this.app.get('/api/market/symbols', (req, res) => {
            const symbols = this.marketDataManager ? 
                this.marketDataManager.getAllSymbols() : ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
            res.json(symbols);
        });

        this.app.get('/api/market/summary', (req, res) => {
            const summary = this.marketDataManager ? 
                this.marketDataManager.getMarketSummary() : this.getMockMarketSummary();
            res.json(summary);
        });

        this.app.get('/api/market/historical/:symbol', (req, res) => {
            const { symbol } = req.params;
            const { startDate, endDate, limit = 100 } = req.query;
            
            if (this.marketDataManager) {
                const data = this.marketDataManager.getHistoricalData(symbol, startDate, endDate);
                res.json(data.slice(-limit));
            } else {
                res.json(this.getMockHistoricalData(symbol, limit));
            }
        });

        this.app.get('/api/market/realtime/:symbol', (req, res) => {
            const { symbol } = req.params;
            
            if (this.marketDataManager) {
                const currentPrice = this.marketDataManager.getCurrentPrice(symbol);
                const history = this.marketDataManager.getTradingHistory(symbol, 50);
                res.json({ currentPrice, history });
            } else {
                res.json(this.getMockRealtimeData(symbol));
            }
        });

        // Demo trading routes
        this.app.post('/api/demo/session', async (req, res) => {
            try {
                if (!this.demoTradingInterface) {
                    return res.status(503).json({ error: 'Demo trading interface not available' });
                }
                
                const session = await this.demoTradingInterface.createDemoSession(req.body);
                res.json(session);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/session/:sessionId/start', async (req, res) => {
            try {
                const { sessionId } = req.params;
                if (!this.demoTradingInterface) {
                    return res.status(503).json({ error: 'Demo trading interface not available' });
                }
                const session = await this.demoTradingInterface.startDemoSession(sessionId);
                res.json(session);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/session/:sessionId/pause', async (req, res) => {
            try {
                const { sessionId } = req.params;
                await this.demoTradingInterface.pauseDemoSession(sessionId);
                res.json({ status: 'paused' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/session/:sessionId/stop', async (req, res) => {
            try {
                const { sessionId } = req.params;
                await this.demoTradingInterface.stopDemoSession(sessionId);
                res.json({ status: 'stopped' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/demo/sessions', (req, res) => {
            if (!this.demoTradingInterface) {
                return res.json([]);
            }
            
            const activeSessions = this.demoTradingInterface.getActiveSessions();
            const sessionHistory = this.demoTradingInterface.getSessionHistory();
            
            res.json({
                active: activeSessions.map(s => this.demoTradingInterface.getSessionSummary(s.id)),
                history: sessionHistory.slice(-10).map(s => this.demoTradingInterface.getSessionSummary(s.id))
            });
        });

        this.app.get('/api/demo/session/:sessionId', (req, res) => {
            try {
                const { sessionId } = req.params;
                const summary = this.demoTradingInterface.getSessionSummary(sessionId);
                
                if (!summary) {
                    return res.status(404).json({ error: 'Session not found' });
                }
                
                res.json(summary);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Enhanced positions endpoint
        this.app.get('/api/positions', (req, res) => {
            res.json(this.getCurrentPositions());
        });

        // Enhanced orders endpoint
        this.app.get('/api/orders', (req, res) => {
            res.json(this.getRecentOrders());
        });

        // Trading interface routes
        this.app.post('/api/orders', (req, res) => {
            const { symbol, side, quantity, price, orderType = 'LIMIT' } = req.body;
            
            // Enhanced order validation
            if (!symbol || !side || !quantity || !price) {
                return res.status(400).json({ error: 'Missing required order parameters' });
            }
            
            const order = {
                id: `ORD_${Date.now()}`,
                symbol,
                side,
                quantity,
                price,
                orderType,
                status: 'SUBMITTED',
                timestamp: Date.now(),
                venue: 'DEMO'
            };
            
            // Broadcast to connected clients
            this.io.emit('newOrder', order);
            
            // Simulate order processing
            setTimeout(() => {
                order.status = 'FILLED';
                order.fillPrice = price * (1 + (Math.random() - 0.5) * 0.001);
                this.io.emit('orderFilled', order);
                
                // Update system metrics
                this.systemMetrics.totalTrades++;
                this.systemMetrics.dailyPnL += (order.fillPrice - price) * quantity * (side === 'BUY' ? -1 : 1);
            }, Math.random() * 1000 + 500);
            
            res.json(order);
        });

        // Risk management routes
        this.app.get('/api/risk', (req, res) => {
            res.json({
                dailyPnL: this.systemMetrics.dailyPnL,
                portfolioValue: 5000000,
                leverage: 2.1,
                var95: 75000,
                riskLevel: 'LOW',
                riskUtilization: 0.65,
                maxDrawdown: 0.03,
                sharpeRatio: 2.4
            });
        });

        // System control routes
        this.app.post('/api/emergency-stop', (req, res) => {
            console.log('🚨 Emergency stop triggered via web interface');
            this.systemMetrics.tradingActive = false;
            this.io.emit('emergencyStop', { timestamp: Date.now() });
            res.json({ status: 'EMERGENCY_STOP_ACTIVATED' });
        });

        this.app.post('/api/trading/toggle', (req, res) => {
            this.systemMetrics.tradingActive = !this.systemMetrics.tradingActive;
            this.io.emit('tradingToggled', { 
                active: this.systemMetrics.tradingActive,
                timestamp: Date.now()
            });
            res.json({ active: this.systemMetrics.tradingActive });
        });

        // AI Agents status
        this.app.get('/api/agents/status', (req, res) => {
            res.json(this.getAgentStatus());
        });

        // Backtesting route
        this.app.post('/api/backtest', async (req, res) => {
            try {
                const { symbol, startDate, endDate, strategy, initialCapital } = req.body;
                
                if (!this.marketDataManager) {
                    return res.status(503).json({ error: 'Market data manager not available' });
                }
                
                const result = await this.marketDataManager.runBacktest({
                    symbol,
                    startDate,
                    endDate,
                    strategy,
                    initialCapital
                });
                
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupSocketIO() {
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // Make IO instance globally available for logging
        global.webInterfaceIO = this.io;

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
                connectedClients: this.connectedClients,
                metrics: this.systemMetrics
            });

            // Subscribe to demo trading updates
            socket.on('subscribeToSession', (sessionId) => {
                socket.join(`session_${sessionId}`);
            });

            socket.on('unsubscribeFromSession', (sessionId) => {
                socket.leave(`session_${sessionId}`);
            });

            // Subscribe to system logs
            socket.on('subscribeLogs', () => {
                socket.join('logs');
            });

            socket.on('unsubscribeLogs', () => {
                socket.leave('logs');
            });
        });
    }

    setupRealTimeUpdates() {
        // Update system metrics every second
        setInterval(() => {
            this.systemMetrics.uptime = process.uptime();
            this.systemMetrics.averageLatency = 740 + Math.random() * 20; // Simulate latency variation
            
            this.io.emit('systemUpdate', this.systemMetrics);
        }, 1000);

        // Broadcast market data updates
        if (this.marketDataManager) {
            this.marketDataManager.on('marketData', (data) => {
                this.io.emit('marketData', data);
            });
        }

        // Broadcast demo trading updates
        if (this.demoTradingInterface) {
            this.demoTradingInterface.on('tickProcessed', (data) => {
                this.io.to(`session_${data.sessionId}`).emit('demoTick', data);
            });

            this.demoTradingInterface.on('tradeExecuted', (data) => {
                this.io.to(`session_${data.sessionId}`).emit('demoTrade', data);
                this.io.emit('tradeExecution', {
                    symbol: data.trade.symbol,
                    action: data.trade.action,
                    quantity: data.trade.quantity,
                    price: data.trade.price,
                    pnl: data.trade.pnl || 0,
                    timestamp: data.trade.timestamp
                });
            });

            this.demoTradingInterface.on('sessionCompleted', (data) => {
                this.io.emit('sessionCompleted', data);
            });
        }

        // Simulate some trading activity for demo
        setInterval(() => {
            if (this.systemMetrics.tradingActive && Math.random() > 0.7) {
                const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
                const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
                const quantity = Math.floor(Math.random() * 1000) + 100;
                const price = 100 + Math.random() * 200;
                const pnl = (Math.random() - 0.5) * 1000;
                
                this.io.emit('tradeExecution', {
                    symbol,
                    side,
                    quantity,
                    price,
                    pnl,
                    timestamp: new Date().toISOString()
                });
                
                this.systemMetrics.totalTrades++;
                this.systemMetrics.dailyPnL += pnl;
            }
        }, 5000);
    }

    gatherSystemMetrics() {
        const baseMetrics = {
            totalTrades: this.systemMetrics.totalTrades,
            dailyPnL: this.systemMetrics.dailyPnL,
            averageLatency: this.systemMetrics.averageLatency,
            systemHealth: this.systemMetrics.systemHealth,
            tradingActive: this.systemMetrics.tradingActive,
            uptime: process.uptime(),
            connectedClients: this.connectedClients,
            timestamp: Date.now()
        };

        // Add market data metrics if available
        if (this.marketDataManager) {
            const marketMetrics = this.marketDataManager.getSystemMetrics();
            Object.assign(baseMetrics, {
                marketDataLatency: marketMetrics.averageLatency,
                marketDataThroughput: marketMetrics.throughput,
                messagesProcessed: marketMetrics.messagesProcessed
            });
        }

        // Add system health metrics if available
        if (this.systemHealth) {
            const healthStatus = this.systemHealth.getStatus();
            Object.assign(baseMetrics, {
                cpuUsage: healthStatus.cpu,
                memoryUsage: healthStatus.memory,
                systemStatus: healthStatus.status
            });
        }

        return baseMetrics;
    }

    getComponentStatus() {
        try {
            return {
                marketDataManager: this.marketDataManager ? (this.marketDataManager.getStatus ? this.marketDataManager.getStatus() : 'RUNNING') : 'NOT_AVAILABLE',
                demoTradingInterface: this.demoTradingInterface ? (this.demoTradingInterface.getStatus ? this.demoTradingInterface.getStatus() : 'RUNNING') : 'NOT_AVAILABLE',
                aiOrchestrator: this.aiOrchestrator ? (this.aiOrchestrator.getStatus ? this.aiOrchestrator.getStatus() : 'RUNNING') : 'NOT_AVAILABLE',
                systemHealth: this.systemHealth ? (this.systemHealth.getStatus ? this.systemHealth.getStatus() : 'RUNNING') : 'NOT_AVAILABLE'
            };
        } catch (error) {
            return {
                marketDataManager: 'ERROR',
                demoTradingInterface: 'ERROR',
                aiOrchestrator: 'ERROR',
                systemHealth: 'ERROR'
            };
        }
    }

    getCurrentPositions() {
        return [
            { symbol: 'AAPL', quantity: 1000, avgPrice: 150.25, currentPrice: 151.30, pnl: 1050, changePercent: 0.7 },
            { symbol: 'GOOGL', quantity: 500, avgPrice: 2800.00, currentPrice: 2825.50, pnl: 12750, changePercent: 0.91 },
            { symbol: 'MSFT', quantity: 750, avgPrice: 380.15, currentPrice: 378.90, pnl: -937.5, changePercent: -0.33 },
            { symbol: 'TSLA', quantity: 300, avgPrice: 245.80, currentPrice: 248.20, pnl: 720, changePercent: 0.98 },
            { symbol: 'NVDA', quantity: 200, avgPrice: 485.60, currentPrice: 492.15, pnl: 1310, changePercent: 1.35 }
        ];
    }

    getRecentOrders() {
        return [
            { id: 'ORD001', symbol: 'TSLA', side: 'BUY', quantity: 200, price: 245.50, status: 'FILLED', timestamp: Date.now() - 3600000 },
            { id: 'ORD002', symbol: 'NVDA', side: 'SELL', quantity: 150, price: 485.75, status: 'FILLED', timestamp: Date.now() - 1800000 },
            { id: 'ORD003', symbol: 'AAPL', side: 'BUY', quantity: 500, price: 150.25, status: 'FILLED', timestamp: Date.now() - 900000 },
            { id: 'ORD004', symbol: 'GOOGL', side: 'SELL', quantity: 100, price: 2825.50, status: 'PENDING', timestamp: Date.now() - 300000 }
        ];
    }

    getMockMarketSummary() {
        return {
            'AAPL': { price: 151.30, change: 1.05, changePercent: 0.7, volume: 65432100 },
            'GOOGL': { price: 2825.50, change: 25.50, changePercent: 0.91, volume: 1234567 },
            'MSFT': { price: 378.90, change: -1.25, changePercent: -0.33, volume: 28765432 },
            'TSLA': { price: 248.20, change: 2.40, changePercent: 0.98, volume: 85432198 },
            'NVDA': { price: 492.15, change: 6.55, changePercent: 1.35, volume: 45678923 }
        };
    }

    getMockHistoricalData(symbol, limit) {
        const data = [];
        const basePrice = this.getMockMarketSummary()[symbol]?.price || 100;
        
        for (let i = limit; i > 0; i--) {
            const timestamp = new Date(Date.now() - i * 5 * 60 * 1000); // 5-minute intervals
            const price = basePrice * (1 + (Math.random() - 0.5) * 0.02);
            
            data.push({
                timestamp: timestamp.toISOString(),
                symbol,
                price: parseFloat(price.toFixed(2)),
                volume: Math.floor(Math.random() * 100000) + 10000
            });
        }
        
        return data;
    }

    getMockRealtimeData(symbol) {
        const summary = this.getMockMarketSummary()[symbol];
        return {
            currentPrice: summary?.price || 100,
            history: this.getMockHistoricalData(symbol, 20)
        };
    }

    getAgentStatus() {
        return {
            strategyAgent: { status: 'ACTIVE', accuracy: 98.2, lastUpdate: Date.now() - 1000 },
            riskAgent: { status: 'ACTIVE', reliability: 99.1, lastUpdate: Date.now() - 2000 },
            executionAgent: { status: 'ACTIVE', fillRate: 95.8, lastUpdate: Date.now() - 500 },
            monitoringAgent: { status: 'ACTIVE', alertCount: 0, lastUpdate: Date.now() - 1500 },
            marketRegime: 'NORMAL',
            autonomousMode: true
        };
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

    // Broadcasting methods
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
