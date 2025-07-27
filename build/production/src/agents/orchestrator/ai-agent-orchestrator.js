/**
 * AI Agent Orchestrator
 * Manages and coordinates multiple AI agents for autonomous trading operations
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');

// Import AI Agents
const StrategyAgent = require('../strategy/strategy-agent');
const RiskAgent = require('../risk/risk-agent');
const ExecutionAgent = require('../execution/execution-agent');
const MonitoringAgent = require('../monitoring/monitoring-agent');
const MarketAnalysisAgent = require('../analysis/market-analysis-agent');
const ComplianceAgent = require('../compliance/compliance-agent');

class AIAgentOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            autonomousMode: config.autonomousMode || true,
            agents: config.agents || {},
            mlModels: config.mlModels || {},
            communicationProtocol: config.communicationProtocol || 'event-driven',
            decisionThreshold: config.decisionThreshold || 0.8,
            ...config,
        };

        this.agents = new Map();
        this.agentStates = new Map();
        this.coordinationEngine = null;
        this.isRunning = false;
        this.metrics = {
            totalDecisions: 0,
            successfulActions: 0,
            autonomousActions: 0,
            averageDecisionTime: 0,
            agentPerformance: new Map(),
        };
    }

    async initialize() {
        console.log('🤖 Initializing AI Agent Orchestrator...');

        try {
            // Initialize coordination engine
            await this.initializeCoordinationEngine();

            // Initialize individual agents
            await this.initializeAgents();

            // Setup inter-agent communication
            await this.setupInterAgentCommunication();

            // Start autonomous decision loop
            await this.startAutonomousDecisionLoop();

            this.isRunning = true;
            console.log('✅ AI Agent Orchestrator initialized and running');
        } catch (error) {
            console.error('❌ Failed to initialize AI Agent Orchestrator:', error);
            throw error;
        }
    }

    async initializeCoordinationEngine() {
        this.coordinationEngine = {
            decisionFramework: 'consensus-based',
            votingThreshold: 0.6,
            conflictResolution: 'weighted-priority',
            learningEnabled: true,
            adaptiveWeights: new Map(),
        };

        // Initialize agent priority weights
        this.coordinationEngine.adaptiveWeights.set('strategy', 1.0);
        this.coordinationEngine.adaptiveWeights.set('risk', 1.5); // Risk has higher priority
        this.coordinationEngine.adaptiveWeights.set('execution', 1.2);
        this.coordinationEngine.adaptiveWeights.set('monitoring', 0.8);
        this.coordinationEngine.adaptiveWeights.set('analysis', 1.0);
        this.coordinationEngine.adaptiveWeights.set('compliance', 2.0); // Compliance has highest priority

        console.log('🧠 Coordination engine initialized');
    }

    async initializeAgents() {
        console.log('🤖 Initializing AI agents...');

        const agentConfigs = {
            strategy: {
                enabled: this.config.agents.strategy?.enabled || true,
                inferenceLatency: this.config.agents.strategy?.inferenceLatency || 2000,
                modelPath: this.config.mlModels.strategyModel?.path,
                features: this.config.mlModels.strategyModel?.features || 50,
            },

            risk: {
                enabled: this.config.agents.risk?.enabled || true,
                inferenceLatency: this.config.agents.risk?.inferenceLatency || 1000,
                modelPath: this.config.mlModels.riskModel?.path,
                features: this.config.mlModels.riskModel?.features || 30,
            },

            execution: {
                enabled: this.config.agents.execution?.enabled || true,
                inferenceLatency: this.config.agents.execution?.inferenceLatency || 500,
                modelPath: this.config.mlModels.executionModel?.path,
                features: this.config.mlModels.executionModel?.features || 20,
            },

            monitoring: {
                enabled: this.config.agents.monitoring?.enabled || true,
                checkInterval: 1000,
                alertThresholds: this.config.alertThresholds,
            },

            analysis: {
                enabled: this.config.agents.analysis?.enabled || true,
                analysisDepth: 'comprehensive',
                timeframes: ['1m', '5m', '15m', '1h'],
            },

            compliance: {
                enabled: this.config.agents.compliance?.enabled || true,
                realTimeChecking: true,
                regulatoryRules: 'global',
            },
        };

        // Initialize each agent
        for (const [agentType, config] of Object.entries(agentConfigs)) {
            if (config.enabled) {
                await this.initializeAgent(agentType, config);
            }
        }

        console.log(`✅ Initialized ${this.agents.size} AI agents`);
    }

    async initializeAgent(agentType, config) {
        let agent;

        switch (agentType) {
            case 'strategy':
                agent = new StrategyAgent(config);
                break;
            case 'risk':
                agent = new RiskAgent(config);
                break;
            case 'execution':
                agent = new ExecutionAgent(config);
                break;
            case 'monitoring':
                agent = new MonitoringAgent(config);
                break;
            case 'analysis':
                agent = new MarketAnalysisAgent(config);
                break;
            case 'compliance':
                agent = new ComplianceAgent(config);
                break;
            default:
                throw new Error(`Unknown agent type: ${agentType}`);
        }

        await agent.initialize();

        this.agents.set(agentType, agent);
        this.agentStates.set(agentType, {
            status: 'active',
            lastDecision: null,
            performance: 0.8, // Initial performance score
            decisions: 0,
            successes: 0,
        });

        // Setup agent event listeners
        this.setupAgentEventHandlers(agentType, agent);

        console.log(`🤖 Agent '${agentType}' initialized`);
    }

    setupAgentEventHandlers(agentType, agent) {
        agent.on('decision', decision => {
            this.handleAgentDecision(agentType, decision);
        });

        agent.on('alert', alert => {
            this.handleAgentAlert(agentType, alert);
        });

        agent.on('error', error => {
            this.handleAgentError(agentType, error);
        });

        agent.on('statusUpdate', status => {
            this.updateAgentStatus(agentType, status);
        });
    }

    async setupInterAgentCommunication() {
        console.log('📡 Setting up inter-agent communication...');

        // Create communication channels between agents
        this.communicationChannels = new Map();

        // Strategy ↔ Risk communication
        this.setupBidirectionalChannel('strategy', 'risk');

        // Execution ↔ Risk communication
        this.setupBidirectionalChannel('execution', 'risk');

        // Analysis → Strategy communication
        this.setupUnidirectionalChannel('analysis', 'strategy');

        // Monitoring → All agents
        for (const agentType of this.agents.keys()) {
            if (agentType !== 'monitoring') {
                this.setupUnidirectionalChannel('monitoring', agentType);
            }
        }

        // Compliance → All agents (compliance can override any decision)
        for (const agentType of this.agents.keys()) {
            if (agentType !== 'compliance') {
                this.setupUnidirectionalChannel('compliance', agentType);
            }
        }

        console.log('✅ Inter-agent communication configured');
    }

    setupBidirectionalChannel(agent1, agent2) {
        const channel = {
            type: 'bidirectional',
            agents: [agent1, agent2],
            messageQueue: [],
            latency: 100, // microseconds
        };

        this.communicationChannels.set(`${agent1}-${agent2}`, channel);
        this.communicationChannels.set(`${agent2}-${agent1}`, channel);
    }

    setupUnidirectionalChannel(fromAgent, toAgent) {
        const channel = {
            type: 'unidirectional',
            from: fromAgent,
            to: toAgent,
            messageQueue: [],
            latency: 50, // microseconds
        };

        this.communicationChannels.set(`${fromAgent}-${toAgent}`, channel);
    }

    async startAutonomousDecisionLoop() {
        if (!this.config.autonomousMode) {
            console.log('🔧 Autonomous mode disabled - manual decision mode');
            return;
        }

        console.log('🚀 Starting autonomous decision loop...');

        this.decisionLoop = setInterval(async () => {
            if (this.isRunning) {
                await this.executeAutonomousDecisionCycle();
            }
        }, 10); // 10ms decision cycle for ultra-fast response

        console.log('✅ Autonomous decision loop started');
    }

    async executeAutonomousDecisionCycle() {
        const cycleStart = performance.now();

        try {
            // 1. Gather information from all agents
            const agentInputs = await this.gatherAgentInputs();

            // 2. Coordinate decision-making
            const coordinatedDecision = await this.coordinateDecision(agentInputs);

            // 3. Execute decision if consensus reached
            if (
                coordinatedDecision &&
                coordinatedDecision.confidence >= this.config.decisionThreshold
            ) {
                await this.executeCoordinatedDecision(coordinatedDecision);
                this.metrics.autonomousActions++;
            }

            // 4. Update agent performance metrics
            this.updateAgentPerformanceMetrics();

            this.metrics.totalDecisions++;
        } catch (error) {
            console.error('Error in autonomous decision cycle:', error);
        }

        const cycleTime = performance.now() - cycleStart;
        this.metrics.averageDecisionTime = (this.metrics.averageDecisionTime + cycleTime) / 2;
    }

    async gatherAgentInputs() {
        const inputs = new Map();

        for (const [agentType, agent] of this.agents) {
            try {
                const state = this.agentStates.get(agentType);
                if (state.status === 'active') {
                    const input = await agent.getCurrentInput();
                    inputs.set(agentType, {
                        data: input,
                        confidence: state.performance,
                        timestamp: Date.now(),
                    });
                }
            } catch (error) {
                console.error(`Error gathering input from ${agentType} agent:`, error);
            }
        }

        return inputs;
    }

    async coordinateDecision(agentInputs) {
        if (agentInputs.size === 0) return null;

        // 1. Check for compliance violations first
        const complianceInput = agentInputs.get('compliance');
        if (complianceInput && complianceInput.data.violation) {
            return {
                type: 'COMPLIANCE_OVERRIDE',
                action: 'STOP_TRADING',
                confidence: 1.0,
                reason: complianceInput.data.violation,
                priority: 'CRITICAL',
            };
        }

        // 2. Check risk constraints
        const riskInput = agentInputs.get('risk');
        if (riskInput && riskInput.data.riskLevel === 'HIGH') {
            return {
                type: 'RISK_OVERRIDE',
                action: 'REDUCE_EXPOSURE',
                confidence: 0.9,
                reason: 'High risk detected',
                priority: 'HIGH',
            };
        }

        // 3. Coordinate strategy and execution decisions
        const strategyInput = agentInputs.get('strategy');
        const executionInput = agentInputs.get('execution');

        if (strategyInput && executionInput) {
            return this.coordinateStrategyExecution(strategyInput, executionInput);
        }

        return null;
    }

    coordinateStrategyExecution(strategyInput, executionInput) {
        const strategySignal = strategyInput.data;
        const executionConditions = executionInput.data;

        // Ensure both signals have required properties
        if (!strategySignal || !executionConditions) {
            return null;
        }

        // Calculate weighted confidence
        const strategyWeight = this.coordinationEngine.adaptiveWeights.get('strategy');
        const executionWeight = this.coordinationEngine.adaptiveWeights.get('execution');

        // Use confidence from the signal data or fallback to input confidence
        const strategyConfidence = strategySignal.confidence || strategyInput.confidence || 0.5;
        const executionConfidence =
            executionConditions.confidence || executionInput.confidence || 0.5;

        const combinedConfidence =
            (strategyConfidence * strategyWeight + executionConfidence * executionWeight) /
            (strategyWeight + executionWeight);

        if (combinedConfidence >= this.coordinationEngine.votingThreshold) {
            return {
                type: 'TRADING_DECISION',
                action: strategySignal.action,
                symbol: strategySignal.symbol,
                quantity: this.calculateOptimalQuantity(strategySignal, executionConditions),
                price: executionConditions.optimalPrice,
                confidence: combinedConfidence,
                strategy: strategySignal.strategy,
                execution: executionConditions.method,
            };
        }

        return null;
    }

    calculateOptimalQuantity(strategySignal, executionConditions) {
        const baseQuantity = strategySignal.suggestedQuantity;
        const liquidityFactor = executionConditions.liquidityScore;
        const riskFactor = strategySignal.riskScore;

        return Math.floor(baseQuantity * liquidityFactor * (1 - riskFactor));
    }

    async executeCoordinatedDecision(decision) {
        console.log('🎯 Executing coordinated decision:', decision.type);

        try {
            switch (decision.type) {
                case 'COMPLIANCE_OVERRIDE':
                    await this.executeComplianceOverride(decision);
                    break;
                case 'RISK_OVERRIDE':
                    await this.executeRiskOverride(decision);
                    break;
                case 'TRADING_DECISION':
                    await this.executeTradingDecision(decision);
                    break;
                default:
                    console.warn('Unknown decision type:', decision.type);
            }

            this.metrics.successfulActions++;
            this.emit('decisionExecuted', decision);
        } catch (error) {
            console.error('Failed to execute decision:', error);
            this.emit('decisionFailed', { decision, error });
        }
    }

    async executeComplianceOverride(decision) {
        console.log('🚨 COMPLIANCE OVERRIDE - Stopping all trading operations');

        // Stop all trading agents
        for (const [, agent] of this.agents) {
            if (agent.emergencyStop) {
                await agent.emergencyStop();
            }
        }

        this.emit('complianceAlert', {
            type: 'CRITICAL',
            reason: decision.reason,
            action: 'TRADING_STOPPED',
            timestamp: Date.now(),
        });
    }

    async executeRiskOverride(decision) {
        console.log('⚠️ RISK OVERRIDE - Reducing exposure');

        const riskAgent = this.agents.get('risk');
        if (riskAgent) {
            await riskAgent.executeRiskReduction(decision);
        }

        this.emit('riskAlert', {
            type: 'HIGH_RISK',
            action: decision.action,
            timestamp: Date.now(),
        });
    }

    async executeTradingDecision(decision) {
        console.log(
            `📈 Executing trading decision: ${decision.action} ${decision.quantity} ${decision.symbol} @ ${decision.price}`
        );

        const executionAgent = this.agents.get('execution');
        if (executionAgent) {
            const result = await executionAgent.executeOrder({
                symbol: decision.symbol,
                side: decision.action,
                quantity: decision.quantity,
                price: decision.price,
                strategy: decision.strategy,
                method: decision.execution,
            });

            this.emit('orderExecuted', result);
            return result;
        }
    }

    updateAgentPerformanceMetrics() {
        for (const [agentType] of this.agentStates) {
            const agent = this.agents.get(agentType);
            if (agent && agent.getPerformanceMetrics) {
                const metrics = agent.getPerformanceMetrics();
                this.metrics.agentPerformance.set(agentType, metrics);

                // Update adaptive weights based on performance
                this.updateAdaptiveWeights(agentType, metrics);
            }
        }
    }

    updateAdaptiveWeights(agentType, metrics) {
        const currentWeight = this.coordinationEngine.adaptiveWeights.get(agentType);

        // Adjust weight based on success rate
        const successRate = metrics.successRate || 0.5;
        const adjustment = (successRate - 0.5) * 0.1; // Max ±0.05 adjustment

        const newWeight = Math.max(0.1, Math.min(2.0, currentWeight + adjustment));
        this.coordinationEngine.adaptiveWeights.set(agentType, newWeight);
    }

    handleAgentDecision(agentType, decision) {
        const state = this.agentStates.get(agentType);
        if (state) {
            state.lastDecision = decision;
            state.decisions++;
        }

        this.emit('agentDecision', { agentType, decision });
    }

    handleAgentAlert(agentType, alert) {
        console.log(`🚨 Alert from ${agentType} agent:`, alert);
        this.emit('agentAlert', { agentType, alert });
    }

    handleAgentError(agentType, error) {
        console.error(`❌ Error from ${agentType} agent:`, error);

        // Update agent status
        const state = this.agentStates.get(agentType);
        if (state) {
            state.status = 'error';
            state.performance *= 0.9; // Reduce performance score
        }

        this.emit('agentError', { agentType, error });
    }

    updateAgentStatus(agentType, status) {
        const state = this.agentStates.get(agentType);
        if (state) {
            state.status = status.status || state.status;
            if (status.performance !== undefined) {
                state.performance = status.performance;
            }
        }
    }

    async notifyEmergency(emergencyData) {
        console.log('🚨 EMERGENCY NOTIFICATION:', emergencyData);

        // Notify all agents
        for (const [, agent] of this.agents) {
            if (agent.handleEmergency) {
                await agent.handleEmergency(emergencyData);
            }
        }

        this.emit('emergency', emergencyData);
    }

    getAgentStatus(agentType) {
        if (agentType) {
            return this.agentStates.get(agentType);
        }

        // Return all agent statuses
        const statuses = {};
        for (const [type, state] of this.agentStates) {
            statuses[type] = state;
        }
        return statuses;
    }

    getMetrics() {
        return {
            ...this.metrics,
            agentCount: this.agents.size,
            activeAgents: Array.from(this.agentStates.values()).filter(s => s.status === 'active')
                .length,
            adaptiveWeights: Object.fromEntries(this.coordinationEngine.adaptiveWeights),
            coordinationEngine: {
                decisionFramework: this.coordinationEngine.decisionFramework,
                votingThreshold: this.coordinationEngine.votingThreshold,
            },
        };
    }

    getStatus() {
        if (!this.isRunning) return 'STOPPED';

        const activeAgents = Array.from(this.agentStates.values()).filter(
            s => s.status === 'active'
        ).length;
        const totalAgents = this.agents.size;

        if (activeAgents === 0) return 'CRITICAL';
        if (activeAgents < totalAgents * 0.5) return 'DEGRADED';
        if (activeAgents < totalAgents) return 'WARNING';

        return 'OPTIMAL';
    }

    async shutdown() {
        console.log('🛑 Shutting down AI Agent Orchestrator...');

        this.isRunning = false;

        if (this.decisionLoop) {
            clearInterval(this.decisionLoop);
        }

        // Shutdown all agents
        for (const [agentType, agent] of this.agents) {
            console.log(`Shutting down ${agentType} agent...`);
            if (agent.shutdown) {
                await agent.shutdown();
            }
        }

        console.log('✅ AI Agent Orchestrator shutdown complete');
    }
}

module.exports = AIAgentOrchestrator;
