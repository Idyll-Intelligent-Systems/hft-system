/**
 * System Configuration Manager
 * Manages all configuration settings for the HFT system
 */

const path = require('path');
const fs = require('fs');

class SystemConfig {
    constructor() {
        this.config = this.loadConfiguration();
        this.environment = process.env.NODE_ENV || 'development';
    }

    loadConfiguration() {
        const baseConfig = {
            // System Settings
            system: {
                name: 'Idyll HFT System',
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                timezone: 'UTC',
                logLevel: 'info',
            },

            // Performance Settings
            performance: {
                targetLatency: 800, // nanoseconds
                maxThroughput: 1000000, // orders per second
                cpuCores: require('os').cpus().length,
                memoryLimit: '16GB',
                garbageCollection: 'optimized',
            },

            // Trading Configuration
            trading: {
                maxActiveOrders: 100000,
                maxDailyVolume: 1000000000, // $1B
                maxPositionSize: 10000000, // $10M
                tradingHours: {
                    start: '09:30',
                    end: '16:00',
                    timezone: 'America/New_York',
                },
            },

            // Risk Management
            riskLimits: {
                maxDailyLoss: 1000000, // $1M
                maxPortfolioValue: 100000000, // $100M
                maxLeverage: 10,
                stopLossThreshold: 0.02, // 2%
                marginRequirement: 0.25, // 25%
            },

            // Exchanges and Venues
            exchanges: [
                {
                    name: 'NYSE',
                    enabled: true,
                    latency: 50, // nanoseconds
                    fees: 0.0001,
                    apiUrl: 'wss://api.nyse.com/stream',
                    protocols: ['FIX', 'FAST'],
                },
                {
                    name: 'NASDAQ',
                    enabled: true,
                    latency: 45,
                    fees: 0.0001,
                    apiUrl: 'wss://api.nasdaq.com/stream',
                    protocols: ['ITCH', 'OUCH'],
                },
                {
                    name: 'Binance',
                    enabled: true,
                    latency: 100,
                    fees: 0.001,
                    apiUrl: 'wss://stream.binance.com:9443/ws',
                    protocols: ['WebSocket'],
                },
                {
                    name: 'Coinbase',
                    enabled: true,
                    latency: 120,
                    fees: 0.005,
                    apiUrl: 'wss://ws-feed.exchange.coinbase.com',
                    protocols: ['WebSocket'],
                },
            ],

            // Trading Venues
            tradingVenues: [
                'NYSE',
                'NASDAQ',
                'CBOE',
                'IEX',
                'ARCA',
                'BATS',
                'CME',
                'CBOT',
                'NYMEX',
                'ICE',
                'Binance',
                'Coinbase',
                'Kraken',
                'Bitfinex',
            ],

            // Market Data Configuration
            marketData: {
                feedTypes: ['Level1', 'Level2', 'OrderBook', 'Trades'],
                compression: true,
                bufferSize: 1000000,
                persistData: true,
                realtimeOnly: false,
            },

            // AI/ML Models
            mlModels: {
                strategyModel: {
                    path: './models/strategy-model.h5',
                    inferenceLatency: 2000, // microseconds
                    batchSize: 1,
                    features: 50,
                },
                riskModel: {
                    path: './models/risk-model.h5',
                    inferenceLatency: 1000,
                    batchSize: 1,
                    features: 30,
                },
                executionModel: {
                    path: './models/execution-model.h5',
                    inferenceLatency: 500,
                    batchSize: 1,
                    features: 20,
                },
            },

            // Database Configuration
            databases: {
                timeseries: {
                    type: 'InfluxDB',
                    url: 'http://localhost:8086',
                    database: 'hft_data',
                    retention: '30d',
                },
                operational: {
                    type: 'MongoDB',
                    url: 'mongodb://localhost:27017',
                    database: 'hft_operations',
                },
                cache: {
                    type: 'Redis',
                    url: 'redis://localhost:6379',
                    ttl: 3600,
                },
            },

            // Network Configuration
            network: {
                kernelBypass: true,
                tcpNoDelay: true,
                socketBuffer: 65536,
                multicast: true,
                compression: false,
            },

            // FPGA Configuration
            fpga: {
                enabled: true,
                device: 'AMD_Alveo_U250',
                frequency: 300000000, // 300MHz
                parallelism: 64,
                pipelineDepth: 8,
            },

            // Security Configuration
            security: {
                encryption: 'AES-256',
                authentication: 'JWT',
                rateLimiting: true,
                accessControl: 'RBAC',
                auditLogging: true,
            },

            // Web Interface
            web: {
                port: 3000,
                ssl: false,
                compression: true,
                rateLimit: 1000, // requests per minute
                cors: true,
            },

            // Monitoring
            monitoring: {
                metricsInterval: 100, // milliseconds
                alertThresholds: {
                    latency: 1000, // nanoseconds
                    cpu: 80, // percent
                    memory: 85, // percent
                    errorRate: 0.01, // 1%
                },
                exporters: ['prometheus', 'influxdb'],
            },

            // Backtesting
            backtesting: {
                dataPath: './data/historical',
                parallelJobs: 8,
                timeframes: ['1m', '5m', '15m', '1h', '1d'],
                slippageModel: 'realistic',
            },
        };

        // Load environment-specific overrides
        const envConfigPath = path.join(__dirname, `config.${this.environment}.json`);
        if (fs.existsSync(envConfigPath)) {
            const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
            return this.mergeConfig(baseConfig, envConfig);
        }

        return baseConfig;
    }

    mergeConfig(base, override) {
        const result = { ...base };

        for (const key in override) {
            if (
                override[key] &&
                typeof override[key] === 'object' &&
                !Array.isArray(override[key])
            ) {
                result[key] = this.mergeConfig(base[key] || {}, override[key]);
            } else {
                result[key] = override[key];
            }
        }

        return result;
    }

    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let current = this.config;

        for (const key of keys) {
            if (current[key] === undefined) {
                return defaultValue;
            }
            current = current[key];
        }

        return current;
    }

    set(path, value) {
        const keys = path.split('.');
        let current = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    }

    getExchangeConfig(exchangeName) {
        return this.config.exchanges.find(ex => ex.name === exchangeName);
    }

    getTradingVenues() {
        return this.config.tradingVenues;
    }

    getRiskLimits() {
        return this.config.riskLimits;
    }

    getPerformanceTargets() {
        return this.config.performance;
    }

    validate() {
        const required = [
            'system.name',
            'trading.maxActiveOrders',
            'riskLimits.maxDailyLoss',
            'exchanges',
            'databases.timeseries.url',
        ];

        const missing = required.filter(path => this.get(path) === undefined);

        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }

        return true;
    }

    reload() {
        this.config = this.loadConfiguration();
        return this;
    }

    export() {
        return JSON.parse(JSON.stringify(this.config));
    }
}

module.exports = SystemConfig;
