/**
 * Market Data Manager
 * Ultra-low latency market data processing with real-world data integration
 */

const EventEmitter = require('events');
const RealWorldDataProvider = require('./real-world-data-provider');

class MarketDataManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            exchanges: config.exchanges || [],
            latencyTarget: config.latencyTarget || 50, // nanoseconds
            throughputTarget: config.throughputTarget || 10000000, // messages per second
            realWorldData: config.realWorldData || true,
            symbols: config.symbols || ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META'],
            ...config,
        };

        this.feedHandlers = new Map();
        this.realWorldProvider = null;
        this.isInitialized = false;
        this.currentPrices = new Map();
        this.tradingHistory = new Map();
        this.marketDepth = new Map();

        // Performance metrics
        this.metrics = {
            messagesProcessed: 0,
            averageLatency: 0,
            throughput: 0,
            lastUpdate: null,
        };
    }

    async initialize() {
        console.log('📡 Initializing Market Data Manager...');

        try {
            // Initialize real-world data provider
            if (this.config.realWorldData) {
                this.realWorldProvider = new RealWorldDataProvider({
                    symbols: this.config.symbols,
                    refreshInterval: 1000, // 1 second for demo
                    cacheEnabled: true,
                });

                await this.realWorldProvider.initialize();
                this.setupDataHandlers();
            }

            // Initialize feed handlers for each exchange
            for (const exchange of this.config.exchanges) {
                if (exchange.enabled) {
                    console.log(`Connecting to ${exchange.name}...`);
                    // Simulate connection with enhanced features
                    this.feedHandlers.set(exchange.name, {
                        status: 'connected',
                        latency: exchange.latency,
                        messagesProcessed: 0,
                        lastHeartbeat: Date.now(),
                        symbols: this.config.symbols,
                    });
                }
            }

            // Initialize current prices for all symbols
            this.initializeSymbolData();

            this.isInitialized = true;
            console.log('✅ Market Data Manager initialized with real-world data');
        } catch (error) {
            console.error('❌ Failed to initialize Market Data Manager:', error);
            throw error;
        }
    }

    setupDataHandlers() {
        // Handle real-time tick data
        this.realWorldProvider.on('tick', tickData => {
            this.processTickData(tickData);
        });
    }

    processTickData(tickData) {
        const startTime = process.hrtime.bigint();

        // Update current prices
        this.currentPrices.set(tickData.symbol, {
            ...tickData,
            lastUpdate: Date.now(),
        });

        // Update market depth simulation
        this.updateMarketDepth(tickData);

        // Record for trading history
        if (!this.tradingHistory.has(tickData.symbol)) {
            this.tradingHistory.set(tickData.symbol, []);
        }
        const history = this.tradingHistory.get(tickData.symbol);
        history.push(tickData);

        // Keep only last 1000 ticks per symbol
        if (history.length > 1000) {
            history.shift();
        }

        // Calculate processing latency
        const endTime = process.hrtime.bigint();
        const latencyNs = Number(endTime - startTime);

        // Update metrics
        this.updateMetrics(latencyNs);

        // Emit processed data to subscribers
        this.emit('marketData', {
            ...tickData,
            processingLatency: latencyNs,
            depth: this.marketDepth.get(tickData.symbol),
        });
    }

    updateMarketDepth(tickData) {
        // Simulate market depth based on current price
        const spread = tickData.price * 0.001; // 0.1% spread
        const bidPrice = tickData.price - spread / 2;
        const askPrice = tickData.price + spread / 2;

        // Generate realistic bid/ask sizes
        const baseSize = Math.floor(Math.random() * 10000) + 1000;

        this.marketDepth.set(tickData.symbol, {
            bid: [
                { price: bidPrice, size: baseSize },
                { price: bidPrice - spread, size: baseSize * 1.5 },
                { price: bidPrice - spread * 2, size: baseSize * 2 },
            ],
            ask: [
                { price: askPrice, size: baseSize },
                { price: askPrice + spread, size: baseSize * 1.5 },
                { price: askPrice + spread * 2, size: baseSize * 2 },
            ],
            timestamp: tickData.timestamp,
        });
    }

    initializeSymbolData() {
        for (const symbol of this.config.symbols) {
            // Initialize with starting prices
            const startingPrice = this.realWorldProvider
                ? this.realWorldProvider.getCurrentPrice(symbol)
                : 100;

            this.currentPrices.set(symbol, {
                symbol: symbol,
                price: startingPrice,
                timestamp: new Date().toISOString(),
                volume: 0,
                change: 0,
                changePercent: 0,
            });

            this.tradingHistory.set(symbol, []);
        }
    }

    updateMetrics(latencyNs) {
        this.metrics.messagesProcessed++;

        // Calculate running average latency
        if (this.metrics.averageLatency === 0) {
            this.metrics.averageLatency = latencyNs;
        } else {
            this.metrics.averageLatency = this.metrics.averageLatency * 0.9 + latencyNs * 0.1;
        }

        this.metrics.lastUpdate = Date.now();

        // Calculate throughput (messages per second)
        if (this.metrics.messagesProcessed % 100 === 0) {
            const now = Date.now();
            if (this.startTime) {
                const seconds = (now - this.startTime) / 1000;
                this.metrics.throughput = this.metrics.messagesProcessed / seconds;
            } else {
                this.startTime = now;
            }
        }
    }

    // Public API methods
    getCurrentPrice(symbol) {
        const data = this.currentPrices.get(symbol);
        return data ? data.price : null;
    }

    getMarketDepth(symbol) {
        return this.marketDepth.get(symbol) || null;
    }

    getTradingHistory(symbol, limit = 100) {
        const history = this.tradingHistory.get(symbol) || [];
        return history.slice(-limit);
    }

    getHistoricalData(symbol, startDate, endDate) {
        if (!this.realWorldProvider) return [];
        return this.realWorldProvider.getHistoricalData(symbol, startDate, endDate);
    }

    simulateTrading(symbol, startDate, endDate, strategy) {
        if (!this.realWorldProvider) return null;
        return this.realWorldProvider.simulateTradeOnData(symbol, startDate, endDate, strategy);
    }

    getAllSymbols() {
        return this.config.symbols;
    }

    getMarketSummary() {
        const summary = {};
        for (const symbol of this.config.symbols) {
            const data = this.currentPrices.get(symbol);
            if (data) {
                summary[symbol] = {
                    price: data.price,
                    change: data.change || 0,
                    changePercent: data.changePercent || 0,
                    volume: data.volume || 0,
                    timestamp: data.timestamp,
                };
            }
        }
        return summary;
    }

    getSystemMetrics() {
        return {
            ...this.metrics,
            connectedExchanges: this.feedHandlers.size,
            activeSymbols: this.currentPrices.size,
            status: this.isInitialized ? 'RUNNING' : 'INITIALIZING',
        };
    }

    // Trading simulation and backtesting
    async runBacktest(config) {
        const {
            symbol,
            startDate,
            endDate,
            strategy = 'simple_momentum',
            initialCapital = 100000,
        } = config;

        console.log(`🔬 Running backtest for ${symbol} (${startDate} to ${endDate})`);

        const result = this.simulateTrading(symbol, startDate, endDate, strategy);

        if (result) {
            console.log(`📊 Backtest Results:
                - Initial Capital: $${initialCapital.toLocaleString()}
                - Final Value: $${result.finalValue.toLocaleString()}
                - Total Return: ${result.totalReturn.toFixed(2)}%
                - Total Trades: ${result.trades.length}
                - Win Rate: ${this.calculateWinRate(result.trades)}%`);
        }

        return result;
    }

    calculateWinRate(trades) {
        const sellTrades = trades.filter(trade => trade.type === 'SELL');
        const winningTrades = sellTrades.filter(trade => trade.pnl > 0);
        return sellTrades.length > 0
            ? Math.round((winningTrades.length / sellTrades.length) * 100)
            : 0;
    }

    getStatus() {
        return {
            status: this.isInitialized ? 'RUNNING' : 'INITIALIZING',
            exchanges: Array.from(this.feedHandlers.keys()),
            symbols: this.config.symbols,
            metrics: this.getSystemMetrics(),
            realWorldData: this.realWorldProvider !== null,
        };
    }

    async shutdown() {
        console.log('🛑 Shutting down Market Data Manager...');

        if (this.realWorldProvider) {
            await this.realWorldProvider.shutdown();
        }

        this.feedHandlers.clear();
        this.currentPrices.clear();
        this.tradingHistory.clear();
        this.marketDepth.clear();

        this.isInitialized = false;
        console.log('✅ Market Data Manager shutdown complete');
    }
}

module.exports = MarketDataManager;
