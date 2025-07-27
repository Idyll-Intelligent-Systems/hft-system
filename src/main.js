#!/usr/bin/env node

/**
 * Idyll Intelligent Systems - Automated HFT Platform
 * Main Entry Point - Ultra-Low Latency Trading System
 *
 * This is the primary entry point for the nanosecond HFT system.
 * Initializes all core components, AI agents, and infrastructure.
 */

const cluster = require('cluster');
const os = require('os');
const { performance } = require('perf_hooks');

// Core system imports
const SystemConfig = require('./core/config/system-config');
const Logger = require('./core/logging/logger');
const SystemHealthMonitor = require('./core/monitoring/system-health');
const UltraLowLatencyEngine = require('./core/engine/ultra-low-latency-engine');
const AIAgentOrchestrator = require('./agents/orchestrator/ai-agent-orchestrator');
const MarketDataManager = require('./infrastructure/market-data/market-data-manager');
const OrderManagementSystem = require('./core/trading/order-management-system');
const RiskManagementEngine = require('./core/risk/risk-management-engine');
const WebInterface = require('../web/web-interface');

class IdyllHFTSystem {
    constructor() {
        this.logger = new Logger('MAIN');
        this.config = new SystemConfig();
        this.isInitialized = false;
        this.components = new Map();
        this.startTime = performance.now();

        // Performance metrics
        this.metrics = {
            systemStartTime: Date.now(),
            totalTrades: 0,
            totalPnL: 0,
            averageLatency: 0,
            uptime: 0,
        };
    }

    async initialize() {
        try {
            this.logger.info('🚀 Initializing Idyll Intelligent Systems HFT Platform...');

            // Initialize system health monitoring first
            await this.initializeSystemHealth();

            // Initialize core infrastructure
            await this.initializeInfrastructure();

            // Initialize trading components
            await this.initializeTradingComponents();

            // Initialize AI agents
            await this.initializeAIAgents();

            // Initialize web interface
            await this.initializeWebInterface();

            // Start system monitoring
            await this.startSystemMonitoring();

            this.isInitialized = true;
            const initTime = performance.now() - this.startTime;

            this.logger.info(`✅ System initialized successfully in ${initTime.toFixed(2)}ms`);
            this.logger.info('🔥 Idyll HFT System is now LIVE and ready for nanosecond trading!');

            return true;
        } catch (error) {
            this.logger.error('❌ Failed to initialize system:', error);
            await this.shutdown();
            throw error;
        }
    }

    async initializeSystemHealth() {
        this.logger.info('📊 Initializing system health monitoring...');

        this.systemHealth = new SystemHealthMonitor({
            cpuThreshold: 80,
            memoryThreshold: 85,
            latencyThreshold: 1000, // nanoseconds
            checkInterval: 100, // ms
        });

        await this.systemHealth.initialize();
        this.components.set('systemHealth', this.systemHealth);

        this.logger.info('✅ System health monitoring initialized');
    }

    async initializeInfrastructure() {
        this.logger.info('🏗️ Initializing ultra-low latency infrastructure...');

        // Initialize market data manager
        this.marketDataManager = new MarketDataManager({
            exchanges: this.config.get('exchanges'),
            latencyTarget: 50, // nanoseconds
            throughputTarget: 10000000, // messages per second
        });

        await this.marketDataManager.initialize();
        this.components.set('marketData', this.marketDataManager);

        // Initialize ultra-low latency engine
        this.ultraLowLatencyEngine = new UltraLowLatencyEngine({
            targetLatency: 800, // nanoseconds tick-to-trade
            fpgaEnabled: true,
            kernelBypass: true,
        });

        await this.ultraLowLatencyEngine.initialize();
        this.components.set('lowLatencyEngine', this.ultraLowLatencyEngine);

        this.logger.info('✅ Infrastructure initialized');
    }

    async initializeTradingComponents() {
        this.logger.info('💹 Initializing trading components...');

        // Initialize Order Management System
        this.orderManagementSystem = new OrderManagementSystem({
            maxActiveOrders: 100000,
            latencyTarget: 1000, // nanoseconds
            venues: this.config.get('tradingVenues'),
        });

        await this.orderManagementSystem.initialize();
        this.components.set('oms', this.orderManagementSystem);

        // Initialize Risk Management Engine
        this.riskEngine = new RiskManagementEngine({
            preTradeLatency: 10000, // nanoseconds
            positionLimits: this.config.get('riskLimits'),
            realTimePnL: true,
        });

        await this.riskEngine.initialize();
        this.components.set('risk', this.riskEngine);

        this.logger.info('✅ Trading components initialized');
    }

    async initializeAIAgents() {
        this.logger.info('🤖 Initializing AI Agent Orchestrator...');

        this.aiOrchestrator = new AIAgentOrchestrator({
            agents: {
                strategy: { enabled: true, inferenceLatency: 2000 }, // microseconds
                risk: { enabled: true, inferenceLatency: 1000 },
                execution: { enabled: true, inferenceLatency: 500 },
                monitoring: { enabled: true, inferenceLatency: 5000 },
            },
            mlModels: this.config.get('mlModels'),
            autonomousMode: true,
        });

        await this.aiOrchestrator.initialize();
        this.components.set('aiOrchestrator', this.aiOrchestrator);

        this.logger.info('✅ AI agents initialized and ready');
    }

