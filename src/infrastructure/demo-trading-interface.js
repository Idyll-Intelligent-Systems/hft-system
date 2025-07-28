/**
 * Demo Trading Interface
 * Interactive historical trading simulation with AI-powered HFT system
 */

const EventEmitter = require('events');

class DemoTradingInterface extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            initialCapital: config.initialCapital || 100000,
            symbols: config.symbols || ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'],
            strategies: config.strategies || [
                'momentum',
                'mean_reversion',
                'breakout',
                'ai_dynamic',
            ],
            maxConcurrentTrades: config.maxConcurrentTrades || 5,
            riskPerTrade: config.riskPerTrade || 0.02, // 2% per trade
            ...config,
        };

        this.isInitialized = false;
        this.activeSessions = new Map();
        this.sessionHistory = [];
        this.marketDataManager = null;
        this.aiOrchestrator = null;
    }

    async initialize(marketDataManager, aiOrchestrator) {
        console.log('🎮 Initializing Demo Trading Interface...');

        this.marketDataManager = marketDataManager;
        this.aiOrchestrator = aiOrchestrator;

        this.isInitialized = true;
        console.log('✅ Demo Trading Interface initialized');
    }

    // Create new demo trading session
    async createDemoSession(sessionConfig) {
        const sessionId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const session = {
            id: sessionId,
            config: {
                startDate: sessionConfig.startDate,
                endDate: sessionConfig.endDate,
                symbol: sessionConfig.symbol,
                strategy: sessionConfig.strategy || 'ai_dynamic',
                initialCapital: sessionConfig.initialCapital || this.config.initialCapital,
                speed: sessionConfig.speed || 1, // 1x = real time, 10x = 10x speed, etc.
                ...sessionConfig,
            },
            state: {
                status: 'CREATED',
                currentTime: new Date(sessionConfig.startDate),
                portfolio: {
                    cash: sessionConfig.initialCapital || this.config.initialCapital,
                    positions: new Map(),
                    totalValue: sessionConfig.initialCapital || this.config.initialCapital,
                },
                trades: [],
                metrics: {
                    totalTrades: 0,
                    winningTrades: 0,
                    totalPnL: 0,
                    maxDrawdown: 0,
                    sharpeRatio: 0,
                    dailyReturns: [],
                },
                aiDecisions: [],
                riskEvents: [],
            },
            performance: {
                startTime: Date.now(),
                ticksProcessed: 0,
                averageLatency: 0,
            },
        };

        this.activeSessions.set(sessionId, session);

        console.log(`🚀 Created demo session ${sessionId} for ${session.config.symbol}`);
        console.log(`📅 Period: ${session.config.startDate} to ${session.config.endDate}`);

        return session;
    }

    // Start trading simulation
    async startDemoSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        if (session.state.status !== 'CREATED' && session.state.status !== 'PAUSED') {
            throw new Error(`Cannot start session in ${session.state.status} state`);
        }

        session.state.status = 'RUNNING';
        session.performance.startTime = Date.now();

        console.log(`▶️ Starting demo session ${sessionId}`);

        // Get historical data for the session period
        const historicalData = this.marketDataManager.getHistoricalData(
            session.config.symbol,
            session.config.startDate,
            session.config.endDate
        );

        if (!historicalData || historicalData.length === 0) {
            throw new Error(`No historical data available for ${session.config.symbol}`);
        }

        // Start simulation loop
        this.runSimulationLoop(session, historicalData);

        this.emit('sessionStarted', { sessionId, session });
        return session;
    }

    async runSimulationLoop(session, historicalData) {
        const tickInterval = Math.max(10, 1000 / session.config.speed); // Minimum 10ms between ticks
        let dataIndex = 0;

        const processNextTick = async () => {
            if (session.state.status !== 'RUNNING' || dataIndex >= historicalData.length) {
                if (dataIndex >= historicalData.length) {
                    await this.completeDemoSession(session.id);
                }
                return;
            }

            const tickData = historicalData[dataIndex];
            await this.processTick(session, tickData);

            dataIndex++;
            session.performance.ticksProcessed++;

            // Schedule next tick
            setTimeout(processNextTick, tickInterval);
        };

        // Start the simulation
        processNextTick();
    }

    async processTick(session, tickData) {
        const startTime = performance.now();

        // Update current time
        session.state.currentTime = new Date(tickData.timestamp);

        // Update portfolio value
        this.updatePortfolioValue(session, tickData);

        // Generate AI trading decision
        const aiDecision = await this.generateTradingDecision(session, tickData);
        if (aiDecision) {
            session.state.aiDecisions.push({
                timestamp: tickData.timestamp,
                ...aiDecision,
            });

            // Execute trade if decision was made
            if (aiDecision.action !== 'HOLD') {
                await this.executeDemoTrade(session, aiDecision, tickData);
            }
        }

        // Update metrics
        this.updateSessionMetrics(session, tickData);

        // Check risk limits
        this.checkRiskLimits(session, tickData);

        // Calculate processing latency
        const latency = performance.now() - startTime;
        session.performance.averageLatency =
            session.performance.averageLatency * 0.9 + latency * 0.1;

        // Emit real-time update
        this.emit('tickProcessed', {
            sessionId: session.id,
            tickData,
            portfolio: session.state.portfolio,
            aiDecision,
            metrics: session.state.metrics,
        });
    }

    async generateTradingDecision(session, tickData) {
        try {
            // Simulate AI decision making process
            const marketContext = {
                symbol: session.config.symbol,
                price: tickData.price,
                volume: tickData.volume,
                timestamp: tickData.timestamp,
                recentData: this.getRecentMarketData(session, tickData),
            };

            const portfolioContext = {
                cash: session.state.portfolio.cash,
                currentPosition: session.state.portfolio.positions.get(session.config.symbol),
                totalValue: session.state.portfolio.totalValue,
                riskUtilization: this.calculateRiskUtilization(session),
            };

            // Use AI orchestrator if available, otherwise use simplified strategy
            let decision;
            if (this.aiOrchestrator && session.config.strategy === 'ai_dynamic') {
                decision = await this.aiOrchestrator.generateTradingDecision(
                    marketContext,
                    portfolioContext
                );
            } else {
                decision = this.generateBasicDecision(session, marketContext, portfolioContext);
            }

            return {
                action: decision.action,
                quantity: decision.quantity,
                price: tickData.price,
                confidence: decision.confidence || 0.5,
                reasoning: decision.reasoning || 'Strategy-based decision',
                strategy: session.config.strategy,
            };
        } catch (error) {
            console.warn(`⚠️ Error generating trading decision:`, error.message);
            return { action: 'HOLD', reasoning: 'Error in decision generation' };
        }
    }

    generateBasicDecision(session, marketContext, portfolioContext) {
        const strategy = session.config.strategy;
        const recentData = marketContext.recentData;

        if (!recentData || recentData.length < 10) {
            return { action: 'HOLD', reasoning: 'Insufficient data' };
        }

        switch (strategy) {
            case 'momentum':
                return this.momentumDecision(marketContext, portfolioContext, recentData);
            case 'mean_reversion':
                return this.meanReversionDecision(marketContext, portfolioContext, recentData);
            case 'breakout':
                return this.breakoutDecision(marketContext, portfolioContext, recentData);
            default:
                return { action: 'HOLD', reasoning: 'Unknown strategy' };
        }
    }

    momentumDecision(marketContext, portfolioContext, recentData) {
        const prices = recentData.slice(-10).map(d => d.price);
        const shortMA = prices.slice(-5).reduce((sum, p) => sum + p, 0) / 5;
        const longMA = prices.reduce((sum, p) => sum + p, 0) / 10;
        const currentPrice = marketContext.price;

        if (currentPrice > shortMA && shortMA > longMA * 1.01) {
            const positionSize = this.calculatePositionSize(portfolioContext, currentPrice);
            return {
                action: 'BUY',
                quantity: positionSize,
                confidence: 0.7,
                reasoning: 'Momentum signal: Price above moving averages',
            };
        } else if (currentPrice < shortMA && shortMA < longMA * 0.99) {
            const currentPosition = portfolioContext.currentPosition;
            if (currentPosition && currentPosition.quantity > 0) {
                return {
                    action: 'SELL',
                    quantity: currentPosition.quantity,
                    confidence: 0.7,
                    reasoning: 'Momentum signal: Price below moving averages',
                };
            }
        }

        return { action: 'HOLD', reasoning: 'No clear momentum signal' };
    }

    meanReversionDecision(marketContext, portfolioContext, recentData) {
        const prices = recentData.map(d => d.price);
        const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const std = Math.sqrt(prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length);
        const currentPrice = marketContext.price;

        if (currentPrice < mean - 2 * std) {
            const positionSize = this.calculatePositionSize(portfolioContext, currentPrice);
            return {
                action: 'BUY',
                quantity: positionSize,
                confidence: 0.8,
                reasoning: 'Mean reversion: Price significantly below mean',
            };
        } else if (currentPrice > mean + 2 * std) {
            const currentPosition = portfolioContext.currentPosition;
            if (currentPosition && currentPosition.quantity > 0) {
                return {
                    action: 'SELL',
                    quantity: currentPosition.quantity,
                    confidence: 0.8,
                    reasoning: 'Mean reversion: Price significantly above mean',
                };
            }
        }

        return { action: 'HOLD', reasoning: 'Price within normal range' };
    }

    breakoutDecision(marketContext, portfolioContext, recentData) {
        const prices = recentData.map(d => d.price);
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const currentPrice = marketContext.price;
        const range = high - low;

        if (currentPrice > high + range * 0.02) {
            const positionSize = this.calculatePositionSize(portfolioContext, currentPrice);
            return {
                action: 'BUY',
                quantity: positionSize,
                confidence: 0.75,
                reasoning: 'Breakout: Price above recent high',
            };
        } else if (currentPrice < low - range * 0.02) {
            const currentPosition = portfolioContext.currentPosition;
            if (currentPosition && currentPosition.quantity > 0) {
                return {
                    action: 'SELL',
                    quantity: currentPosition.quantity,
                    confidence: 0.75,
                    reasoning: 'Breakdown: Price below recent low',
                };
            }
        }

        return { action: 'HOLD', reasoning: 'No breakout detected' };
    }

    calculatePositionSize(portfolioContext, price) {
        const maxRiskAmount = portfolioContext.totalValue * this.config.riskPerTrade;
        const maxShares = Math.floor(portfolioContext.cash / price);
        const riskBasedShares = Math.floor(maxRiskAmount / price);

        return Math.min(maxShares, riskBasedShares, 1000); // Cap at 1000 shares
    }

    calculateRiskUtilization(session) {
        const totalPositionValue = Array.from(session.state.portfolio.positions.values()).reduce(
            (sum, pos) => sum + pos.quantity * pos.currentPrice,
            0
        );

        return totalPositionValue / session.state.portfolio.totalValue;
    }

    getRecentMarketData(session, currentTick) {
        // Return last 20 data points for analysis
        const allTicks = session.state.processedTicks || [];
        return [...allTicks.slice(-19), currentTick];
    }

    async executeDemoTrade(session, decision, tickData) {
        const trade = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            sessionId: session.id,
            timestamp: tickData.timestamp,
            symbol: session.config.symbol,
            action: decision.action,
            quantity: decision.quantity,
            price: tickData.price,
            value: decision.quantity * tickData.price,
            reasoning: decision.reasoning,
            strategy: decision.strategy,
        };

        const currentPosition = session.state.portfolio.positions.get(session.config.symbol) || {
            quantity: 0,
            averagePrice: 0,
            totalCost: 0,
        };

        if (decision.action === 'BUY') {
            // Execute buy order
            const totalCost = trade.value;
            if (session.state.portfolio.cash >= totalCost) {
                session.state.portfolio.cash -= totalCost;

                // Update position
                const newQuantity = currentPosition.quantity + trade.quantity;
                const newTotalCost = currentPosition.totalCost + totalCost;

                session.state.portfolio.positions.set(session.config.symbol, {
                    quantity: newQuantity,
                    averagePrice: newTotalCost / newQuantity,
                    totalCost: newTotalCost,
                    currentPrice: tickData.price,
                });

                trade.status = 'FILLED';
                console.log(`📈 BUY: ${trade.quantity} ${trade.symbol} @ $${trade.price}`);
            } else {
                trade.status = 'REJECTED';
                trade.reason = 'Insufficient cash';
            }
        } else if (decision.action === 'SELL') {
            // Execute sell order
            if (currentPosition.quantity >= trade.quantity) {
                const saleValue = trade.value;
                session.state.portfolio.cash += saleValue;

                // Calculate P&L
                const costBasis =
                    (currentPosition.totalCost / currentPosition.quantity) * trade.quantity;
                trade.pnl = saleValue - costBasis;

                // Update position
                const newQuantity = currentPosition.quantity - trade.quantity;
                if (newQuantity > 0) {
                    const newTotalCost = currentPosition.totalCost - costBasis;
                    session.state.portfolio.positions.set(session.config.symbol, {
                        quantity: newQuantity,
                        averagePrice: newTotalCost / newQuantity,
                        totalCost: newTotalCost,
                        currentPrice: tickData.price,
                    });
                } else {
                    session.state.portfolio.positions.delete(session.config.symbol);
                }

                trade.status = 'FILLED';
                console.log(
                    `📉 SELL: ${trade.quantity} ${trade.symbol} @ $${trade.price} (P&L: ${trade.pnl > 0 ? '+' : ''}$${trade.pnl.toFixed(2)})`
                );
            } else {
                trade.status = 'REJECTED';
                trade.reason = 'Insufficient shares';
            }
        }

        session.state.trades.push(trade);
        this.emit('tradeExecuted', { sessionId: session.id, trade });

        return trade;
    }

    updatePortfolioValue(session, tickData) {
        let totalValue = session.state.portfolio.cash;

        // Update position values
        for (const [symbol, position] of session.state.portfolio.positions) {
            if (symbol === session.config.symbol) {
                position.currentPrice = tickData.price;
                totalValue += position.quantity * tickData.price;
            }
        }

        session.state.portfolio.totalValue = totalValue;

        // Track for performance calculation
        if (!session.state.processedTicks) {
            session.state.processedTicks = [];
        }
        session.state.processedTicks.push({
            timestamp: tickData.timestamp,
            price: tickData.price,
            portfolioValue: totalValue,
        });
    }

    updateSessionMetrics(session) {
        const trades = session.state.trades.filter(t => t.status === 'FILLED');

        session.state.metrics.totalTrades = trades.length;
        session.state.metrics.winningTrades = trades.filter(t => t.pnl && t.pnl > 0).length;
        session.state.metrics.totalPnL =
            session.state.portfolio.totalValue - session.config.initialCapital;

        // Calculate metrics if we have enough data
        if (session.state.processedTicks && session.state.processedTicks.length > 1) {
            this.calculateAdvancedMetrics(session);
        }
    }

    calculateAdvancedMetrics(session) {
        const ticks = session.state.processedTicks;
        const values = ticks.map(t => t.portfolioValue);
        const returns = [];

        for (let i = 1; i < values.length; i++) {
            const dailyReturn = (values[i] - values[i - 1]) / values[i - 1];
            returns.push(dailyReturn);
        }

        session.state.metrics.dailyReturns = returns;

        // Calculate Sharpe ratio (simplified)
        if (returns.length > 0) {
            const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
            const stdDev = Math.sqrt(
                returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / returns.length
            );
            session.state.metrics.sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
        }

        // Calculate max drawdown
        let peak = values[0];
        let maxDrawdown = 0;

        for (const value of values) {
            if (value > peak) peak = value;
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }

        session.state.metrics.maxDrawdown = maxDrawdown;
    }

    checkRiskLimits(session, tickData) {
        const totalValue = session.state.portfolio.totalValue;
        const initialCapital = session.config.initialCapital;
        const drawdown = (initialCapital - totalValue) / initialCapital;

        // Risk limits
        const maxDrawdown = 0.2; // 20% max drawdown
        const maxRiskUtilization = 0.95; // 95% max position size

        if (drawdown > maxDrawdown) {
            session.state.riskEvents.push({
                timestamp: tickData.timestamp,
                type: 'MAX_DRAWDOWN_EXCEEDED',
                value: drawdown,
                limit: maxDrawdown,
            });

            // Could pause session or liquidate positions
            console.warn(`🚨 Risk Alert: Max drawdown exceeded (${(drawdown * 100).toFixed(2)}%)`);
        }

        const riskUtilization = this.calculateRiskUtilization(session);
        if (riskUtilization > maxRiskUtilization) {
            session.state.riskEvents.push({
                timestamp: tickData.timestamp,
                type: 'HIGH_RISK_UTILIZATION',
                value: riskUtilization,
                limit: maxRiskUtilization,
            });
        }
    }

    // Session control methods
    async pauseDemoSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session && session.state.status === 'RUNNING') {
            session.state.status = 'PAUSED';
            this.emit('sessionPaused', { sessionId });
            console.log(`⏸️ Paused demo session ${sessionId}`);
        }
    }

    async resumeDemoSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session && session.state.status === 'PAUSED') {
            session.state.status = 'RUNNING';
            this.emit('sessionResumed', { sessionId });
            console.log(`▶️ Resumed demo session ${sessionId}`);
        }
    }

    async stopDemoSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            await this.completeDemoSession(sessionId);
        }
    }

    async completeDemoSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        session.state.status = 'COMPLETED';
        session.performance.endTime = Date.now();
        session.performance.duration = session.performance.endTime - session.performance.startTime;

        // Final calculations
        this.calculateFinalMetrics(session);

        // Move to history
        this.sessionHistory.push(session);
        this.activeSessions.delete(sessionId);

        console.log(`✅ Completed demo session ${sessionId}`);
        console.log(
            `📊 Final Results: ${session.state.metrics.totalPnL > 0 ? '+' : ''}$${session.state.metrics.totalPnL.toFixed(2)} (${((session.state.metrics.totalPnL / session.config.initialCapital) * 100).toFixed(2)}%)`
        );

        this.emit('sessionCompleted', { sessionId, session });

        return session;
    }

    calculateFinalMetrics(session) {
        const trades = session.state.trades.filter(t => t.status === 'FILLED');
        const sellTrades = trades.filter(t => t.action === 'SELL' && t.pnl !== undefined);

        session.state.metrics.winRate =
            sellTrades.length > 0
                ? (sellTrades.filter(t => t.pnl > 0).length / sellTrades.length) * 100
                : 0;

        session.state.metrics.averageWin =
            sellTrades.length > 0
                ? sellTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) /
                  sellTrades.filter(t => t.pnl > 0).length
                : 0;

        session.state.metrics.averageLoss =
            sellTrades.length > 0
                ? sellTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + Math.abs(t.pnl), 0) /
                  sellTrades.filter(t => t.pnl < 0).length
                : 0;

        session.state.metrics.profitFactor =
            session.state.metrics.averageLoss > 0
                ? session.state.metrics.averageWin / session.state.metrics.averageLoss
                : 0;
    }

    // Getter methods
    getActiveSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }

    getActiveSessions() {
        return Array.from(this.activeSessions.values());
    }

    getSessionHistory() {
        return this.sessionHistory;
    }

    getSessionSummary(sessionId) {
        const session =
            this.activeSessions.get(sessionId) || this.sessionHistory.find(s => s.id === sessionId);

        if (!session) return null;

        return {
            id: session.id,
            config: session.config,
            status: session.state.status,
            metrics: session.state.metrics,
            performance: session.performance,
            currentValue: session.state.portfolio.totalValue,
            totalReturn:
                ((session.state.portfolio.totalValue - session.config.initialCapital) /
                    session.config.initialCapital) *
                100,
        };
    }

    getStatus() {
        return {
            initialized: this.isInitialized,
            activeSessions: this.activeSessions.size,
            completedSessions: this.sessionHistory.length,
            supportedStrategies: this.config.strategies,
            supportedSymbols: this.config.symbols,
        };
    }

    async shutdown() {
        console.log('🛑 Shutting down Demo Trading Interface...');

        // Stop all active sessions
        for (const sessionId of this.activeSessions.keys()) {
            await this.stopDemoSession(sessionId);
        }

        this.removeAllListeners();
        this.isInitialized = false;
        console.log('✅ Demo Trading Interface shutdown complete');
    }

    // Get current positions across all active sessions
    getCurrentPositions() {
        try {
            const allPositions = [];
            for (const [sessionId, session] of this.activeSessions) {
                if (session.status === 'RUNNING' && session.positions) {
                    const sessionPositions = Object.entries(session.positions).map(
                        ([symbol, position]) => ({
                            symbol,
                            quantity: position.quantity,
                            avgPrice: position.averagePrice,
                            currentPrice: position.currentPrice || position.averagePrice,
                            pnl: position.unrealizedPnL || 0,
                            changePercent: position.currentPrice
                                ? ((position.currentPrice - position.averagePrice) /
                                      position.averagePrice) *
                                  100
                                : 0,
                            sessionId,
                        })
                    );
                    allPositions.push(...sessionPositions);
                }
            }
            return allPositions;
        } catch (error) {
            console.error('Error getting current positions from demo interface:', error);
            return [];
        }
    }

    // Get system status
    getSystemStatus() {
        return this.isInitialized ? 'RUNNING' : 'STOPPED';
    }
}

module.exports = DemoTradingInterface;