    async initializeWebInterface() {
        this.logger.info('🌐 Initializing web interface...');

        this.webInterface = new WebInterface({
            port: this.config.get('webPort', 3000),
            realTimeUpdates: true,
            latencyMonitoring: true,
            tradingInterface: true,
        });

        await this.webInterface.initialize();
        this.components.set('webInterface', this.webInterface);

        this.logger.info('✅ Web interface initialized');
    }

    async startSystemMonitoring() {
        this.logger.info('🔍 Starting system monitoring...');

        // Real-time performance monitoring
        setInterval(() => {
            this.updateMetrics();
            this.checkSystemHealth();
        }, 100); // Every 100ms

        // Detailed reporting every 5 seconds
        setInterval(() => {
            this.reportSystemStatus();
        }, 5000);

        this.logger.info('✅ System monitoring started');
    }

    updateMetrics() {
        this.metrics.uptime = Date.now() - this.metrics.systemStartTime;

        // Update from components
        if (this.orderManagementSystem) {
            this.metrics.totalTrades = this.orderManagementSystem.getTotalTrades();
            this.metrics.averageLatency = this.orderManagementSystem.getAverageLatency();
        }

        if (this.riskEngine) {
            this.metrics.totalPnL = this.riskEngine.getTotalPnL();
        }
    }

    checkSystemHealth() {
        if (!this.systemHealth) return;

        const health = this.systemHealth.getHealthStatus();

        if (health.status === 'CRITICAL') {
            this.logger.error('🚨 CRITICAL SYSTEM HEALTH ALERT:', health);
            // Implement emergency procedures
            this.handleCriticalAlert(health);
        } else if (health.status === 'WARNING') {
            this.logger.warn('⚠️ System health warning:', health);
        }
    }

    async handleCriticalAlert(health) {
        this.logger.error('🚨 Executing emergency procedures...');

        // Stop new orders
        if (this.orderManagementSystem) {
            await this.orderManagementSystem.emergencyStop();
        }

        // Notify administrators
        if (this.aiOrchestrator) {
            await this.aiOrchestrator.notifyEmergency(health);
        }

        // Log incident
        this.logger.error('Emergency procedures executed');
    }

    reportSystemStatus() {
        const status = {
            uptime: this.metrics.uptime,
            totalTrades: this.metrics.totalTrades,
            totalPnL: this.metrics.totalPnL,
            averageLatency: this.metrics.averageLatency,
            health: this.systemHealth ? this.systemHealth.getHealthStatus() : 'Unknown',
            components: Array.from(this.components.keys()).map(key => ({
                name: key,
                status: this.components.get(key).getStatus
                    ? this.components.get(key).getStatus()
                    : 'Running',
            })),
        };

        this.logger.info('📊 System Status:', status);

        // Broadcast to web interface
        if (this.webInterface) {
            this.webInterface.broadcastSystemStatus(status);
        }
    }

    async shutdown() {
        this.logger.info('🛑 Initiating system shutdown...');

        try {
            // Stop trading operations first
            if (this.orderManagementSystem) {
                await this.orderManagementSystem.shutdown();
            }

            // Shutdown AI agents
            if (this.aiOrchestrator) {
                await this.aiOrchestrator.shutdown();
            }

            // Shutdown infrastructure components
            for (const [name, component] of this.components) {
                if (component.shutdown) {
                    this.logger.info(`Shutting down ${name}...`);
                    await component.shutdown();
                }
            }

            this.logger.info('✅ System shutdown completed');
        } catch (error) {
            this.logger.error('❌ Error during shutdown:', error);
        }

        process.exit(0);
    }

    // Graceful shutdown handlers
    setupGracefulShutdown() {
        process.on('SIGINT', async () => {
            this.logger.info('Received SIGINT, shutting down gracefully...');
            await this.shutdown();
        });

        process.on('SIGTERM', async () => {
            this.logger.info('Received SIGTERM, shutting down gracefully...');
            await this.shutdown();
        });

        process.on('uncaughtException', async error => {
            this.logger.error('Uncaught exception:', error);
            await this.shutdown();
        });

        process.on('unhandledRejection', async (reason, promise) => {
            this.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
            await this.shutdown();
        });
    }
}

// Main execution
async function main() {
    console.log('🎯 Idyll Intelligent Systems - Automated HFT Platform v1.0');
    console.log('⚡ Ultra-Low Latency Nanosecond Trading System');
    console.log('🤖 AI-Powered Autonomous Trading Platform');
    console.log('═══════════════════════════════════════════════');

    // Check if running in cluster mode
    if (cluster.isMaster && process.env.NODE_ENV === 'production') {
        console.log(`Master ${process.pid} is running`);

        // Fork workers for each CPU core
        const numCPUs = os.cpus().length;
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            console.log(`Worker ${worker.process.pid} died`);
            cluster.fork(); // Restart worker
        });
    } else {
        // Worker process or development mode
        const hftSystem = new IdyllHFTSystem();

        // Setup graceful shutdown
        hftSystem.setupGracefulShutdown();

        try {
            await hftSystem.initialize();

            // Keep the process running
            process.on('message', async msg => {
                if (msg === 'shutdown') {
                    await hftSystem.shutdown();
                }
            });
        } catch (error) {
            console.error('Failed to start HFT system:', error);
            process.exit(1);
        }
    }
}

// Start the system
if (require.main === module) {
    main().catch(console.error);
}

module.exports = IdyllHFTSystem;
